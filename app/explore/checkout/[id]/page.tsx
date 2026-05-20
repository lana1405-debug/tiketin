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
      document.head.removeChild(script); 
    };
  }, [eventId]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUser(session.user);

    const { data: eventData } = await supabase.from("events").select("*").eq("id", eventId).single();
    if (eventData) setEvent(eventData);

    const { data: catData } = await supabase.from("ticket_categories").select("*").eq("event_id", eventId).order("price", { ascending: true });
    if (catData && catData.length > 0) {
      setCategories(catData);
      setSelectedCatId(catData[0].id);
    }

    const { data: userTickets } = await supabase
      .from("tiket")
      .select("id, transaksi!inner(user_id)")
      .eq("event_id", eventId)
      .eq("transaksi.user_id", session.user.id);
      
    const boughtCount = userTickets ? userTickets.length : 0;
    setAlreadyBought(boughtCount);

    setIsLoading(false);
  };

  const selectedCategory = categories.find(c => c.id === selectedCatId);
  const maxBuyPerUser = event?.max_buy || 0;
  const availableUserQuota = Math.max(0, maxBuyPerUser - alreadyBought);
  const stockAvailable = selectedCategory ? selectedCategory.stock : 0;
  const absoluteMaxQty = Math.min(availableUserQuota, stockAvailable);

  useEffect(() => {
    if (qty > absoluteMaxQty) {
      setQty(Math.max(1, absoluteMaxQty));
    }
    if (absoluteMaxQty === 0) setQty(0);
  }, [selectedCatId, absoluteMaxQty]);

  const handleCheckout = async () => {
    if (!user || !event || !selectedCategory || qty <= 0) return;
    setIsProcessing(true);

    try {
      const orderId = `INV-${Date.now().toString().slice(-6)}`;
      const totalBayar = selectedCategory.price * qty;

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
      if (!data.token) throw new Error(data.error || "Gagal dapet token!");

      const { data: txData, error: txError } = await supabase
        .from("transaksi")
        .insert({
          user_id: user.id,
          order_id: orderId,
          total_qty: qty,
          total_bayar: totalBayar,
          status_pembayaran: "pending",
          snap_token: data.token,
          event_id: event.id,
          category_id: selectedCategory.id
        })
        .select()
        .single();

      if (txError) throw txError;

      // @ts-ignore
      window.snap.pay(data.token, {
        onSuccess: async function (result: any) {
          try {
            await supabase.from("transaksi").update({ status_pembayaran: "paid" }).eq("id", txData.id);

            const ticketsToInsert = Array.from({ length: qty }).map((_, idx) => ({
              transaksi_id: txData.id,
              event_id: event.id,
              ticket_category_id: selectedCategory.id, 
              ticket_code: `TKT-${orderId}-${idx}`, 
              seat_info: selectedCategory.name, 
              status_checkin: false
            }));
            await supabase.from("tiket").insert(ticketsToInsert);

            const { error: stockError } = await supabase.rpc('decrement_ticket_stock', { 
              cat_id: selectedCategory.id, 
              qty: qty 
            });
            
            if (stockError) {
              console.error("Gagal potong stok di DB:", stockError);
            }

            const earnedPoints = qty * 50;
            const { data: profile } = await supabase.from("profiles").select("points").eq("id", user.id).single();
            const newPoints = (profile?.points || 0) + earnedPoints;
            await supabase.from("profiles").update({ points: newPoints }).eq("id", user.id);

            alert(`PEMBAYARAN BERHASIL! dapet ${earnedPoints} Poin! 🎉`);
            router.push("/explore/tickets"); 

          } catch (dbError) {
            console.error(dbError);
            alert("Sistem gagal sinkron, cek Tiket Saya!");
            router.push("/explore/tickets");
          }
        },
        onPending: () => { 
          alert("Pembayaran tertunda, silakan selesaikan!");
          router.push("/explore/tickets");
        },
        onError: () => { 
          alert("Pembayaran gagal!"); 
          setIsProcessing(false); 
        },
        onClose: () => { 
          router.push("/explore/tickets"); 
        }
      });

    } catch (error: any) {
      alert(`Gagal checkout! ${error.message}`);
      setIsProcessing(false);
    }
  };

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#FCFAF1]"><Loader2 className="animate-spin text-[#6D4AFF]" size={64} /></div>;

  return (
    <div className={`min-h-screen bg-[#FCFAF1] text-slate-900 noise ${poppins.className}`}>
      
      <nav className="w-full bg-white border-b-8 border-slate-900 h-20 flex items-center px-6 md:px-12 sticky top-0 z-50 shadow-[0_8px_0_0_#000]">
        <button onClick={() => router.back()} className="flex items-center gap-2 group border-2 border-transparent p-2 hover:border-slate-900 hover:bg-amber-400 transition-all">
          <ChevronLeft size={24} strokeWidth={4} />
          <span className="text-xl font-black italic uppercase tracking-tighter -skew-x-12 leading-none">KEMBALI</span>
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 sm:px-12 pt-12 pb-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-5xl md:text-7xl font-black italic uppercase -skew-x-6 drop-shadow-[4px_4px_0_#6D4AFF]">
            SECURE <span className="text-amber-400 drop-shadow-[4px_4px_0_#000]">TICKETS.</span>
          </h1>
          <p className="font-bold text-slate-500 mt-2 uppercase tracking-widest text-sm flex items-center gap-2 italic text-left">
            <Zap size={16} className="fill-amber-400 text-amber-400" /> Selesaikan pembayaran & dapet 50 poin/tiket!
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex flex-col md:flex-row gap-16">
          <div className="flex-1 space-y-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white border-4 border-slate-900 brutal-shadow-card flex flex-col overflow-hidden text-left">
              <div className="h-64 bg-slate-900 relative border-b-4 border-slate-900">
                {event.image_url ? (
                   <img src={event.image_url} alt={event.title} className="w-full h-full object-cover opacity-70" />
                ) : <div className="w-full h-full bg-slate-200" />}
                <div className="absolute top-4 left-4 bg-amber-400 border-2 border-slate-900 px-3 py-1 font-black text-[10px] uppercase shadow-[2px_2px_0_0_#000] -rotate-2">
                  {event.category}
                </div>
              </div>
              <div className="p-8">
                <h2 className="text-3xl font-black italic uppercase -skew-x-6 tracking-tighter mb-6 underline decoration-4 decoration-[#6D4AFF]">{event.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 uppercase font-bold text-xs mb-8">
                  <div className="flex items-center gap-4 bg-slate-50 p-4 border-2 border-slate-900 shadow-[4px_4px_0_0_#000]">
                    <Calendar size={24} className="text-[#6D4AFF]"/>
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 p-4 border-2 border-slate-900 shadow-[4px_4px_0_0_#000]">
                    <MapPin size={24} className="text-amber-500"/>
                    <span>{event.location}</span>
                  </div>
                </div>

                {/* ⚡ MENAMPILKAN DESKRIPSI EVENT */}
                {event.description && (
                  <div className="border-t-4 border-slate-900 pt-6">
                    <h3 className="text-lg font-black italic uppercase text-slate-400 mb-2">Details</h3>
                    <div className="font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {event.description}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <div className="bg-white border-4 border-slate-900 p-8 brutal-shadow-card text-left">
              <h3 className="text-2xl font-black italic uppercase -skew-x-6 tracking-tighter mb-6 flex items-center gap-3">
                <Tag size={28} className="text-[#6D4AFF]" /> PILIH TIER TIKET
              </h3>
              <div className="space-y-4">
                {categories.map((cat) => (
                  <label key={cat.id} className={`block w-full border-4 p-5 cursor-pointer transition-all ${selectedCatId === cat.id ? "border-slate-900 bg-amber-400 shadow-[6px_6px_0_0_#000] translate-x-1 translate-y-1" : "border-slate-300 bg-white hover:border-slate-900"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input type="radio" name="ticketCategory" checked={selectedCatId === cat.id} onChange={() => setSelectedCatId(cat.id)} disabled={cat.stock <= 0} className="w-6 h-6 accent-slate-900 cursor-pointer" />
                        <div>
                          <p className="font-black italic uppercase text-xl leading-none">{cat.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Sisa Stok: {cat.stock} Pcs</p>
                        </div>
                      </div>
                      <p className="font-black italic text-2xl tracking-tighter">{formatRupiah(cat.price)}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[450px]">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white border-4 border-slate-900 p-8 brutal-shadow-card flex flex-col h-full sticky top-24 text-left">
              <div className="flex items-center gap-3 mb-8 border-b-4 border-slate-900 pb-4">
                <Ticket size={32} strokeWidth={3} className="text-[#6D4AFF]" />
                <h3 className="text-3xl font-black italic uppercase -skew-x-6 tracking-tighter">SUMMARY</h3>
              </div>

              <AnimatePresence mode="wait">
                {availableUserQuota === 0 ? (
                  <motion.div key="limit" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-red-500 text-white border-4 border-black p-5 mb-8 rotate-1 flex items-start gap-3 shadow-[6px_6px_0_0_#000]">
                    <AlertOctagon size={32} strokeWidth={3} className="shrink-0" />
                    <div>
                      <p className="font-black italic uppercase text-lg leading-tight">LIMIT HABIS!</p>
                      <p className="text-[10px] font-bold uppercase mt-1 italic">Maks beli {maxBuyPerUser} tiket/akun. udah beli {alreadyBought}.</p>
                    </div>
                  </motion.div>
                ) : stockAvailable === 0 ? (
                  <motion.div key="soldout" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 text-white border-4 border-black p-5 mb-8 -rotate-1 text-center">
                    <p className="font-black italic uppercase text-lg">TIKET SOLD OUT!</p>
                  </motion.div>
                ) : (
                  <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center justify-between mb-8 bg-slate-50 p-4 border-2 border-slate-900 shadow-[4px_4px_0_0_#000]">
                      <div>
                        <span className="font-black uppercase text-[10px] text-slate-400 block tracking-widest italic">JUMLAH BELI</span>
                        <span className="font-black text-emerald-500 text-[10px] uppercase italic">Sisa Jatah: {availableUserQuota}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 bg-white border-4 border-slate-900 font-black text-2xl hover:bg-amber-400 transition-colors">-</button>
                        <span className="font-black text-2xl w-8 text-center">{qty}</span>
                        <button onClick={() => setQty(Math.min(absoluteMaxQty, qty + 1))} className="w-10 h-10 bg-white border-4 border-slate-900 font-black text-2xl hover:bg-amber-400 transition-colors">+</button>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8 font-black uppercase italic text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>{selectedCategory?.name} x {qty}</span>
                        <span>{formatRupiah((selectedCategory?.price || 0) * qty)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-500 bg-emerald-50 p-2 border-2 border-emerald-200">
                        <span>ESTIMASI REWARDS</span>
                        <span>+ {qty * 50} PTS</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-auto border-t-4 border-slate-900 pt-6 mb-8">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">TOTAL TAGIHAN</p>
                <p className="text-5xl font-black text-[#6D4AFF] italic tracking-tighter leading-none drop-shadow-[2px_2px_0_#FBBF24]">
                  {formatRupiah((selectedCategory?.price || 0) * qty)}
                </p>
              </div>

              <button 
                onClick={handleCheckout} 
                disabled={isProcessing || absoluteMaxQty === 0} 
                className="w-full bg-amber-400 text-slate-900 border-4 border-slate-900 p-6 font-black text-2xl italic uppercase brutal-shadow-btn -skew-x-6 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? <><Loader2 className="animate-spin" size={28} strokeWidth={4} /> PROSES...</> : absoluteMaxQty === 0 ? "LIMIT HABIS" : <><CreditCard size={28} strokeWidth={3} /> BAYAR SEKARANG</>}
              </button>

              <div className="mt-8 flex items-center justify-center gap-3 text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                <ShieldCheck size={20} strokeWidth={3} /> TRANSAKSI ENKRIPSI 100% AMAN
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}