"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Ticket, Calendar, MapPin, 
  CreditCard, Loader2, Zap, ShieldCheck, AlertOctagon, Tag
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const GLOBAL_STYLES = `
  .noise::after {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:999; opacity:.04;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }
  .brutal-shadow-btn {
    box-shadow: 4px 4px 0px 0px #6D4AFF, 8px 8px 0px 0px #000, 12px 12px 0px 0px #FBBF24 !important;
    transition: all 0.2s ease;
  }
  .brutal-shadow-btn:active {
    box-shadow: 2px 2px 0px 0px #6D4AFF, 4px 4px 0px 0px #000, 6px 6px 0px 0px #FBBF24 !important;
    transform: translate(2px, 2px);
  }
  .brutal-shadow-card {
    box-shadow: 8px 8px 0px 0px #6D4AFF, 16px 16px 0px 0px #000 !important;
  }
`;

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alreadyBought, setAlreadyBought] = useState(0);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(style);
    
    // ⚡ SUNTIK SCRIPT MIDTRANS KE HALAMAN
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
    const script = document.createElement("script");
    script.src = snapScript;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    document.head.appendChild(script);

    fetchData();

    return () => { 
      document.head.removeChild(style); 
      document.head.removeChild(script); // ⚡ BERSIHIN SCRIPT PAS KELUAR HALAMAN
    };
  }, [eventId]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUser(session.user);

    // 1. Fetch Event
    const { data: eventData } = await supabase.from("events").select("*").eq("id", eventId).single();
    if (eventData) setEvent(eventData);

    // 2. Fetch Kategori Tiket dari tabel ticket_categories
    const { data: catData } = await supabase.from("ticket_categories").select("*").eq("event_id", eventId).order("price", { ascending: true });
    if (catData && catData.length > 0) {
      setCategories(catData);
      setSelectedCatId(catData[0].id); // Default pilih yang pertama
    }

    // 3. Cek Jumlah Tiket yang udah dibeli user ini buat validasi limit
    const { data: userTickets } = await supabase
      .from("tiket")
      .select("id, transaksi!inner(user_id)")
      .eq("event_id", eventId)
      .eq("transaksi.user_id", session.user.id);
      
    const boughtCount = userTickets ? userTickets.length : 0;
    setAlreadyBought(boughtCount);

    setIsLoading(false);
  };

  // Logic buat ngatur limit maksimal yang bisa dibeli
  const selectedCategory = categories.find(c => c.id === selectedCatId);
  const maxBuyPerUser = event?.max_buy || 0;
  
  // Kuota dari sisa limit user (Max dari EO dikurang yang udah dibeli)
  const availableUserQuota = Math.max(0, maxBuyPerUser - alreadyBought);
  
  // Kuota asli dari stok tiket yang ada
  const stockAvailable = selectedCategory ? selectedCategory.stock : 0;

  // Batas mutlak pembelian saat ini (yang paling kecil antara jatah user atau sisa stok)
  const absoluteMaxQty = Math.min(availableUserQuota, stockAvailable);

  // Auto-koreksi Qty kalau user ganti kategori dan stoknya lebih dikit dari inputan sebelumnya
  useEffect(() => {
    if (qty > absoluteMaxQty) {
      setQty(Math.max(1, absoluteMaxQty));
    }
    if (absoluteMaxQty === 0) setQty(0);
  }, [selectedCatId, absoluteMaxQty]);

  // ⚡ FUNGSI CHECKOUT PRO (UDAH BISA SIMPEN TOKEN & INFO TIKET KE DB)
  const handleCheckout = async () => {
    if (!user || !event || !selectedCategory || qty <= 0) return;
    setIsProcessing(true);

    try {
      const orderId = `INV-${Date.now().toString().slice(-6)}`;
      const totalBayar = selectedCategory.price * qty;

      // 1. Minta Token dari API Backend lo
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          gross_amount: totalBayar,
          first_name: user.user_metadata?.full_name || "User",
          email: user.email,
          item_name: `${event.title} - ${selectedCategory.name}`
        })
      });

      const data = await response.json();
      
      if (!data.token) {
        throw new Error(data.error || "Gagal dapet token dari Midtrans!");
      }

      // 2. ⚡ INSERT TRANSAKSI DENGAN STATUS "PENDING" & SIMPEN TOKEN
      const { data: txData, error: txError } = await supabase
        .from("transaksi")
        .insert({
          user_id: user.id,
          order_id: orderId,
          total_qty: qty,
          total_bayar: totalBayar,
          status_pembayaran: "pending",
          snap_token: data.token,          // SIMPEN TOKENNYA
          event_id: event.id,              // SIMPEN ID EVENT
          category_id: selectedCategory.id // SIMPEN ID KATEGORI
        })
        .select()
        .single();

      if (txError) throw txError;

      // 3. TAMPILIN POP-UP MIDTRANS
      // @ts-ignore
      window.snap.pay(data.token, {
        onSuccess: async function (result: any) {
          // ⚡ KALAU BAYAR SUKSES, BARU UPDATE STATUS JADI PAID
          try {
            await supabase
              .from("transaksi")
              .update({ status_pembayaran: "paid" })
              .eq("id", txData.id);

            // Insert ke tabel Tiket pake nama kategori
            const ticketsToInsert = Array.from({ length: qty }).map((_, idx) => ({
              transaksi_id: txData.id,
              event_id: event.id,
              ticket_category_id: selectedCategory.id, 
              ticket_code: `TKT-${orderId}-${idx}`, 
              seat_info: selectedCategory.name, 
              status_checkin: false
            }));

            const { error: tktError } = await supabase.from("tiket").insert(ticketsToInsert);
            if (tktError) throw tktError;

            // Update (kurangin) stok di tabel ticket_categories
            const { error: stockError } = await supabase
              .from("ticket_categories")
              .update({ stock: stockAvailable - qty })
              .eq("id", selectedCategory.id);
              
            if (stockError) console.error("Gagal potong stok:", stockError);

            alert("PEMBAYARAN BERHASIL MAN!");
            router.push("/explore/tickets"); 

          } catch (dbError) {
             console.error("Gagal simpan ke DB setelah bayar:", dbError);
             alert("Pembayaran berhasil di Midtrans, tapi gagal nyimpen tiket di sistem kita. Segera hubungi Admin!");
             setIsProcessing(false);
          }
        },
        onPending: function (result: any) {
          // KALO MILIH METODE YANG BUTUH WAKTU
          alert("Siapp, tagihan lo udah disimpen. Cek halaman Riwayat ya!");
          router.push("/explore/history"); 
        },
        onError: function (result: any) {
          alert("Pembayaran gagal!");
          setIsProcessing(false);
        },
        onClose: function () {
          // KALO POP-UP DITUTUP MANUAL SAMA USER
          alert("Pop-up ditutup! Tenang, tagihan lo aman di Riwayat Pembayaran.");
          router.push("/explore/history"); 
        }
      });

    } catch (error: any) {
      console.error("Gagal checkout:", error);
      alert(`Waduh, war tiket gagal Man! ${error.message}`);
      setIsProcessing(false);
    }
  };

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  if (isLoading) return (
    <div className={`min-h-screen flex items-center justify-center bg-[#FCFAF1] ${poppins.className}`}>
      <Loader2 className="animate-spin text-[#6D4AFF]" size={64} strokeWidth={4} />
    </div>
  );

  if (!event) return (
    <div className={`min-h-screen flex items-center justify-center bg-[#FCFAF1] ${poppins.className}`}>
      <h1 className="text-4xl font-black italic uppercase">Event Ga Ketemu!</h1>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#FCFAF1] text-slate-900 noise ${poppins.className}`}>
      
      {/* HEADER SIMPEL */}
      <nav className="w-full bg-white border-b-8 border-slate-900 h-20 flex items-center px-6 md:px-12 sticky top-0 z-50 shadow-[0_8px_0_0_#000]">
        <button onClick={() => router.back()} className="flex items-center gap-2 group border-2 border-transparent p-2 hover:border-slate-900 hover:bg-amber-400 transition-all">
          <ChevronLeft size={24} strokeWidth={4} />
          <span className="text-xl font-black italic uppercase tracking-tighter -skew-x-12">KEMBALI</span>
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 sm:px-12 pt-12 pb-32">
        <div className="mb-12">
          <h1 className="text-5xl md:text-7xl font-black italic uppercase -skew-x-6 drop-shadow-[4px_4px_0_#6D4AFF]">
            SECURE <span className="text-amber-400 drop-shadow-[4px_4px_0_#000]">TICKETS.</span>
          </h1>
          <p className="font-bold text-slate-500 mt-2 uppercase tracking-widest text-sm">Selesaikan pembayaran lo sebelum kehabisan!</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* KIRI: DETAIL EVENT & PILIH KATEGORI */}
          <div className="flex-1 space-y-8">
            <div className="bg-white border-4 border-slate-900 brutal-shadow-card flex flex-col overflow-hidden">
              <div className="h-64 bg-slate-900 relative border-b-4 border-slate-900">
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover opacity-70" />
                <div className="absolute top-4 left-4 bg-amber-400 border-2 border-slate-900 px-3 py-1 font-black text-[10px] uppercase shadow-[2px_2px_0_0_#000] -rotate-2">
                  {event.category}
                </div>
              </div>
              <div className="p-8">
                <h2 className="text-3xl font-black italic uppercase -skew-x-6 tracking-tighter mb-6">{event.title}</h2>
                <div className="space-y-4 font-bold uppercase text-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#6D4AFF] p-2 border-2 border-slate-900 shadow-[2px_2px_0_0_#000]"><Calendar size={20} className="text-white"/></div>
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-400 p-2 border-2 border-slate-900 shadow-[2px_2px_0_0_#000]"><MapPin size={20} className="text-slate-900"/></div>
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PILIH KATEGORI TIKET */}
            <div className="bg-white border-4 border-slate-900 p-8 brutal-shadow-card">
              <h3 className="text-2xl font-black italic uppercase -skew-x-6 tracking-tighter mb-6 flex items-center gap-3">
                <Tag size={28} className="text-[#6D4AFF]" /> PILIH TIER TIKET
              </h3>
              <div className="space-y-4">
                {categories.map((cat) => (
                  <label 
                    key={cat.id} 
                    className={`block w-full border-4 p-4 cursor-pointer transition-all ${
                      selectedCatId === cat.id 
                        ? "border-slate-900 bg-amber-400 shadow-[4px_4px_0_0_#000] translate-x-1 translate-y-1" 
                        : "border-slate-300 bg-slate-50 hover:border-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input 
                          type="radio" 
                          name="ticketCategory" 
                          value={cat.id} 
                          checked={selectedCatId === cat.id}
                          onChange={() => setSelectedCatId(cat.id)}
                          disabled={cat.stock <= 0}
                          className="w-5 h-5 accent-slate-900" 
                        />
                        <div>
                          <p className="font-black italic uppercase text-lg leading-none">{cat.name}</p>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Stok: {cat.stock} Pcs</p>
                        </div>
                      </div>
                      <p className={`font-black italic text-xl ${selectedCatId === cat.id ? "text-slate-900" : "text-[#6D4AFF]"}`}>
                        {formatRupiah(cat.price)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* KANAN: FORM CHECKOUT */}
          <div className="w-full lg:w-[450px]">
            <div className="bg-white border-4 border-slate-900 p-8 brutal-shadow-card flex flex-col h-full sticky top-24">
              <div className="flex items-center justify-between gap-2 mb-8 border-b-4 border-slate-900 pb-4">
                <div className="flex items-center gap-2">
                  <Ticket size={28} strokeWidth={3} className="text-[#6D4AFF]" />
                  <h3 className="text-2xl font-black italic uppercase -skew-x-6">SUMMARY</h3>
                </div>
              </div>

              {/* Tampilkan Peringatan Limit Tercapai */}
              {availableUserQuota === 0 ? (
                <div className="bg-red-100 border-4 border-red-500 p-4 mb-8 flex items-start gap-3 shadow-[4px_4px_0_0_rgba(239,68,68,1)]">
                  <AlertOctagon className="text-red-500 shrink-0 mt-0.5" size={24} strokeWidth={3} />
                  <div>
                    <p className="font-black italic uppercase text-red-500 leading-tight">LIMIT TERCAPAI!</p>
                    <p className="text-xs font-bold text-red-900 mt-1 uppercase">Lo udah beli {alreadyBought} tiket. Aturan EO: Maksimal {maxBuyPerUser} tiket/akun.</p>
                  </div>
                </div>
              ) : stockAvailable === 0 ? (
                <div className="bg-slate-200 border-4 border-slate-900 p-4 mb-8 flex items-start gap-3">
                  <AlertOctagon className="text-slate-600 shrink-0 mt-0.5" size={24} strokeWidth={3} />
                  <div>
                    <p className="font-black italic uppercase text-slate-800 leading-tight">TIKET SOLD OUT!</p>
                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase">Tier tiket ini udah habis terjual. Pilih tier lain!</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <span className="font-bold uppercase text-slate-500 tracking-widest text-[10px] block">JUMLAH TIKET</span>
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 border border-emerald-300 px-2 py-0.5 inline-block mt-1 uppercase">Sisa Jatah Lo: {availableUserQuota}</span>
                    </div>
                    <div className="flex items-center gap-4 border-4 border-slate-900 bg-slate-100 p-1 shadow-[4px_4px_0_0_#000]">
                      <button 
                        onClick={() => setQty(Math.max(1, qty - 1))} 
                        className="w-8 h-8 bg-white border-2 border-slate-900 font-black text-xl hover:bg-amber-400 transition-colors flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="font-black text-xl w-6 text-center">{qty}</span>
                      <button 
                        onClick={() => setQty(Math.min(absoluteMaxQty, qty + 1))} 
                        className="w-8 h-8 bg-white border-2 border-slate-900 font-black text-xl hover:bg-amber-400 transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between font-bold text-sm text-slate-500 uppercase">
                      <span>{selectedCategory?.name || "Tiket"} x {qty}</span>
                      <span>{formatRupiah((selectedCategory?.price || 0) * qty)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-slate-500 uppercase">
                      <span>Biaya Layanan</span>
                      <span>Rp 0</span>
                    </div>
                  </div>
                </>
              )}

              {/* Total Bayar */}
              <div className="mt-auto border-t-4 border-slate-900 pt-6 mb-8">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">TOTAL BAYAR</p>
                <p className="text-4xl font-black text-[#6D4AFF] italic tracking-tighter leading-none">
                  {formatRupiah((selectedCategory?.price || 0) * qty)}
                </p>
              </div>

              {/* Tombol Checkout */}
              <button 
                onClick={handleCheckout}
                disabled={isProcessing || absoluteMaxQty === 0}
                className="w-full bg-amber-400 text-slate-900 border-4 border-slate-900 p-5 font-black text-xl italic uppercase brutal-shadow-btn -skew-x-6 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-[4px_4px_0_0_#000] disabled:translate-x-0 disabled:translate-y-0"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={24} strokeWidth={4} />
                    MEMPROSES...
                  </>
                ) : absoluteMaxQty === 0 ? (
                  "TIDAK BISA BELI"
                ) : (
                  <>
                    <CreditCard size={24} strokeWidth={3} />
                    BAYAR SEKARANG
                  </>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-emerald-500 tracking-widest bg-emerald-50 py-2 border-2 border-emerald-200">
                <ShieldCheck size={14} strokeWidth={3} /> TRANSAKSI AMAN 100%
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}