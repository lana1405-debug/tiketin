"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { 
  LayoutDashboard, Ticket, LogOut, Loader2, 
  PlusCircle, Calendar, Edit2, Trash2,
  ImageIcon, Box, Zap, X, UploadCloud, Tag,
  Banknote, QrCode, Users, Activity, Target, ShieldCheck,
  Landmark, HandCoins, Clock, CheckCircle2, LifeBuoy, MessageSquare, Send,
  Percent, Star, ChevronLeft
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell
} from "recharts";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EODashboard() {
  const router = useRouter();
  const today = getLocalDateString();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eoId, setEoId] = useState<string | null>(null);
  const [eoName, setEoName] = useState("Organizer");
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ⚡ TAB ACTIVE STATE
  const [activeTab, setActiveTab] = useState<"events" | "analytics" | "vouchers" | "feedback">("events");

  // ⚡ STATE ANALYTICS
  const [analyticsDaily, setAnalyticsDaily] = useState<any[]>([]);
  const [analyticsCategories, setAnalyticsCategories] = useState<any[]>([]);

  // ⚡ STATE VOUCHERS
  const [vouchersList, setVouchersList] = useState<any[]>([]);
  const [isVoucherSubmitting, setIsVoucherSubmitting] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    code: "",
    event_id: "",
    discount_type: "percentage",
    discount_value: "",
    max_uses: "",
    valid_from: getLocalDateString(),
    valid_to: ""
  });

  // ⚡ STATE REVIEWS
  const [reviewsList, setReviewsList] = useState<any[]>([]);

  // ⚡ STATE KEUANGAN
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [totalTicketsSold, setTotalTicketsSold] = useState(0);
  const [tierStats, setTierStats] = useState<{name: string, sold: number, rev: number}[]>([]);
  const [withdrawals, setWithdrawals] = useState<Record<string, { status: string, receipt_url: string | null }>>({});

  // ⚡ STATE LIVE CHAT
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [complaintForm, setComplaintForm] = useState({ title: "", message: "" });
  const [isSendingComplaint, setIsSendingComplaint] = useState(false);

  // ⚡ STATE MODAL EVENT & WITHDRAW
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawEvent, setWithdrawEvent] = useState<any>(null);
  const [withdrawForm, setWithdrawForm] = useState({ bank_name: "", account_number: "", account_name: "" });
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "", category: "MUSIK", date: "", end_date: "", start_time: "", location: "", max_buy: "4", description: "",
  });

  const [categories, setCategories] = useState<any[]>([{ id: Date.now(), name: "REGULAR", price: "", stock: "", isNew: true }]);
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<any[]>([]);

  // ⚡ LOGIC MANIPULASI ARRAY KATEGORI (TIER TIKET)
  const addCategory = () => {
    setCategories([...categories, { id: Date.now(), name: "", price: "", stock: "", isNew: true }]);
  };

  const removeCategory = (idToRemove: any) => {
    const cat = categories.find(c => c.id === idToRemove);
    if (cat && !cat.isNew) {
      setDeletedCategoryIds(prev => [...prev, cat.id]);
    }
    setCategories(categories.filter(c => c.id !== idToRemove));
  };

  const updateCategory = (id: any, field: string, value: string) => {
    setCategories(categories.map(cat => cat.id === id ? { ...cat, [field]: value } : cat));
  };

  // ⚡ LOGIC AUTO-GENERATE TIKET TERUSAN (MULTI-DAY PASS)
  const handleGenerateMultiDayPass = (type: '3-DAY' | '2-DAY') => {
    const defaultPrice = type === '3-DAY' ? "750000" : "500000";
    const defaultStock = "500";
    const newCat = {
      id: Date.now(),
      name: `${type} PASS`,
      price: defaultPrice,
      stock: defaultStock,
      isNew: true
    };
    setCategories([...categories, newCat]);
  };

  // ⚡ LOGIC AUTO-GENERATE TIKET HARIAN (DAILY PASSES)
  const handleGenerateDailyPasses = () => {
    const days = getEventDurationInDays();
    const newCats = [];
    for (let i = 1; i <= days; i++) {
      newCats.push({
        id: Date.now() + i,
        name: `DAY ${i} PASS`,
        price: "150000",
        stock: "200",
        isNew: true
      });
    }
    setCategories([...categories, ...newCats]);
  };

  // ⚡ MENGHITUNG DURASI EVENT UNTUK MENAMPILKAN TOMBOL MULTI-DAY
  const getEventDurationInDays = () => {
    if (!formData.date || !formData.end_date) return 1;
    const start = new Date(formData.date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Termasuk hari H
    return diffDays;
  };

  useEffect(() => {
    setMounted(true);
    const fetchEOData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setEoId(session.user.id);
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", session.user.id).single();
      if (profile) setEoName(profile.full_name);
      fetchMyEvents(session.user.id);
      fetchMyComplaints(session.user.id);
    };
    fetchEOData();

    const channel = supabase
      .channel('eo-live-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaint_messages' }, (payload) => {
        setChatMessages((prev) => [...prev, payload.new]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'complaints' }, () => {
         if (eoId) fetchMyComplaints(eoId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router, eoId]);

  const fetchVouchers = async (eventIds: string[]) => {
    if (eventIds.length === 0) {
      setVouchersList([]);
      return;
    }
    const { data } = await supabase
      .from("vouchers")
      .select("*, events(title)")
      .in("event_id", eventIds)
      .order("created_at", { ascending: false });
    if (data) setVouchersList(data);
  };

  const fetchReviews = async (eventIds: string[]) => {
    if (eventIds.length === 0) {
      setReviewsList([]);
      return;
    }
    const { data } = await supabase
      .from("reviews")
      .select("*, events(title), profiles(full_name)")
      .in("event_id", eventIds)
      .order("created_at", { ascending: false });
    if (data) setReviewsList(data);
  };

  const fetchSalesAnalytics = async (eventIds: string[]) => {
    if (eventIds.length === 0) {
      setAnalyticsDaily([]);
      setAnalyticsCategories([]);
      return;
    }
    const { data, error } = await supabase
      .from("transaksi")
      .select("total_bayar, total_qty, created_at, category_id, ticket_categories(name)")
      .in("event_id", eventIds)
      .eq("status_pembayaran", "paid")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Gagal fetch analytics:", error);
      return;
    }

    // Group revenue by day
    const revByDay: Record<string, number> = {};
    // Group category performance
    const catSales: Record<string, { name: string, sold: number, revenue: number }> = {};

    data?.forEach(tx => {
      const dateStr = getLocalDateString(new Date(tx.created_at));
      revByDay[dateStr] = (revByDay[dateStr] || 0) + Number(tx.total_bayar);

      const catName = (Array.isArray(tx.ticket_categories)
        ? tx.ticket_categories[0]?.name
        : (tx.ticket_categories as any)?.name) || "Unknown";
      if (!catSales[catName]) {
        catSales[catName] = { name: catName, sold: 0, revenue: 0 };
      }
      catSales[catName].sold += Number(tx.total_qty || 1);
      catSales[catName].revenue += Number(tx.total_bayar);
    });

    const dailyData = Object.entries(revByDay).map(([date, revenue]) => ({
      date,
      revenue
    }));

    const catData = Object.values(catSales);

    setAnalyticsDaily(dailyData);
    setAnalyticsCategories(catData);
  };

  const fetchMyEvents = async (id: string) => {
    setIsLoading(true);
    const { data: eventData } = await supabase.from("events").select("*").eq("organizer_id", id).order("created_at", { ascending: false });
    const { data: withdrawData } = await supabase.from("withdrawals").select("event_id, status, net_amount, receipt_url").eq("organizer_id", id);
    
    const wMap: Record<string, { status: string, receipt_url: string | null }> = {};
    let cairCount = 0;
    withdrawData?.forEach(w => {
      wMap[w.event_id] = { status: w.status, receipt_url: w.receipt_url };
      if (w.status === 'completed') cairCount += Number(w.net_amount || 0);
    });
    setWithdrawals(wMap);
    setTotalWithdrawn(cairCount);

    if (eventData && eventData.length > 0) {
      const eventIds = eventData.map(e => e.id);
      const { data: ticketData } = await supabase.from("tiket").select(`id, event_id, ticket_categories(name, price), transaksi!inner(status_pembayaran)`).in("event_id", eventIds).eq("transaksi.status_pembayaran", "paid");
      
      let totalRev = 0;
      let eventRevenues: Record<string, number> = {};
      let tStats: any = {};
      
      if (ticketData) {
        setTotalTicketsSold(ticketData.length);
        ticketData.forEach((t: any) => {
          const price = Number(t.ticket_categories?.price || 0);
          totalRev += price;
          if (!eventRevenues[t.event_id]) eventRevenues[t.event_id] = 0;
          eventRevenues[t.event_id] += price;
          const tName = t.ticket_categories?.name || "Unknown";
          if (!tStats[tName]) tStats[tName] = { name: tName, sold: 0, rev: 0 };
          tStats[tName].sold += 1;
          tStats[tName].rev += price;
        });
        setTotalRevenue(totalRev);
        setTierStats(Object.values(tStats));
      }
      setEvents(eventData.map(e => ({ ...e, revenue: eventRevenues[e.id] || 0 })));
      
      // Fetch vouchers, reviews, and analytics
      fetchVouchers(eventIds);
      fetchReviews(eventIds);
      fetchSalesAnalytics(eventIds);
      setVoucherForm(prev => ({ ...prev, event_id: prev.event_id || eventData[0].id }));
    } else { 
      setEvents([]); 
      setVouchersList([]);
      setReviewsList([]);
      setAnalyticsDaily([]);
      setAnalyticsCategories([]);
    }
    setIsLoading(false);
  };

  const fetchMyComplaints = async (userId: string) => {
    const { data } = await supabase.from("complaints").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (data) setMyComplaints(data);
  };

  const openChatThread = async (complaint: any) => {
    setSelectedComplaint(complaint);
    const { data } = await supabase.from("complaint_messages").select("*").eq("complaint_id", complaint.id).order("created_at", { ascending: true });
    if (data) setChatMessages(data);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput || !selectedComplaint) return;
    await supabase.from("complaint_messages").insert([{ complaint_id: selectedComplaint.id, sender_id: eoId, message: chatInput, is_admin: false }]);
    setChatInput("");
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingComplaint(true);
    const { error } = await supabase.from("complaints").insert([{ user_id: eoId, title: complaintForm.title, message: complaintForm.message, status: "pending" }]);
    if (!error) {
      alert("Laporan terkirim!");
      setComplaintForm({ title: "", message: "" });
      fetchMyComplaints(eoId!);
    }
    setIsSendingComplaint(false);
  };

  const handleSubmitVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherForm.code || !voucherForm.event_id || !voucherForm.discount_value || !voucherForm.valid_to) {
      return alert("Harap isi semua kolom wajib!");
    }

    setIsVoucherSubmitting(true);
    try {
      const payload = {
        code: voucherForm.code.toUpperCase().replace(/\s+/g, ""),
        event_id: voucherForm.event_id,
        discount_type: voucherForm.discount_type,
        discount_value: Number(voucherForm.discount_value),
        max_uses: voucherForm.max_uses ? Number(voucherForm.max_uses) : null,
        valid_from: new Date(voucherForm.valid_from).toISOString(),
        valid_to: new Date(voucherForm.valid_to).toISOString(),
        uses_count: 0
      };

      const { error } = await supabase.from("vouchers").insert([payload]);
      if (error) throw error;

      alert("Voucher berhasil dibuat!");
      setVoucherForm({
        code: "",
        event_id: events[0]?.id || "",
        discount_type: "percentage",
        discount_value: "",
        max_uses: "",
        valid_from: getLocalDateString(),
        valid_to: ""
      });
      const eventIds = events.map(e => e.id);
      fetchVouchers(eventIds);
    } catch (err: any) {
      alert("Gagal membuat voucher: " + err.message);
    } finally {
      setIsVoucherSubmitting(false);
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!confirm("Hapus voucher ini?")) return;
    const { error } = await supabase.from("vouchers").delete().eq("id", id);
    if (error) {
      alert("Gagal menghapus voucher: " + error.message);
    } else {
      alert("Voucher berhasil dihapus!");
      const eventIds = events.map(e => e.id);
      fetchVouchers(eventIds);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert("Maksimal 2MB "); return; }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eoId) return;

    // Validasi tanggal real-time
    const todayStr = getLocalDateString();
    if (formData.date < todayStr) {
      return alert("Bro, tanggal mulai tidak boleh di masa lalu!");
    }
    if (formData.end_date && formData.end_date < formData.date) {
      return alert("Bro, tanggal selesai tidak boleh sebelum tanggal mulai!");
    }

    for (let cat of categories) { if (!cat.name || !cat.price || !cat.stock) return alert("Bro, data kategori tiket masih ada yang kosong!"); }
    setIsSubmitting(true);
    try {
      let finalImageUrl = imagePreview; 
      if (imageFile) {
        const fileName = `${eoId}-${Date.now()}.png`;
        const filePath = `event-banners/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('event_images').upload(filePath, imageFile);
        if (uploadError) throw new Error("Gagal upload gambar: " + uploadError.message);
        const { data: { publicUrl } } = supabase.storage.from('event_images').getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      }
      const minPrice = Math.min(...categories.map(c => Number(c.price)));
      const totalStock = categories.reduce((acc, c) => acc + Number(c.stock), 0);
      const payload = { 
        title: formData.title, 
        category: formData.category, 
        date: formData.date, 
        end_date: formData.end_date || null, 
        start_time: formData.start_time || null, 
        location: formData.location, 
        price: minPrice, 
        stock: totalStock, 
        max_buy: Number(formData.max_buy), 
        description: formData.description || null, 
        image_url: finalImageUrl, 
        organizer_id: eoId, 
        status: "pending" 
      };
      
      if (editingEventId) {
        const { error: err } = await supabase.from("events").update(payload).eq("id", editingEventId);
        if (err) throw err;

        // Sinkronisasi kategori tiket
        if (deletedCategoryIds.length > 0) {
          const { error: delErr } = await supabase
            .from("ticket_categories")
            .delete()
            .in("id", deletedCategoryIds);
          if (delErr) throw delErr;
        }

        const categoriesToInsert = categories
          .filter(cat => cat.isNew)
          .map(cat => ({
            event_id: editingEventId,
            name: cat.name,
            price: Number(cat.price),
            stock: Number(cat.stock)
          }));

        const categoriesToUpdate = categories
          .filter(cat => !cat.isNew)
          .map(cat => ({
            id: cat.id,
            event_id: editingEventId,
            name: cat.name,
            price: Number(cat.price),
            stock: Number(cat.stock)
          }));

        if (categoriesToInsert.length > 0) {
          const { error: insErr } = await supabase
            .from("ticket_categories")
            .insert(categoriesToInsert);
          if (insErr) throw insErr;
        }

        if (categoriesToUpdate.length > 0) {
          const { error: upsertErr } = await supabase
            .from("ticket_categories")
            .upsert(categoriesToUpdate);
          if (upsertErr) throw upsertErr;
        }
      } else {
        const { data: eventData, error: err } = await supabase.from("events").insert([payload]).select().single();
        if (err) throw err;
        const categoryInserts = categories.map(cat => ({ event_id: eventData.id, name: cat.name, price: Number(cat.price), stock: Number(cat.stock) }));
        await supabase.from("ticket_categories").insert(categoryInserts);
      }
      closeModal(); fetchMyEvents(eoId);
    } catch (err: any) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const openEditModal = async (event: any) => {
    setEditingEventId(event.id);
    setFormData({ 
      title: event.title, 
      category: event.category || "MUSIK", 
      date: event.date, 
      end_date: event.end_date || "", 
      start_time: event.start_time || "", 
      location: event.location, 
      max_buy: event.max_buy?.toString() || "4", 
      description: event.description || "" 
    });

    const { data: catData, error } = await supabase
      .from("ticket_categories")
      .select("*")
      .eq("event_id", event.id);

    if (error) {
      alert("Gagal mengambil data kategori tiket: " + error.message);
    } else if (catData && catData.length > 0) {
      setCategories(catData.map(c => ({
        id: c.id,
        name: c.name,
        price: c.price.toString(),
        stock: c.stock.toString(),
        isNew: false
      })));
    } else {
      setCategories([{ id: Date.now(), name: "REGULAR", price: event.price.toString(), stock: event.stock.toString(), isNew: true }]);
    }

    setImagePreview(event.image_url); setImageFile(null); setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false); setEditingEventId(null);
    setFormData({ title: "", category: "MUSIK", date: "", end_date: "", start_time: "", location: "", max_buy: "4", description: "" });
    setCategories([{ id: Date.now(), name: "REGULAR", price: "", stock: "", isNew: true }]);
    setDeletedCategoryIds([]);
    setImageFile(null); setImagePreview(null);
  };

  const openWithdrawModal = (event: any) => { setWithdrawEvent(event); setWithdrawForm({ bank_name: "", account_number: "", account_name: "" }); setIsWithdrawModalOpen(true); };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsWithdrawing(true);
    try {
      const gross = withdrawEvent.revenue;
      const fee = Math.round(gross * 0.15);
      const net = gross - fee;
      const { error } = await supabase.from("withdrawals").insert([{ 
        event_id: withdrawEvent.id, 
        organizer_id: eoId, 
        gross_amount: gross, 
        platform_fee: fee, 
        net_amount: net, 
        bank_name: withdrawForm.bank_name, 
        account_number: withdrawForm.account_number, 
        account_name: withdrawForm.account_name, 
        status: "pending" 
      }]);
      if (error) throw error;
      alert("Pengajuan terkirim!"); setIsWithdrawModalOpen(false); fetchMyEvents(eoId!);
    } catch (err: any) { alert(err.message); } finally { setIsWithdrawing(false); }
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka || 0);

  if (!mounted) return null;

  return (
    <main className={`min-h-screen bg-white flex flex-col xl:flex flex-col md:flex-row ${poppins.className} text-black`}>
      {/* SIDEBAR */}
      <aside className="w-full xl:w-80 bg-white border-r-8 border-black xl:min-h-screen flex flex-col p-8 z-20 shrink-0 text-left">
        <div className="mb-12 flex items-center gap-3">
          <div className="bg-[#6D4AFF] p-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-6deg]">
            <Zap className="text-amber-400" size={24} strokeWidth={3} />
          </div>
          <span className="text-3xl font-black italic uppercase tracking-tighter -skew-x-12 leading-none">Tiketin.</span>
        </div>
        <nav className="flex-grow space-y-4">
          <button className="w-full flex items-center gap-4 bg-black text-white px-6 py-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(109,74,255,1)] font-black uppercase italic text-xs tracking-widest translate-x-[-2px] translate-y-[-2px]">
            <LayoutDashboard size={20} /> Control Room
          </button>
          <button onClick={() => alert("Pilih event di tabel, lalu klik 'Scanner'")} className="w-full flex items-center gap-4 bg-amber-400 text-black px-6 py-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-black uppercase italic text-xs tracking-widest hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            <QrCode size={20} /> Scan Check-In
          </button>
          <button onClick={() => setIsComplaintModalOpen(true)} className="w-full flex items-center gap-4 bg-white text-black px-6 py-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-black uppercase italic text-xs tracking-widest hover:translate-x-1 transition-all">
            <LifeBuoy size={20} /> Live Support
          </button>
          <Link href="/explore" className="w-full flex items-center gap-4 bg-white text-black px-6 py-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-black uppercase italic text-xs tracking-widest hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            <Ticket size={20} /> Lihat Stage
          </Link>
        </nav>
        <div className="border-t-8 border-black pt-8 mt-auto hidden xl:block">
           <div className="bg-black text-white p-4 border-2 border-black font-black uppercase italic text-[9px] flex items-center gap-2 mb-4">
              <ShieldCheck size={14} className="text-emerald-400"/> EO Account Verified
           </div>
          <button onClick={() => { supabase.auth.signOut(); router.push("/login"); }} className="w-full flex items-center justify-center gap-3 bg-red-500 text-white p-4 border-4 border-black font-black uppercase italic text-xs tracking-widest shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            <LogOut size={18} /> Exit Matrix
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-6 md:p-12 xl:p-16 bg-[#FCFAF1] overflow-y-auto max-h-screen relative text-left">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, black 2px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="max-w-7xl mx-auto space-y-12 relative z-10">
          
          <div className="flex flex-col md:flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-black pb-8">
            <div>
              <div className="bg-[#6D4AFF] text-white border-2 border-black px-3 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 shadow-[4px_4px_0px_0px_#000] mb-4">
                <Target size={14} strokeWidth={3} /> Event Organizer OS
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
                AGENT <span className="text-amber-400 drop-shadow-[2px_2px_0_#000]">{eoName.split(' ')[0]}.</span>
              </h1>
              <p className="text-slate-500 font-bold italic text-lg mt-4 max-w-xl">Pantau pergerakan penjualan dan atur amunisi event lo di sini.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-black text-white border-4 border-black px-8 py-5 font-black uppercase italic text-sm shadow-[8px_8px_0px_0px_#6D4AFF] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all flex items-center gap-3 shrink-0">
              <PlusCircle size={22} strokeWidth={3} className="text-amber-400" /> DEPLOY NEW EVENT
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-emerald-400 border-8 border-black p-8 shadow-[12px_12px_0_0_#000] relative overflow-hidden group">
              <Banknote size={150} className="absolute -bottom-6 -right-6 opacity-20 text-black group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] italic mb-2 text-black/60">Estimasi Saldo Tersedia (Net)</p>
                <h2 className="text-4xl sm:text-5xl lg:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic -skew-x-6 tracking-tighter leading-none pr-4 pb-1">
                  {formatRupiah((totalRevenue * 0.85) - totalWithdrawn)}
                </h2>
                <div className="mt-4 flex flex-wrap gap-4">
                    <div className="bg-black/10 px-3 py-1 border-2 border-black/20 text-[10px] font-black italic uppercase">Gross: {formatRupiah(totalRevenue)}</div>
                    <div className="bg-white/40 px-3 py-1 border-2 border-black/20 text-[10px] font-black italic uppercase text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 size={12}/> Sudah Cair: {formatRupiah(totalWithdrawn)}
                    </div>
                </div>
              </div>
            </div>
            <div className="bg-white border-8 border-black p-8 shadow-[12px_12px_0_0_#6D4AFF] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] italic">Audience Matrix</p>
                <Users size={32} strokeWidth={3} />
              </div>
              <div className="mt-8 text-left">
                <h2 className="text-7xl font-black italic tracking-tighter leading-none">{totalTicketsSold}</h2>
                <p className="text-sm font-black uppercase italic mt-2">Tiket Terdistribusi</p>
              </div>
            </div>
          </div>

          {/* ⚡ TAB NAVIGATION */}
          <div className="flex border-b-4 border-black mb-8 gap-4 overflow-x-auto pb-2 shrink-0">
            <button
              onClick={() => setActiveTab("events")}
              className={`px-6 py-4 border-4 border-black font-black uppercase italic text-xs tracking-wider transition-all shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] cursor-pointer ${
                activeTab === "events" ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              <span className="flex items-center gap-2"><LayoutDashboard size={14}/> Operation Log</span>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-6 py-4 border-4 border-black font-black uppercase italic text-xs tracking-wider transition-all shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] cursor-pointer ${
                activeTab === "analytics" ? "bg-[#6D4AFF] text-white" : "bg-white text-black"
              }`}
            >
              <span className="flex items-center gap-2"><Activity size={14}/> Sales Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab("vouchers")}
              className={`px-6 py-4 border-4 border-black font-black uppercase italic text-xs tracking-wider transition-all shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] cursor-pointer ${
                activeTab === "vouchers" ? "bg-amber-400 text-black" : "bg-white text-black"
              }`}
            >
              <span className="flex items-center gap-2"><Percent size={14}/> Promo Voucher</span>
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              className={`px-6 py-4 border-4 border-black font-black uppercase italic text-xs tracking-wider transition-all shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] cursor-pointer ${
                activeTab === "feedback" ? "bg-emerald-400 text-black" : "bg-white text-black"
              }`}
            >
              <span className="flex items-center gap-2"><Star size={14}/> Feedback Ulasan</span>
            </button>
          </div>

          {/* ⚡ TAB 1: OPERATION LOG (EVENTS) */}
          {activeTab === "events" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 text-left">
              <div className="xl:col-span-4 bg-black text-white border-8 border-black p-8 shadow-[12px_12px_0px_0px_#FCD34D]">
                 <div className="flex items-center gap-3 mb-8 pb-4 border-b-4 border-white/20">
                    <Tag size={24} className="text-amber-400" />
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Tier Insight</h3>
                 </div>
                 <div className="space-y-6">
                   {tierStats.length === 0 ? <p className="text-xs font-black uppercase text-white/50 italic text-center py-10">Belum ada penjualan man.</p> : tierStats.sort((a,b) => b.rev - a.rev).map((tier, idx) => (
                      <div key={idx} className="bg-white/10 p-4 border-2 border-white hover:bg-white/20 transition-colors">
                        <div className="flex justify-between items-end mb-2">
                          <span className="font-black italic uppercase text-lg text-amber-400">{tier.name}</span>
                          <span className="font-black italic text-xs">{tier.sold} Lbr</span>
                        </div>
                        <p className="font-black text-xl italic tracking-tighter text-emerald-400">{formatRupiah(tier.rev)}</p>
                      </div>
                   ))}
                 </div>
              </div>

              <div className="xl:col-span-8 bg-white border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col">
                <div className="bg-[#6D4AFF] text-white p-6 border-b-8 border-black flex justify-between items-center">
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter">Operation Log</h3>
                  <span className="bg-black px-3 py-1 border-2 border-white text-[9px] font-black uppercase italic tracking-widest">{events.length} Events</span>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-black text-[10px] font-black uppercase tracking-[0.2em] border-b-4 border-black text-left">
                        <th className="p-6 border-r-4 border-black">Deploy Details</th>
                        <th className="p-6 border-r-4 border-black">Timeline & Status Duit</th>
                        <th className="p-6 text-center">Execution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-4 divide-black">
                      {isLoading ? <tr><td colSpan={3} className="p-24 text-center font-black italic text-2xl uppercase tracking-widest text-[#6D4AFF] animate-pulse">Syncing Database...</td></tr> : events.map((event) => {
                        const wStatus = withdrawals[event.id];
                        return (
                          <tr key={event.id} className="hover:bg-amber-50 transition-colors">
                            <td className="p-6 border-r-4 border-black text-left">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden shrink-0">
                                   {event.image_url ? <img src={event.image_url} className="w-full h-full object-cover" alt="Poster" /> : <ImageIcon size={20} className="m-auto mt-5 text-slate-300" />}
                                </div>
                                <div>
                                  <span className="font-black text-lg uppercase italic -skew-x-3 block leading-none mb-1 line-clamp-1">{event.title}</span>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`text-[8px] font-black px-2 py-0.5 border border-black uppercase italic ${event.status === 'approved' ? 'bg-emerald-400' : 'bg-amber-400'}`}>{event.status}</span>
                                    <span className="text-[8px] font-black px-2 py-0.5 border border-black uppercase italic bg-black text-white">{event.category || 'EVENT'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-6 border-r-4 border-black font-black uppercase italic text-[10px] space-y-2 text-slate-600 text-left">
                              <div className="flex items-center gap-2 text-left"><Calendar size={14} className="text-black" /> {event.date}</div>
                              <div className="mt-2 text-left">
                                <p className="text-[8px] text-slate-400 uppercase">Gross Revenue</p>
                                <div className="text-lg tracking-tighter text-[#6D4AFF] leading-none mb-2">{formatRupiah(event.revenue)}</div>
                                {event.revenue > 0 && wStatus?.status && (
                                  <div className="flex flex-col gap-1.5 items-start">
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-black text-[8px] font-black uppercase italic shadow-[2px_2px_0_0_#000] ${
                                      wStatus.status === 'pending' ? 'bg-amber-100 text-amber-600' : wStatus.status === 'processing' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                                    }`}>
                                      {wStatus.status === 'pending' ? <Clock size={10}/> : wStatus.status === 'processing' ? <Loader2 size={10} className="animate-spin"/> : <CheckCircle2 size={10}/>}
                                      {wStatus.status === 'pending' ? "Menunggu Admin" : wStatus.status === 'processing' ? "Sedang Ditransfer" : "Dana Cair / Selesai"}
                                    </div>
                                    {wStatus.status === 'completed' && wStatus.receipt_url && (
                                      <a
                                        href={wStatus.receipt_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase italic bg-[#6D4AFF] text-white px-2 py-0.5 border border-black shadow-[2px_2px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                                      >
                                        Lihat Bukti Transfer 🧾
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-6 text-center">
                              <div className="flex flex-col gap-2">
                                {event.revenue > 0 && !wStatus?.status && (
                                  <button onClick={() => openWithdrawModal(event)} className="w-full bg-emerald-400 text-black border-2 border-black p-2 font-black italic uppercase text-[9px] shadow-[2px_2px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"><HandCoins size={14} /> Cairkan Cuan</button>
                                )}
                                {event.status === 'approved' && (
                                  <button onClick={() => window.open(`/gate/${event.id}`, '_blank')} className="w-full bg-amber-400 border-2 border-black p-2 font-black italic uppercase text-[9px] shadow-[2px_2px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"><QrCode size={14} /> Scanner</button>
                                )}
                                <div className="flex gap-2 text-black">
                                  <button onClick={() => openEditModal(event)} className="flex-1 bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex justify-center"><Edit2 size={14} strokeWidth={3} /></button>
                                  <button onClick={() => { if(confirm("Hapus?")) supabase.from("events").delete().eq("id", event.id).then(() => fetchMyEvents(eoId!)) }} className="flex-1 bg-white border-2 border-black p-2 text-red-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex justify-center"><Trash2 size={14} strokeWidth={3} /></button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ⚡ TAB 2: SALES ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
              <div className="lg:col-span-8 bg-white border-8 border-black p-8 shadow-[12px_12px_0_0_#000] flex flex-col">
                <h3 className="text-2xl font-black italic uppercase mb-6 tracking-tighter border-b-4 border-black pb-2 flex items-center gap-2">
                  <Activity size={24} /> Tren Pendapatan Harian (IDR)
                </h3>
                {analyticsDaily.length === 0 ? (
                  <div className="h-80 flex items-center justify-center font-black uppercase text-slate-400 italic">Belum ada data penjualan.</div>
                ) : (
                  <div className="h-80 w-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsDaily} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                        <XAxis dataKey="date" stroke="#000" tick={{ fontWeight: 'bold', fontSize: 10 }} />
                        <YAxis stroke="#000" tick={{ fontWeight: 'bold', fontSize: 10 }} tickFormatter={(v) => `Rp ${v/1000}k`} />
                        <Tooltip formatter={(value) => [formatRupiah(value as number), 'Revenue']} contentStyle={{ background: '#fff', border: '4px solid #000', fontWeight: 'bold' }} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" name="Pendapatan" stroke="#6D4AFF" strokeWidth={4} activeDot={{ r: 8, stroke: '#000', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="lg:col-span-4 bg-white border-8 border-black p-8 shadow-[12px_12px_0_0_#FCD34D] flex flex-col">
                <h3 className="text-2xl font-black italic uppercase mb-6 tracking-tighter border-b-4 border-black pb-2 flex items-center gap-2">
                  <Ticket size={24} /> Per Kategori Tiket
                </h3>
                {analyticsCategories.length === 0 ? (
                  <div className="h-80 flex items-center justify-center font-black uppercase text-slate-400 italic">Belum ada data penjualan.</div>
                ) : (
                  <div className="h-80 w-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsCategories} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                        <XAxis dataKey="name" stroke="#000" tick={{ fontWeight: 'bold', fontSize: 10 }} />
                        <YAxis stroke="#000" tick={{ fontWeight: 'bold', fontSize: 10 }} />
                        <Tooltip formatter={(value, name) => [value, name === 'sold' ? 'Terjual (Pcs)' : 'Pendapatan (IDR)']} contentStyle={{ background: '#fff', border: '4px solid #000', fontWeight: 'bold' }} />
                        <Bar dataKey="sold" name="Terjual" fill="#FCD34D" stroke="#000" strokeWidth={3}>
                          {analyticsCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#FCD34D' : '#6D4AFF'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ⚡ TAB 3: PROMO VOUCHER */}
          {activeTab === "vouchers" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 text-left">
              {/* Form Bikin Voucher */}
              <div className="xl:col-span-4 bg-white border-8 border-black p-8 shadow-[12px_12px_0_0_#FCD34D]">
                <h3 className="text-2xl font-black italic uppercase mb-6 tracking-tighter border-b-4 border-black pb-2 flex items-center gap-2">
                  <PlusCircle size={24} /> Bikin Voucher Baru
                </h3>
                <form onSubmit={handleSubmitVoucher} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 italic">Kode Promo</label>
                    <input
                      type="text"
                      required
                      placeholder="MISAL: TIKETASIK10"
                      className="w-full p-3 border-4 border-black font-black uppercase italic bg-white outline-none focus:bg-amber-50"
                      value={voucherForm.code}
                      onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 italic">Event Terkait</label>
                    <select
                      className="w-full p-3 border-4 border-black font-black uppercase bg-white cursor-pointer outline-none"
                      value={voucherForm.event_id}
                      onChange={(e) => setVoucherForm({ ...voucherForm, event_id: e.target.value })}
                    >
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 italic">Jenis Diskon</label>
                      <select
                        className="w-full p-3 border-4 border-black font-black uppercase bg-white cursor-pointer outline-none"
                        value={voucherForm.discount_type}
                        onChange={(e) => setVoucherForm({ ...voucherForm, discount_type: e.target.value })}
                      >
                        <option value="percentage">Persentase (%)</option>
                        <option value="fixed">Potongan (Rp)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 italic">Nilai Diskon</label>
                      <input
                        type="number"
                        required
                        placeholder={voucherForm.discount_type === "percentage" ? "10" : "50000"}
                        className="w-full p-3 border-4 border-black font-black bg-white outline-none"
                        value={voucherForm.discount_value}
                        onChange={(e) => setVoucherForm({ ...voucherForm, discount_value: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 italic">Kuota Penggunaan</label>
                      <input
                        type="number"
                        placeholder="Tak terbatas"
                        className="w-full p-3 border-4 border-black font-black bg-white outline-none"
                        value={voucherForm.max_uses}
                        onChange={(e) => setVoucherForm({ ...voucherForm, max_uses: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 italic">Tanggal Berakhir</label>
                      <input
                        type="date"
                        required
                        min={today}
                        className="w-full p-3 border-4 border-black font-black bg-white outline-none"
                        value={voucherForm.valid_to}
                        onChange={(e) => setVoucherForm({ ...voucherForm, valid_to: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isVoucherSubmitting}
                    className="w-full py-4 bg-black text-white font-black uppercase italic text-xs tracking-wider border-4 border-black shadow-[4px_4px_0_0_#6D4AFF] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {isVoucherSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Zap className="text-amber-400" size={16} />}
                    {isVoucherSubmitting ? "MEMPROSES..." : "SEBARKAN VOUCHER"}
                  </button>
                </form>
              </div>

              {/* List Voucher */}
              <div className="xl:col-span-8 bg-white border-8 border-black shadow-[12px_12px_0_0_#000] overflow-hidden flex flex-col">
                <div className="bg-[#6D4AFF] text-white p-6 border-b-8 border-black flex justify-between items-center">
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter">Voucher List</h3>
                  <span className="bg-black px-3 py-1 border-2 border-white text-[9px] font-black uppercase italic tracking-widest">{vouchersList.length} Active Vouchers</span>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-black text-[10px] font-black uppercase tracking-[0.2em] border-b-4 border-black text-left">
                        <th className="p-6 border-r-4 border-black">Kode & Event</th>
                        <th className="p-6 border-r-4 border-black">Spesifikasi Diskon</th>
                        <th className="p-6 border-r-4 border-black">Kuota & Masa Berlaku</th>
                        <th className="p-6 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-4 divide-black">
                      {vouchersList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-24 text-center font-black italic text-xl uppercase tracking-widest text-[#6D4AFF]">
                            Belum ada voucher yang dibuat.
                          </td>
                        </tr>
                      ) : (
                        vouchersList.map((v) => {
                          const isExpired = new Date(v.valid_to) < new Date();
                          const isFull = v.max_uses !== null && v.uses_count >= v.max_uses;
                          return (
                            <tr key={v.id} className="hover:bg-amber-50 transition-colors">
                              <td className="p-6 border-r-4 border-black text-left">
                                <span className="font-black text-xl tracking-tighter bg-amber-200 border-2 border-black px-2 py-0.5 shadow-[2px_2px_0_0_#000] inline-block mb-2">
                                  {v.code}
                                </span>
                                <p className="text-[10px] font-bold text-slate-500 uppercase line-clamp-1">Event: {v.events?.title || "Global Event"}</p>
                              </td>
                              <td className="p-6 border-r-4 border-black text-left font-black uppercase italic text-xs">
                                {v.discount_type === "percentage" ? (
                                  <span className="text-[#6D4AFF] font-black text-lg">{v.discount_value}% OFF</span>
                                ) : (
                                  <span className="text-emerald-600 font-black text-lg">-{formatRupiah(v.discount_value)}</span>
                                )}
                              </td>
                              <td className="p-6 border-r-4 border-black text-left text-[10px] font-bold uppercase space-y-1 text-slate-600">
                                <div>Terpakai: {v.uses_count} / {v.max_uses ?? "∞"}</div>
                                <div className="flex items-center gap-1">
                                  <Clock size={12} />
                                  Selesai: {getLocalDateString(new Date(v.valid_to))}
                                </div>
                                <div className="mt-2">
                                  {isExpired ? (
                                    <span className="bg-red-100 text-red-500 border border-red-500 px-2 py-0.5 text-[8px] font-black uppercase italic">Expired</span>
                                  ) : isFull ? (
                                    <span className="bg-orange-100 text-orange-500 border border-orange-500 px-2 py-0.5 text-[8px] font-black uppercase italic">Penuh</span>
                                  ) : (
                                    <span className="bg-emerald-100 text-emerald-600 border border-emerald-500 px-2 py-0.5 text-[8px] font-black uppercase italic">Aktif</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-6 text-center">
                                <button
                                  onClick={() => handleDeleteVoucher(v.id)}
                                  className="bg-red-100 hover:bg-red-500 text-red-500 hover:text-white border-2 border-black p-2 shadow-[2px_2px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                                >
                                  <Trash2 size={16} strokeWidth={3} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ⚡ TAB 4: FEEDBACK ULASAN */}
          {activeTab === "feedback" && (
            <div className="bg-white border-8 border-black shadow-[12px_12px_0_0_#000] overflow-hidden flex flex-col text-left">
              <div className="bg-[#6D4AFF] text-white p-6 border-b-8 border-black flex justify-between items-center">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Feedback & Ulasan</h3>
                <span className="bg-black px-3 py-1 border-2 border-white text-[9px] font-black uppercase italic tracking-widest">{reviewsList.length} Reviews</span>
              </div>
              <div className="p-8 space-y-6">
                {reviewsList.length === 0 ? (
                  <div className="p-12 text-center font-black italic text-xl uppercase tracking-widest text-[#6D4AFF] border-4 border-dashed border-slate-300 bg-slate-50">
                    Belum ada ulasan dari pembeli.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviewsList.map((rev) => (
                      <div key={rev.id} className="bg-[#FCFAF1] border-4 border-black p-6 shadow-[6px_6px_0_0_#000] hover:-translate-y-1 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-black text-lg uppercase italic -skew-x-2 leading-none line-clamp-1">{rev.profiles?.full_name || "Customer"}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Event: {rev.events?.title}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-black text-amber-400 px-2 py-1 border-2 border-black font-black text-xs">
                            <Star className="fill-amber-400 text-amber-400" size={14} />
                            {rev.rating}
                          </div>
                        </div>
                        <p className="text-slate-700 italic font-medium text-sm">"{rev.comment}"</p>
                        <div className="mt-4 text-[9px] text-slate-400 font-bold uppercase text-right">
                          {new Date(rev.created_at).toLocaleDateString("id-ID", { dateStyle: "long" })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ⚡ MODAL LIVE CHAT SUPPORT */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[110] text-black">
          <div className="bg-white border-8 border-black w-full max-w-5xl h-[85vh] shadow-[20px_20px_0_0_#6D4AFF] flex flex-col overflow-hidden">
            <div className="p-6 border-b-8 border-black flex justify-between items-center bg-amber-400 shrink-0">
               <div className="flex items-center gap-4"><LifeBuoy size={32} strokeWidth={3} /><h2 className="text-3xl font-black italic uppercase tracking-tighter">Support <span className="text-white">Live.</span></h2></div>
               <button onClick={() => setIsComplaintModalOpen(false)} className="p-2 border-4 border-black hover:bg-red-500 bg-white"><X size={24} strokeWidth={4} /></button>
            </div>
            <div className="flex-1 flex overflow-hidden">
               <div className="w-80 border-r-8 border-black flex flex-col bg-slate-50 overflow-y-auto custom-scrollbar shrink-0">
                  <div className="p-6 space-y-6 text-left">
                     <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase italic text-slate-400">Bikin Laporan</h3>
                        <input type="text" placeholder="JUDUL..." className="w-full p-3 border-4 border-black text-[10px] font-black outline-none bg-white" value={complaintForm.title} onChange={e => setComplaintForm({...complaintForm, title: e.target.value})} />
                        <textarea placeholder="PESAN..." rows={3} className="w-full p-3 border-4 border-black text-[10px] font-bold outline-none bg-white" value={complaintForm.message} onChange={e => setComplaintForm({...complaintForm, message: e.target.value})} />
                        <button onClick={handleCreateComplaint} disabled={isSendingComplaint} className="w-full py-3 bg-black text-white font-black italic text-[10px] shadow-[4px_4px_0_0_#6D4AFF] hover:translate-x-1 transition-all">{isSendingComplaint ? 'SENDING...' : 'KIRIM LAPORAN'}</button>
                     </div>
                     <div className="h-1 bg-black w-full" />
                     <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase italic text-slate-400">Riwayat Tiket</h3>
                        {myComplaints.map(c => (
                           <div key={c.id} onClick={() => openChatThread(c)} className={`p-4 border-4 border-black cursor-pointer transition-all ${selectedComplaint?.id === c.id ? 'bg-white shadow-[4px_4px_0_0_#6D4AFF] -translate-y-1' : 'bg-slate-100 hover:bg-white shadow-[2px_2px_0_0_#000]'}`}>
                              <p className="text-[10px] font-black uppercase truncate italic">{c.title}</p>
                              <div className={`mt-2 text-[8px] font-black px-2 py-0.5 border border-black inline-block uppercase ${c.status === 'resolved' ? 'bg-emerald-400' : 'bg-amber-400'}`}>{c.status}</div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="flex-1 flex flex-col bg-[#FCFAF1] relative text-left">
                  {!selectedComplaint ? (
                    <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-300 font-black uppercase italic">Pilih laporan buat Live Chat</div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar flex flex-col">
                         <div className="bg-black text-white p-4 border-4 border-black self-start max-w-[80%] shadow-[4px_4px_0_0_#6D4AFF]"><p className="text-[8px] font-black text-amber-400 uppercase mb-1">LAPORAN AWAL:</p><p className="text-sm font-bold italic">"{selectedComplaint.message}"</p></div>
                         {chatMessages.map((msg, i) => (
                           <div key={i} className={`flex flex-col ${msg.is_admin ? 'items-start' : 'items-end'}`}>
                              <div className={`p-4 border-4 border-black max-w-[75%] shadow-[4px_4px_0_0_#000] ${msg.is_admin ? 'bg-white' : 'bg-[#6D4AFF] text-white'}`}>
                                 <p className={`text-[8px] font-black uppercase mb-1 ${msg.is_admin ? 'text-[#6D4AFF]' : 'text-purple-200'}`}>
                                    {msg.is_admin ? 'Admin Tiketin' : 'LO'}
                                 </p>
                                 <p className="text-sm font-bold italic">{msg.message}</p>
                              </div>
                              <span className="text-[8px] font-bold text-slate-400 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</span>
                           </div>
                         ))}
                      </div>
                      {selectedComplaint.status !== 'resolved' && (
                        <form onSubmit={handleSendChatMessage} className="p-6 border-t-8 border-black bg-white flex gap-4 shrink-0">
                           <input type="text" placeholder="BALAS ADMIN..." className="flex-1 p-4 border-4 border-black font-black italic uppercase text-xs outline-none" value={chatInput} onChange={e => setChatInput(e.target.value)} />
                           <button type="submit" className="bg-black text-white px-6 border-4 border-black shadow-[4px_4px_0_0_#6D4AFF] hover:translate-x-1 transition-all"><Send size={20} /></button>
                        </form>
                      )}
                    </>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚡ MODAL WITHDRAW */}
      {isWithdrawModalOpen && withdrawEvent && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] text-black">
          <div className="bg-white border-8 border-black p-8 md:p-12 w-full max-w-2xl shadow-[20px_20px_0px_0px_rgba(109,74,255,1)] relative max-h-[95vh] overflow-y-auto text-left">
            <button onClick={() => setIsWithdrawModalOpen(false)} className="absolute top-6 right-6 p-2 border-4 border-black hover:bg-red-500 bg-white"><X size={24} strokeWidth={4} /></button>
            <div className="flex items-center gap-4 mb-8 text-left"><div className="bg-emerald-400 p-3 border-4 border-black shadow-[4px_4px_0_0_#000]"><Landmark size={32} /></div><div><h2 className="text-4xl font-black italic uppercase -skew-x-6 tracking-tighter leading-none">Tarik <span className="text-emerald-500">Cuan.</span></h2><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Event: {withdrawEvent.title}</p></div></div>
            <div className="bg-slate-100 border-4 border-black p-6 mb-8 space-y-4 text-left">
               <div className="flex justify-between items-center pb-4 border-b-2 border-slate-300 font-bold text-sm uppercase italic"><span>Gross</span><span>{formatRupiah(withdrawEvent.revenue)}</span></div>
               <div className="flex justify-between items-center pb-4 border-b-2 border-slate-300 text-red-500 font-bold text-sm uppercase italic"><span>Fee (15%)</span><span>- {formatRupiah(withdrawEvent.revenue * 0.15)}</span></div>
               <div className="flex justify-between items-center pt-2 text-emerald-600 font-black text-lg uppercase italic"><span>Net Dana Diterima</span><span className="text-3xl tracking-tighter bg-emerald-100 px-4 py-1 border-2 border-emerald-500">{formatRupiah(withdrawEvent.revenue - (withdrawEvent.revenue * 0.15))}</span></div>
            </div>
            <form onSubmit={handleWithdrawSubmit} className="space-y-6 text-left">
              <div><label className="text-xs font-black uppercase text-slate-400 mb-2 block italic">Bank / Wallet</label><input type="text" placeholder="BCA / MANDIRI / GOPAY" required className="w-full p-4 border-4 border-black bg-white font-black italic uppercase shadow-[4px_4px_0_0_#000] outline-none focus:bg-emerald-50" value={withdrawForm.bank_name} onChange={e => setWithdrawForm({...withdrawForm, bank_name: e.target.value})} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="text-xs font-black uppercase text-slate-400 mb-2 block italic">No Rekening</label><input type="number" required className="w-full p-4 border-4 border-black bg-white font-black italic shadow-[4px_4px_0_0_#000] outline-none" value={withdrawForm.account_number} onChange={e => setWithdrawForm({...withdrawForm, account_number: e.target.value})} /></div>
                <div><label className="text-xs font-black uppercase text-slate-400 mb-2 block italic">Nama Pemilik</label><input type="text" required className="w-full p-4 border-4 border-black bg-white font-black italic uppercase shadow-[4px_4px_0_0_#000] outline-none" value={withdrawForm.account_name} onChange={e => setWithdrawForm({...withdrawForm, account_name: e.target.value})} /></div>
              </div>
              <div className="pt-4 flex gap-4"><button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="px-8 py-5 bg-white border-4 border-black font-black uppercase italic shadow-[4px_4px_0_0_#000] hover:bg-slate-50">Batal</button><button type="submit" disabled={isWithdrawing} className="flex-1 py-5 bg-emerald-400 text-black border-4 border-black font-black uppercase italic shadow-[6px_6px_0_0_#000] hover:translate-x-1 transition-all">{isWithdrawing ? "PROCESSING..." : "AJUKAN PENCAIRAN"}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ⚡ MODAL EVENT (SIAPKAN PANGGUNG) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] text-black text-left">
          <div className="bg-white border-8 border-black p-8 md:p-12 w-full max-w-4xl shadow-[20px_20px_0px_0px_rgba(109,74,255,1)] relative max-h-[95vh] overflow-y-auto custom-scrollbar">
            <button onClick={closeModal} className="absolute top-6 right-6 p-2 border-4 border-black hover:bg-red-500 transition-colors bg-white z-10"><X size={28} strokeWidth={4} /></button>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase mb-8 -skew-x-6 tracking-tighter text-left underline decoration-8 decoration-[#6D4AFF]">{editingEventId ? "Edit Panggung" : "Siapkan Panggung"}</h2>
            <form onSubmit={handleSubmitEvent} className="text-left space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 border-4 border-black p-6">
                <div className="space-y-6 text-left">
                  <div><label className="text-xs font-black uppercase text-slate-400 mb-2 block italic text-left">Nama Event</label><input type="text" required className="w-full p-4 border-4 border-black bg-white font-black italic uppercase shadow-[4px_4px_0_0_rgba(0,0,0,1)] outline-none focus:bg-amber-50" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
                  <div><label className="text-xs font-black uppercase text-slate-400 mb-2 block italic text-left">Kategori</label><select className="w-full p-4 border-4 border-black bg-white font-black italic uppercase shadow-[4px_4px_0_0_rgba(0,0,0,1)] cursor-pointer" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}><option value="MUSIK">MUSIK</option><option value="TEATER">TEATER</option><option value="FESTIVAL">FESTIVAL</option><option value="LAINNYA">LAINNYA</option></select></div>
                  <div>
                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block italic tracking-widest text-left">Poster Panggung (Maks 2MB)</label>
                    <div className="flex gap-4">
                      <div className="w-[120px] h-[120px] border-4 border-black bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">{imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <UploadCloud size={32} className="text-slate-300" />}</div>
                      <div onClick={() => fileInputRef.current?.click()} className="flex-1 border-4 border-dashed border-black bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors text-center p-2"><p className="text-[10px] font-black uppercase tracking-widest text-black">{imageFile ? imageFile.name : "Ganti Poster"}</p><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} /></div>
                    </div>
                  </div>
                  <div><label className="text-xs font-black uppercase text-slate-400 mb-2 block italic text-left">Lokasi Venue</label><input type="text" required className="w-full p-4 border-4 border-black bg-white font-black italic uppercase shadow-[4px_4px_0_0_rgba(0,0,0,1)] outline-none focus:bg-amber-50" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /></div>
                </div>
                <div className="space-y-6 text-black flex flex-col justify-between text-left">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block italic text-left">Tgl Mulai</label><input type="date" required min={today} className="w-full p-4 border-4 border-black bg-white font-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] cursor-text" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} /></div>
                    <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block italic text-left">Tgl Selesai (Ops)</label><input type="date" min={formData.date || today} className="w-full p-4 border-4 border-black bg-white font-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} /></div>
                    <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block italic text-left">Jam Mulai</label><input type="time" className="w-full p-4 border-4 border-black bg-white font-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} /></div>
                    <div><label className="text-[10px] font-black uppercase text-[#FF6B6B] mb-1 block italic text-left">Maks Beli/Akun</label><input type="number" required className="w-full p-4 border-4 border-black bg-red-50 font-black shadow-[4px_4px_0_0_rgba(239,68,68,1)]" value={formData.max_buy} onChange={(e) => setFormData({...formData, max_buy: e.target.value})} /></div>
                  </div>
                  <div><label className="text-xs font-black uppercase text-slate-400 mb-2 block italic text-left">Deskripsi Event</label><textarea rows={5} className="w-full p-4 border-4 border-black bg-white font-medium shadow-[4px_4px_0_0_rgba(0,0,0,1)] outline-none focus:bg-amber-50" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
                </div>
              </div>
              <div className="bg-amber-400 border-8 border-black p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] space-y-4 text-left">
                <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-6">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2"><Tag size={24}/> Kategori Tiket</h3>
                  <div className="flex gap-2">
                    {/* ⚡ TOMBOL UNTUK MULTI-DAY PASS (MUNCUL JIKA EVENT LEBIH DARI 1 HARI) */}
                    {getEventDurationInDays() > 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="bg-emerald-400 text-black px-4 py-2 border-2 border-black font-black uppercase italic text-[10px] shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-1 transition-all flex items-center gap-1">
                            <PlusCircle size={12}/> Multi-Day
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="z-[200] bg-white border-4 border-black rounded-none shadow-[8px_8px_0_0_#000]">
                          {getEventDurationInDays() >= 2 && <DropdownMenuItem onClick={() => handleGenerateMultiDayPass('2-DAY')} className="font-black italic text-xs uppercase cursor-pointer hover:bg-emerald-100">Bikin Tiket Terusan 2 Hari</DropdownMenuItem>}
                          {getEventDurationInDays() >= 3 && <DropdownMenuItem onClick={() => handleGenerateMultiDayPass('3-DAY')} className="font-black italic text-xs uppercase cursor-pointer hover:bg-emerald-100">Bikin Tiket Terusan 3 Hari</DropdownMenuItem>}
                          <DropdownMenuItem onClick={handleGenerateDailyPasses} className="font-black italic text-xs uppercase cursor-pointer hover:bg-emerald-100">Bikin Tiket Harian</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <button type="button" onClick={addCategory} className="bg-black text-white px-4 py-2 border-2 border-black font-black uppercase italic text-[10px] shadow-[4px_4px_0_0_rgba(255,255,255,1)] hover:translate-x-1 transition-all">Tambah Tier</button>
                  </div>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {categories.map((cat, index) => (
                    <div key={cat.id} className="bg-white border-4 border-black p-4 relative flex flex-col md:flex flex-col md:flex-row gap-4 items-center group shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                      <div className="absolute -top-3 -left-3 bg-black text-white px-2 py-1 font-black italic text-[9px] uppercase border-2 border-black">Tier {index + 1}</div>
                      <div className="flex-1 w-full mt-2 md:mt-0"><label className="text-[9px] font-black uppercase text-slate-400 italic block text-left">Nama Kategori</label><input type="text" value={cat.name} onChange={e => updateCategory(cat.id, 'name', e.target.value)} className="w-full p-2 border-2 border-black font-black italic uppercase text-sm" placeholder="FESTIVAL" /></div>
                      <div className="flex-1 w-full"><label className="text-[9px] font-black uppercase text-slate-400 italic block text-left">Harga (Rp)</label><input type="number" value={cat.price} onChange={e => updateCategory(cat.id, 'price', e.target.value)} className="w-full p-2 border-2 border-black font-black italic uppercase text-sm text-[#6D4AFF]" placeholder="50000" /></div>
                      <div className="w-full md:w-32"><label className="text-[9px] font-black uppercase text-slate-400 italic block text-left">Stok</label><input type="number" value={cat.stock} onChange={e => updateCategory(cat.id, 'stock', e.target.value)} className="w-full p-2 border-2 border-black font-black italic uppercase text-sm" placeholder="100" /></div>
                      {categories.length > 1 && (<button type="button" onClick={() => removeCategory(cat.id)} className="w-full md:w-auto mt-4 bg-red-100 text-red-500 border-2 border-black p-2 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20} strokeWidth={3} /></button>)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex flex-col md:flex-row gap-6 pt-4"><button type="button" onClick={closeModal} className="flex-1 py-5 bg-white border-4 border-black font-black uppercase italic text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 transition-all">Batal</button><button type="submit" disabled={isSubmitting} className="flex-[2] py-5 bg-[#6D4AFF] text-white border-4 border-black font-black uppercase italic text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-2 transition-all flex items-center justify-center">{isSubmitting ? <><Loader2 className="animate-spin mr-2"/> SENDING...</> : (editingEventId ? "SIMPAN PERUBAHAN" : "KIRIM PENGAJUAN EVENT")}</button></div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
