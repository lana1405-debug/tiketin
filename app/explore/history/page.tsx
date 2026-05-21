"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { 
  ChevronLeft, Receipt, AlertCircle, Clock, 
  CheckCircle2, ChevronRight, Zap, XCircle 
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
  .brutal-shadow-card {
    box-shadow: 8px 8px 0px 0px #6D4AFF, 16px 16px 0px 0px #000 !important;
  }
  .brutal-shadow-btn {
    box-shadow: 4px 4px 0px 0px #000 !important;
    transition: all 0.2s ease;
  }
  .brutal-shadow-btn:active {
    box-shadow: 2px 2px 0px 0px #000 !important;
    transform: translate(2px, 2px);
  }
`;

export default function HistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

    fetchHistory();

    return () => { 
      document.head.removeChild(style); 
      document.head.removeChild(script);
    };
  }, []);

  const fetchHistory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    setIsLoading(true);

    try {
      const { data: txData, error: txError } = await supabase
        .from("transaksi")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (txError) throw txError;

      if (txData && txData.length > 0) {
        const formattedData = await Promise.all(txData.map(async (tx) => {
          let eventDetail = null;
          let catDetail = null;

          if (tx.event_id) {
            const { data: e } = await supabase.from("events").select("title").eq("id", tx.event_id).single();
            eventDetail = e;
          }
          if (tx.category_id) {
            const { data: c } = await supabase.from("ticket_categories").select("name, stock").eq("id", tx.category_id).single();
            catDetail = c;
          }

          // ⚡ LOGIKA CHECK EXPIRED (12 JAM)
          const creationTime = new Date(tx.created_at).getTime();
          const now = new Date().getTime();
          const diffInHours = (now - creationTime) / (1000 * 60 * 60);
          
          let finalStatus = tx.status_pembayaran;
          if (tx.status_pembayaran === 'pending' && diffInHours > 12) {
            finalStatus = 'expired';
          }

          return {
            ...tx,
            status_pembayaran: finalStatus,
            events: eventDetail,
            ticket_categories: catDetail,
            hours_left: Math.max(0, 12 - diffInHours)
          };
        }));

        setTransactions(formattedData);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Gagal tarik history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
  };

  const handleLanjutBayar = async (tx: any) => {
    if (tx.status_pembayaran === 'expired') {
      alert("Waduh! Tagihan ini sudah hangus karena lewat 12 jam.");
      return;
    }

    if (!tx.snap_token) {
      alert("Token tidak ditemukan. Silakan checkout ulang.");
      return;
    }

    // @ts-ignore
    window.snap.pay(tx.snap_token, {
      onSuccess: async function (result: any) {
        try {
          // Panggil API status pembayaran di server-side untuk memproses DB secara aman
          const statusResponse = await fetch("/api/payment/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: tx.order_id })
          });
          
          const statusData = await statusResponse.json();
          if (statusData.success) {
            alert("MANTAP! PEMBAYARAN BERHASIL. 🎉");
          } else {
            console.warn("Verifikasi status gagal:", statusData.message);
            alert("Pembayaran berhasil dicatat. Tiket sedang diproses.");
          }
          router.push("/explore/tickets"); 
        } catch (error) {
          console.error(error);
          alert("Pembayaran sukses! Sistem sedang melakukan sinkronisasi otomatis, silakan cek Tiket Saya beberapa saat lagi.");
          router.push("/explore/tickets");
        }
      },
      onPending: () => alert("Menunggu pembayaran..."),
      onError: () => alert("Gagal memproses pembayaran."),
      onClose: () => alert("Selesaikan sebelum 12 jam ya!")
    });
  };

  return (
    <div className={`min-h-screen bg-[#FCFAF1] text-slate-900 noise ${poppins.className}`}>
      <nav className="w-full bg-white border-b-8 border-slate-900 h-20 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50 shadow-[0_8px_0_0_#000]">
        <button onClick={() => router.push("/explore")} className="flex items-center gap-2 group border-2 border-transparent p-2 hover:border-slate-900 hover:bg-amber-400 transition-all">
          <ChevronLeft size={24} strokeWidth={4} />
          <span className="text-xl font-black italic uppercase tracking-tighter -skew-x-12">KEMBALI</span>
        </button>
        <div className="hidden md:flex items-center gap-2 border-2 border-slate-900 bg-amber-400 px-3 py-1 font-black italic text-xs shadow-[4px_4px_0_0_#000] -skew-x-6">
          <Zap size={14} className="text-slate-900"/> LOG KEUANGAN
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 sm:px-12 pt-12 pb-32 text-left">
        <div className="mb-12 border-b-8 border-slate-900 pb-8 flex items-end justify-between">
          <div>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase -skew-x-6 tracking-tighter text-left">
              RIWAYAT <span className="text-[#6D4AFF] drop-shadow-[4px_4px_0_#000]">TAGIHAN.</span>
            </h1>
            <p className="font-bold text-slate-500 mt-2 uppercase tracking-widest text-sm text-left">Maksimal bayar 12 jam setelah checkout.</p>
          </div>
          <Receipt size={64} strokeWidth={2} className="text-amber-400 drop-shadow-[4px_4px_0_#000] hidden md:block" />
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
             <div className="w-16 h-16 border-8 border-slate-900 border-t-amber-400 animate-spin"></div>
             <p className="font-black italic uppercase tracking-widest text-slate-400">Syncing...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white border-4 border-slate-900 p-12 text-center brutal-shadow-card">
            <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" strokeWidth={2} />
            <h3 className="text-2xl font-black italic uppercase -skew-x-6 mb-2">Belum Ada Transaksi!</h3>
          </div>
        ) : (
          <div className="space-y-6">
            {transactions.map((tx) => (
              <div key={tx.id} className={`bg-white border-4 border-slate-900 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[8px_8px_0_0_#000] transition-all ${tx.status_pembayaran === 'expired' ? 'opacity-60 grayscale' : 'hover:-translate-y-1 hover:shadow-[12px_12px_0_0_#6D4AFF]'}`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-900 text-white font-black italic uppercase px-3 py-1 text-xs tracking-widest">
                      {tx.order_id}
                    </span>
                    
                    {/* ⚡ STATUS LABELS */}
                    {tx.status_pembayaran === 'paid' && (
                      <span className="flex items-center gap-1 font-black italic text-[10px] uppercase text-emerald-600 bg-emerald-100 border-2 border-emerald-500 px-2 py-0.5">
                        <CheckCircle2 size={12} strokeWidth={3} /> LUNAS
                      </span>
                    )}
                    {tx.status_pembayaran === 'pending' && (
                      <span className="flex items-center gap-1 font-black italic text-[10px] uppercase text-amber-600 bg-amber-100 border-2 border-amber-500 px-2 py-0.5 animate-pulse">
                        <Clock size={12} strokeWidth={3} /> PENDING
                      </span>
                    )}
                    {tx.status_pembayaran === 'expired' && (
                      <span className="flex items-center gap-1 font-black italic text-[10px] uppercase text-red-600 bg-red-100 border-2 border-red-500 px-2 py-0.5">
                        <XCircle size={12} strokeWidth={3} /> CANCEL / EXPIRED
                      </span>
                    )}
                  </div>

                  <div className="text-left">
                    <p className="font-bold text-xs text-slate-400 uppercase tracking-widest">{formatDate(tx.created_at)}</p>
                    <p className="font-black text-xl italic uppercase text-slate-900 leading-tight">
                      {tx.events?.title || "EVENT"}
                    </p>
                    <p className="font-bold text-sm italic uppercase text-[#6D4AFF] mt-1">
                      {tx.total_qty}x {tx.ticket_categories?.name || "TIKET"}
                    </p>
                    
                    {/* ⚡ COUNTDOWN INFO */}
                    {tx.status_pembayaran === 'pending' && (
                      <p className="text-[10px] font-black text-red-500 uppercase mt-2 italic bg-red-50 inline-block px-2 border border-red-200">
                         Sisa Waktu: {tx.hours_left.toFixed(1)} Jam lagi!
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-4 border-t-4 md:border-t-0 md:border-l-4 border-slate-900 pt-4 md:pt-0 md:pl-6">
                  <div className="md:text-right text-left w-full">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">TOTAL TAGIHAN</p>
                    <p className="text-3xl font-black text-[#6D4AFF] italic tracking-tighter leading-none">
                      {formatRupiah(tx.total_bayar)}
                    </p>
                  </div>
                  
                  {tx.status_pembayaran === 'pending' && (
                    <button 
                      onClick={() => handleLanjutBayar(tx)}
                      className="w-full md:w-auto bg-amber-400 border-2 border-slate-900 px-6 py-3 font-black italic uppercase text-xs flex items-center justify-center gap-2 brutal-shadow-btn hover:bg-black hover:text-white"
                    >
                      LANJUT BAYAR <ChevronRight size={16} strokeWidth={3} />
                    </button>
                  )}
                  {tx.status_pembayaran === 'expired' && (
                    <p className="text-[10px] font-black text-red-500 uppercase italic underline underline-offset-4">Transaction Closed</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}