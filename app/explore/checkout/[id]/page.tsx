"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Ticket, Calendar, MapPin, 
  CreditCard, Loader2, Zap, ShieldCheck
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
  const [qty, setQty] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(style);
    fetchData();
    return () => { document.head.removeChild(style); };
  }, [eventId]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUser(session.user);

    // Fetch detail event
    const { data: eventData } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventData) setEvent(eventData);
    setIsLoading(false);
  };

  const handleCheckout = async () => {
    if (!user || !event) return;
    setIsProcessing(true);

    // Simulasi loading gateway pembayaran (biar keren)
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const orderId = `INV-BRUTAL-${Date.now()}`;
      const totalBayar = event.price * qty;

      // 1. Insert Transaksi (Otomatis "paid" buat testing)
      const { data: txData, error: txError } = await supabase
        .from("transaksi")
        .insert({
          user_id: user.id,
          order_id: orderId,
          total_qty: qty,
          total_bayar: totalBayar,
          status_pembayaran: "paid" 
        })
        .select()
        .single();

      if (txError) throw txError;

      // 2. Bikin tiket sebanyak Qty yang dibeli
      const ticketsToInsert = Array.from({ length: qty }).map((_, idx) => ({
        transaksi_id: txData.id,
        event_id: event.id,
        ticket_code: `TKT-${Date.now().toString().slice(-6)}${idx}`, // Kode unik tiket
        seat_info: "GENERAL ADMISSION",
        status_checkin: false
      }));

      const { error: tktError } = await supabase
        .from("tiket")
        .insert(ticketsToInsert);

      if (tktError) throw tktError;

      // 3. Sukses! Lempar ke halaman tiket
      router.push("/explore/tickets"); // Sesuaikan sama URL halaman tiket lo

    } catch (error) {
      console.error("Gagal checkout:", error);
      alert("Waduh, war tiket gagal Man! Coba lagi.");
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
          
          {/* KIRI: DETAIL EVENT */}
          <div className="flex-1">
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
          </div>

          {/* KANAN: FORM CHECKOUT */}
          <div className="w-full lg:w-[450px]">
            <div className="bg-white border-4 border-slate-900 p-8 brutal-shadow-card flex flex-col h-full">
              <div className="flex items-center gap-2 mb-8 border-b-4 border-slate-900 pb-4">
                <Ticket size={28} strokeWidth={3} className="text-[#6D4AFF]" />
                <h3 className="text-2xl font-black italic uppercase -skew-x-6">ORDER SUMMARY</h3>
              </div>

              {/* Atur Jumlah Tiket */}
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold uppercase text-slate-500 tracking-widest text-sm">JUMLAH TIKET</span>
                <div className="flex items-center gap-4 border-4 border-slate-900 bg-slate-100 p-1 shadow-[4px_4px_0_0_#000]">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 bg-white border-2 border-slate-900 font-black text-xl hover:bg-amber-400 transition-colors">-</button>
                  <span className="font-black text-xl w-8 text-center">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="w-10 h-10 bg-white border-2 border-slate-900 font-black text-xl hover:bg-amber-400 transition-colors">+</button>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between font-bold text-sm text-slate-500 uppercase">
                  <span>Harga Satuan</span>
                  <span>{formatRupiah(event.price)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-500 uppercase">
                  <span>Biaya Layanan (Palsu)</span>
                  <span>Rp 0</span>
                </div>
              </div>

              {/* Total Bayar */}
              <div className="mt-auto border-t-4 border-slate-900 pt-6 mb-8">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">TOTAL BAYAR</p>
                <p className="text-4xl font-black text-[#6D4AFF] italic tracking-tighter leading-none">
                  {formatRupiah(event.price * qty)}
                </p>
              </div>

              {/* Tombol Checkout */}
              <button 
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-amber-400 text-slate-900 border-4 border-slate-900 p-5 font-black text-xl italic uppercase brutal-shadow-btn -skew-x-6 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={24} strokeWidth={4} />
                    MEMPROSES...
                  </>
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