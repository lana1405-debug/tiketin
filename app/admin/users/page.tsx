"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Search, 
  Trash2, 
  Mail, 
  ShieldAlert, 
  Loader2,
  Zap,
  Filter,
  X,
  MessageSquare,
  Star,
  DollarSign,
  Calendar,
  MapPin,
  Ticket,
  Clock
} from "lucide-react";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("all"); 
  const [mounted, setMounted] = useState(false);

  // States for detailed slide-over
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<{ totalSpent: number; tickets: any[] }>({ totalSpent: 0, tickets: [] });
  const [eoDetails, setEoDetails] = useState<{ events: any[]; totalRevenue: number }>({ events: [], totalRevenue: 0 });
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeEventTitle, setActiveEventTitle] = useState<string>("");
  const [subView, setSubView] = useState<"main" | "reviews" | "chats">("main");
  const [activeEventReviews, setActiveEventReviews] = useState<any[]>([]);
  const [activeEventChats, setActiveEventChats] = useState<any[]>([]);
  const [isDeletingChat, setIsDeletingChat] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchUsers();
  }, [filterRole]);

  const fetchUsers = async () => {
    setLoading(true);
    
    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterRole !== "all") {
      query = query.eq("role", filterRole);
    }

    const { data, error } = await query;

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const deleteUser = async (id: string) => {
    if (confirm("Hapus akun ini secara permanen, Man? Tindakan ini gak bisa dibatalin!")) {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (!error) fetchUsers();
      else alert("Gagal hapus: " + error.message);
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  const loadCustomerDetails = async (userId: string) => {
    setDetailLoading(true);
    setSubView("main");
    try {
      // 1. Fetch total spent
      const { data: txs } = await supabase
        .from("transaksi")
        .select("total_bayar")
        .eq("user_id", userId)
        .eq("status_pembayaran", "paid");
      
      const totalSpent = txs?.reduce((acc, curr) => acc + (Number(curr.total_bayar) || 0), 0) || 0;

      // 2. Fetch tickets
      const { data: ticketData, error } = await supabase
        .from("tiket")
        .select(`
          id,
          ticket_code,
          seat_info,
          status_checkin,
          last_scanned_date,
          checked_in_at,
          events (
            title,
            date,
            location
          ),
          transaksi!inner (
            status_pembayaran,
            total_bayar
          )
        `)
        .eq("transaksi.user_id", userId)
        .eq("transaksi.status_pembayaran", "paid")
        .order("created_at", { ascending: false });

      const formattedTickets = (ticketData || []).map((t: any) => ({
        id: t.id,
        ticket_code: t.ticket_code,
        seat_info: t.seat_info || "GENERAL ADMISSION",
        status_checkin: t.status_checkin,
        last_scanned_date: t.last_scanned_date,
        checked_in_at: t.checked_in_at,
        event_title: t.events?.title || "Unknown Event",
        event_date: t.events?.date || "N/A",
        event_location: t.events?.location || "N/A"
      }));

      setCustomerDetails({
        totalSpent,
        tickets: formattedTickets
      });
    } catch (err) {
      console.error("Error loading customer details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadEoDetails = async (userId: string) => {
    setDetailLoading(true);
    setSubView("main");
    try {
      // 1. Fetch events
      const { data: events } = await supabase
        .from("events")
        .select("id, title, price, date, location, category")
        .eq("organizer_id", userId)
        .order("created_at", { ascending: false });

      if (!events || events.length === 0) {
        setEoDetails({ events: [], totalRevenue: 0 });
        setDetailLoading(false);
        return;
      }

      const eventIds = events.map(e => e.id);

      // 2. Fetch transactions
      const { data: txs } = await supabase
        .from("transaksi")
        .select("event_id, total_bayar")
        .in("event_id", eventIds)
        .eq("status_pembayaran", "paid");

      // Calculate revenue
      const revMap: Record<string, number> = {};
      let totalRevenue = 0;
      txs?.forEach(tx => {
        const val = Number(tx.total_bayar) || 0;
        revMap[tx.event_id] = (revMap[tx.event_id] || 0) + val;
        totalRevenue += val;
      });

      const eventsWithRevenue = events.map(e => ({
        ...e,
        revenue: revMap[e.id] || 0
      }));

      setEoDetails({
        events: eventsWithRevenue,
        totalRevenue
      });
    } catch (err) {
      console.error("Error loading EO details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadEventReviews = async (eventId: string, eventTitle: string) => {
    setDetailLoading(true);
    setActiveEventId(eventId);
    setActiveEventTitle(eventTitle);
    setSubView("reviews");
    try {
      const { data } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          comment,
          created_at,
          profiles (
            full_name
          )
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      setActiveEventReviews(data || []);
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadEventChats = async (eventId: string, eventTitle: string, quiet = false) => {
    if (!quiet) setDetailLoading(true);
    setActiveEventId(eventId);
    setActiveEventTitle(eventTitle);
    setSubView("chats");
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", `chat_messages_${eventId}`)
        .maybeSingle();
      
      const chats = data && Array.isArray(data.value) ? data.value : [];
      setActiveEventChats((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(chats)) return prev;
        return chats;
      });
    } catch (err) {
      console.error("Error loading chats:", err);
    } finally {
      if (!quiet) setDetailLoading(false);
    }
  };

  const deleteChatMessage = async (msgId: string) => {
    if (!confirm("Tarik pesan ini dari grup chat?")) return;
    setIsDeletingChat(msgId);
    try {
      // Fetch current list
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", `chat_messages_${activeEventId}`)
        .maybeSingle();

      const chats = data && Array.isArray(data.value) ? data.value : [];
      const updatedChats = chats.filter((m: any) => m.id !== msgId);

      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: `chat_messages_${activeEventId}`,
          value: updatedChats
        });

      if (error) {
        alert("Gagal menarik pesan: " + error.message);
      } else {
        setActiveEventChats(updatedChats);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsDeletingChat(null);
    }
  };

  // Real-time chat sync & polling
  useEffect(() => {
    if (subView !== "chats" || !activeEventId) return;

    const channel = supabase
      .channel(`admin_event_chats_${activeEventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_settings",
          filter: `key=eq.chat_messages_${activeEventId}`
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newValue = payload.new?.value;
            if (Array.isArray(newValue)) {
              setActiveEventChats((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(newValue)) return prev;
                return newValue;
              });
            }
          } else if (payload.eventType === "DELETE") {
            setActiveEventChats([]);
          }
        }
      )
      .subscribe();

    const pollInterval = setInterval(() => {
      loadEventChats(activeEventId, activeEventTitle, true);
    }, 2500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [subView, activeEventId, activeEventTitle]);

  if (!mounted) return null;

  return (
    <div className={`space-y-12 pb-20 ${poppins.className} text-black text-left`}>
      
      {/* HEADER BRUTAL */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-black pb-10">
        <div className="space-y-4">
          <div className="bg-[#6D4AFF] text-white border-2 border-black px-4 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <ShieldAlert size={14} /> Security Level: Admin
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
            User <span className="text-[#6D4AFF]">Base.</span>
          </h1>
          <p className="text-lg font-bold text-slate-500 italic max-w-xl">
            Manajemen otorisasi akun. Hati-hati pas hapus data, 
          </p>
        </div>

        {/* ROLE FILTER BRUTAL */}
        <div className="flex flex-wrap bg-black p-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(109,74,255,1)]">
          {['all', 'admin', 'eo', 'customer'].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-6 py-3 font-black uppercase italic text-[10px] tracking-widest transition-all ${
                filterRole === role 
                ? "bg-[#6D4AFF] text-white" 
                : "text-slate-400 hover:text-white"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </header>

      {/* TABLE USERS BRUTAL */}
      <div className="bg-white border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="p-8 border-r border-white/20">Identitas Akun</th>
                <th className="p-8 border-r border-white/20">Otoritas / Role</th>
                <th className="p-8 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-black">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-32 text-center font-black italic text-2xl uppercase tracking-widest text-[#6D4AFF]">
                    <Loader2 className="animate-spin mx-auto mb-4" size={48} />
                    Scanning Database...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-32 text-center font-black italic text-slate-300 text-xl uppercase">
                    Data Tidak Ditemukan.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-8 border-r-4 border-black">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(109,74,255,1)] flex items-center justify-center font-black text-2xl italic text-[#6D4AFF] -rotate-3 group-hover:rotate-0 transition-transform">
                          {user.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-2">{user.full_name}</p>
                          <div className="flex items-center gap-2 text-slate-400 font-bold text-xs italic">
                            <Mail size={12} /> {user.email || "no-email@tiketin.com"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-8 border-r-4 border-black">
                      <div className={`px-6 py-2 border-4 border-black font-black uppercase italic text-[10px] tracking-[0.2em] flex items-center gap-3 w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                        user.role === 'admin' ? 'bg-[#6D4AFF] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' :
                        user.role === 'eo' ? 'bg-amber-400 text-black' : 'bg-white text-black'
                      }`}>
                        {user.role === 'admin' ? <ShieldCheck size={16} strokeWidth={3}/> : <UserCheck size={16} strokeWidth={3}/>}
                        {user.role || 'customer'}
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            if (user.role === "eo") {
                              loadEoDetails(user.id);
                            } else {
                              loadCustomerDetails(user.id);
                            }
                          }}
                          className="bg-amber-400 border-2 border-black p-4 text-xs font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2"
                        >
                          Detail
                        </button>
                        <a 
                          href={`mailto:${user.email}`}
                          className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center"
                        >
                          <Mail size={20} strokeWidth={3} />
                        </a>
                        {user.role !== 'admin' && (
                          <button 
                            onClick={() => deleteUser(user.id)}
                            className="bg-white border-2 border-black p-4 text-red-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center"
                          >
                            <Trash2 size={20} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER BRUTAL */}
      <footer className="pt-10 flex items-center justify-center gap-4 text-slate-300">
         <div className="h-[2px] w-20 bg-slate-200" />
         <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Tiketin User Database // Admin Only</span>
         <div className="h-[2px] w-20 bg-slate-200" />
      </footer>

      {/* ========================================== */}
      {/* USER DETAIL DRAWER (SLIDE-OVER FROM RIGHT) */}
      {/* ========================================== */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => {
              setSelectedUser(null);
              setSubView("main");
            }} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Panel */}
          <div className="relative w-full max-w-2xl h-full bg-[#FCFAF1] border-l-8 border-black shadow-[-10px_0_0_0_rgba(0,0,0,0.15)] flex flex-col z-10 overflow-hidden text-black">
            
            {/* Header */}
            <div className="p-6 border-b-8 border-black bg-white flex justify-between items-center shrink-0">
              <div className="text-left space-y-1">
                <span className="bg-[#6D4AFF] text-white border-2 border-black px-3 py-0.5 text-[9px] font-black uppercase italic shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  USER PROFILE DETAIL
                </span>
                <h3 className="text-2xl font-black italic uppercase -skew-x-6 tracking-tighter">
                  {selectedUser.full_name}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase italic">
                  Role: {selectedUser.role} • {selectedUser.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSubView("main");
                }}
                className="p-3 border-4 border-black bg-white text-black hover:bg-red-500 hover:text-white shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 brutal-scroll bg-slate-50">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 font-black italic text-lg uppercase">
                  <Loader2 className="animate-spin text-[#6D4AFF]" size={40} strokeWidth={4} />
                  Scanning database ledgers...
                </div>
              ) : (
                <>
                  {/* CUSTOMER PROFILE VIEW */}
                  {selectedUser.role !== 'eo' && (
                    <div className="space-y-8">
                      {/* Stat Card */}
                      <div className="bg-black text-white border-8 border-black p-8 shadow-[8px_8px_0_0_#6D4AFF] relative overflow-hidden group">
                        <div className="absolute top-[-20px] right-[-20px] opacity-10 group-hover:skew-x-6 transition-transform">
                          <DollarSign size={140} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6D4AFF] italic mb-2">Total Dana Dibelanjakan</p>
                        <h2 className="text-4xl font-black italic -skew-x-6 tracking-tighter text-white">
                          {formatRupiah(customerDetails.totalSpent)}
                        </h2>
                        <span className="text-[9px] font-bold text-slate-400 uppercase italic mt-2 block">
                          Akumulasi seluruh transaksi tiket sukses terbayar
                        </span>
                      </div>

                      {/* Tiket yang Sukses Dibeli */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b-4 border-black pb-2">
                          <Ticket size={20} strokeWidth={3} />
                          <h4 className="text-lg font-black uppercase italic -skew-x-3">
                            Tiket Sukses Dibeli ({customerDetails.tickets.length})
                          </h4>
                        </div>
                        
                        {customerDetails.tickets.length === 0 ? (
                          <p className="text-xs text-slate-400 italic uppercase font-bold text-left">Belum pernah melakukan transaksi tiket.</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {customerDetails.tickets.map((ticket) => (
                              <div key={ticket.id} className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] flex justify-between items-center text-left">
                                <div>
                                  <h5 className="font-black text-sm uppercase italic -skew-x-3">{ticket.event_title}</h5>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                    Kursi: {ticket.seat_info} • Kode: {ticket.ticket_code}
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">
                                    Tanggal: {ticket.event_date} • Lokasi: {ticket.event_location}
                                  </p>
                                </div>
                                <div className="bg-emerald-400 text-black border-2 border-black px-3 py-1 font-black text-[9px] uppercase italic shadow-[2px_2px_0_0_#000]">
                                  Lunas / Paid
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Event yang Dihadiri */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b-4 border-black pb-2">
                          <UserCheck size={20} strokeWidth={3} />
                          <h4 className="text-lg font-black uppercase italic -skew-x-3">
                            Event yang Didatangi / Scan ({customerDetails.tickets.filter(t => t.status_checkin).length})
                          </h4>
                        </div>
                        
                        {customerDetails.tickets.filter(t => t.status_checkin).length === 0 ? (
                          <p className="text-xs text-slate-400 italic uppercase font-bold text-left">Belum ada tiket yang ter-scan (belum mendatangi event).</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {customerDetails.tickets.filter(t => t.status_checkin).map((ticket) => (
                              <div key={ticket.id} className="bg-[#6D4AFF] text-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] flex justify-between items-center text-left">
                                <div>
                                  <h5 className="font-black text-sm uppercase italic -skew-x-3">{ticket.event_title}</h5>
                                  <p className="text-[10px] text-purple-200 font-bold uppercase mt-1">
                                    Kursi: {ticket.seat_info}
                                  </p>
                                  {ticket.checked_in_at && (
                                    <p className="text-[9px] text-purple-200 font-bold uppercase">
                                      Waktu Scan: {new Date(ticket.checked_in_at).toLocaleString("id-ID")}
                                    </p>
                                  )}
                                </div>
                                <div className="bg-white text-black border-2 border-black px-3 py-1 font-black text-[9px] uppercase italic shadow-[2px_2px_0_0_#000]">
                                  Scanned / Hadir
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* EO PROFILE VIEW */}
                  {selectedUser.role === 'eo' && (
                    <div className="space-y-8">
                      {subView === "main" && (
                        <>
                          {/* Financial summary card */}
                          <div className="bg-[#6D4AFF] text-white border-8 border-black p-8 shadow-[8px_8px_0_0_#000] relative overflow-hidden group">
                            <div className="absolute -bottom-6 -right-6 opacity-10 rotate-12 transition-transform">
                              <Zap size={150} fill="white" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200 italic mb-2">Total Pendapatan Tiket (Gross)</p>
                            <h2 className="text-4xl font-black italic -skew-x-6 tracking-tighter text-white mb-2 text-left">
                              {formatRupiah(eoDetails.totalRevenue)}
                            </h2>
                            <div className="bg-black text-emerald-400 border-2 border-white px-3 py-1.5 font-black text-[10px] uppercase italic shadow-[3px_3px_0_0_#fff] inline-block">
                              Pendapatan Bersih (85%): {formatRupiah(eoDetails.totalRevenue * 0.85)}
                            </div>
                            <span className="text-[9px] font-bold text-purple-200 uppercase italic mt-3 block text-left">
                              Potongan komisi platform Tiketin 15% otomatis dikurangkan
                            </span>
                          </div>

                          {/* list of events created */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b-4 border-black pb-2">
                              <Calendar size={20} strokeWidth={3} />
                              <h4 className="text-lg font-black uppercase italic -skew-x-3">
                                Event yang Dibuat ({eoDetails.events.length})
                              </h4>
                            </div>

                            {eoDetails.events.length === 0 ? (
                              <p className="text-xs text-slate-400 italic uppercase font-bold text-left">EO ini belum membuat event.</p>
                            ) : (
                              <div className="grid grid-cols-1 gap-6">
                                {eoDetails.events.map((event) => (
                                  <div key={event.id} className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] text-left space-y-4">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="bg-black text-amber-400 border border-black px-2 py-0.5 text-[8px] font-black uppercase italic">
                                          {event.category || 'EVENT'}
                                        </span>
                                        <h5 className="font-black text-xl uppercase italic -skew-x-3 mt-1.5">{event.title}</h5>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                          📅 {event.date} • 📍 {event.location}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Event financials */}
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border-2 border-black">
                                      <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kotor / Gross</p>
                                        <p className="text-sm font-black text-[#6D4AFF]">{formatRupiah(event.revenue)}</p>
                                      </div>
                                      <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bersih (85%)</p>
                                        <p className="text-sm font-black text-emerald-600">{formatRupiah(event.revenue * 0.85)}</p>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3 pt-2">
                                      <button
                                        onClick={() => loadEventReviews(event.id, event.title)}
                                        className="bg-white hover:bg-slate-100 border-2 border-black px-4 py-2 font-black uppercase italic text-[10px] shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5"
                                      >
                                        <Star size={12} strokeWidth={3} className="text-amber-500 fill-amber-500" /> Lihat Ulasan
                                      </button>
                                      <button
                                        onClick={() => loadEventChats(event.id, event.title)}
                                        className="bg-[#6D4AFF] text-white hover:bg-[#553cbf] border-2 border-black px-4 py-2 font-black uppercase italic text-[10px] shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5"
                                      >
                                        <MessageSquare size={12} strokeWidth={3} /> Moderasi Chat
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Event Reviews sub-view */}
                      {subView === "reviews" && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b-4 border-black pb-4">
                            <button
                              onClick={() => setSubView("main")}
                              className="bg-black text-white border-2 border-black px-3 py-1 text-[9px] font-black uppercase italic shadow-[2.5px_2.5px_0_0_#6D4AFF] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                            >
                              ← Kembali ke Event
                            </button>
                            <span className="text-[10px] font-black uppercase bg-amber-400 border-2 border-black px-2 py-1 shadow-[2px_2px_0_0_#000] max-w-[180px] truncate">
                              ⭐ {activeEventTitle}
                            </span>
                          </div>

                          <h4 className="text-xl font-black uppercase italic -skew-x-3 text-left">Ulasan Customer</h4>
                          
                          {activeEventReviews.length === 0 ? (
                            <p className="text-xs text-slate-400 italic uppercase font-bold text-left">Event ini belum mendapatkan ulasan dari customer.</p>
                          ) : (
                            <div className="space-y-4">
                              {activeEventReviews.map((rev) => (
                                <div key={rev.id} className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] text-left space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-black text-xs uppercase italic text-[#6D4AFF]">
                                      {rev.profiles?.full_name || "Anonymous Member"}
                                    </span>
                                    <span className="font-black text-amber-500 text-xs">
                                      {"★".repeat(rev.rating)}
                                      {"☆".repeat(5 - rev.rating)}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-800 leading-relaxed bg-slate-50 p-3 border border-dashed border-slate-300">
                                    "{rev.comment}"
                                  </p>
                                  <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase italic">
                                    <span>Dikirim: {new Date(rev.created_at).toLocaleDateString("id-ID")}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Event Group Chat Moderation sub-view */}
                      {subView === "chats" && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b-4 border-black pb-4">
                            <button
                              onClick={() => setSubView("main")}
                              className="bg-black text-white border-2 border-black px-3 py-1 text-[9px] font-black uppercase italic shadow-[2.5px_2.5px_0_0_#6D4AFF] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                            >
                              ← Kembali ke Event
                            </button>
                            <span className="text-[10px] font-black uppercase bg-[#6D4AFF] text-white border-2 border-black px-2 py-1 shadow-[2px_2px_0_0_#000] max-w-[180px] truncate">
                              💬 {activeEventTitle}
                            </span>
                          </div>

                          <div className="bg-amber-300 border-4 border-black p-3 font-bold text-[9px] uppercase tracking-wider text-left flex items-center gap-2">
                            <ShieldAlert size={14} className="shrink-0" />
                            <span>Moderasi Chat: Gunakan tombol tarik untuk menghapus pesan kasar, spam, atau membahayakan.</span>
                          </div>

                          {/* Chat viewport */}
                          <div className="border-4 border-black bg-slate-900 p-4 h-[350px] overflow-y-auto flex flex-col gap-4 brutal-scroll rounded-xl">
                            {activeEventChats.length === 0 ? (
                              <div className="my-auto text-slate-500 font-black italic uppercase text-xs text-center">
                                Belum ada obrolan dalam grup ini
                              </div>
                            ) : (
                              activeEventChats.map((msg) => (
                                <div key={msg.id} className="flex flex-col gap-1 text-left bg-black/40 border border-white/10 p-3 rounded-lg relative group">
                                  {/* User Name & Time */}
                                  <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400">
                                    <span className="text-[#6D4AFF]">{msg.user_name}</span>
                                    <span className="flex items-center gap-1"><Clock size={8} /> {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  
                                  {/* Message Content */}
                                  <p className="text-xs text-white leading-relaxed font-semibold pr-16 break-words whitespace-pre-wrap mt-1">
                                    {msg.message}
                                  </p>

                                  {/* Tarik / Hapus Button */}
                                  <button
                                    onClick={() => deleteChatMessage(msg.id)}
                                    disabled={isDeletingChat === msg.id}
                                    className="absolute right-2 top-2 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[8px] border border-black px-2 py-1 shadow-[1.5px_1.5px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50"
                                  >
                                    {isDeletingChat === msg.id ? "..." : "Tarik 🗑️"}
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
