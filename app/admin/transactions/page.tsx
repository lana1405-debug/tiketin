"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";
import { 
  Wallet, ArrowLeft, Loader2, 
  TrendingUp, CreditCard, Calendar, 
  ArrowUpRight, Clock, Zap, Filter, DollarSign
} from "lucide-react";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function GlobalTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'ticket_success' | 'ticket_pending' | 'ticket_cancel' | 'boosted'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from("transaksi")
      .select(`
        *,
        profiles (full_name),
        events (title)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // ⚡ LOGIKA AUTO-EXPIRED: Pending > 12 jam = expired
      const now = new Date().getTime();
      const processed = data.map((tx: any) => {
        const creationTime = new Date(tx.created_at).getTime();
        const diffInHours = (now - creationTime) / (1000 * 60 * 60);
        let finalStatus = tx.status_pembayaran;
        if (tx.status_pembayaran === 'pending' && diffInHours > 12) {
          finalStatus = 'expired';
        }
        return { ...tx, status_pembayaran: finalStatus };
      });
      setTransactions(processed);
    }
    
    setIsLoading(false);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { 
      style: "currency", 
      currency: "IDR", 
      maximumFractionDigits: 0 
    }).format(angka || 0);
  };

  const getPrice = (t: any) => Number(t.total_bayar || 0);
  const getStatus = (t: any) => String(t.status_pembayaran || "pending").toLowerCase();
  const isSuccess = (status: string) => status === "paid";
  const isExpired = (status: string) => status === "expired";

  const totalRevenue = transactions
    .filter(t => isSuccess(getStatus(t)))
    .reduce((acc, curr) => acc + getPrice(curr), 0);

  const ticketsSold = transactions
    .filter(t => isSuccess(getStatus(t)))
    .reduce((acc, curr) => acc + (curr.total_qty || 0), 0);
  const ticketsPending = transactions.filter(t => getStatus(t) === 'pending').length;
  const ticketsExpired = transactions.filter(t => isExpired(getStatus(t))).length;

  // Counts for each tab category
  const countAll = transactions.length;
  const countBoosted = transactions.filter(t => t.order_id?.startsWith('BOOST-')).length;
  const countTicketSuccess = transactions.filter(t => !t.order_id?.startsWith('BOOST-') && getStatus(t) === 'paid').length;
  const countTicketPending = transactions.filter(t => !t.order_id?.startsWith('BOOST-') && getStatus(t) === 'pending').length;
  const countTicketCancel = transactions.filter(t => !t.order_id?.startsWith('BOOST-') && ['expired', 'failed', 'cancel', 'expire'].includes(getStatus(t))).length;

  const filteredTransactions = transactions.filter((t) => {
    const isBoost = t.order_id?.startsWith('BOOST-');
    const status = getStatus(t);
    
    if (activeCategory === 'all') return true;
    if (activeCategory === 'boosted') return isBoost;
    
    // Non-boosted ticket filters
    if (isBoost) return false;
    
    if (activeCategory === 'ticket_success') return status === 'paid';
    if (activeCategory === 'ticket_pending') return status === 'pending';
    if (activeCategory === 'ticket_cancel') {
      return ['expired', 'failed', 'cancel', 'expire'].includes(status);
    }
    return true;
  });

  if (!mounted) return null;

  return (
    <main className={`min-h-screen bg-white p-6 md:p-12 ${poppins.className} text-black text-left`}>
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-8 border-black pb-10">
          <div className="flex items-start gap-6">
            <button 
              onClick={() => router.back()} 
              className="p-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <ArrowLeft size={24} strokeWidth={3} />
            </button>
            <div>
              <div className="bg-[#6D4AFF] text-white border-2 border-black px-4 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                <DollarSign size={14} strokeWidth={3} /> Financial Monitoring
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
                Global <span className="text-[#6D4AFF]">Sales.</span>
              </h1>
              <p className="text-lg font-bold text-slate-500 italic mt-4">Pantau arus kas masuk dari seluruh konser di Tiketin.</p>
            </div>
          </div>
        </div>

        {/* STATS TRANSAKSI */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div className="bg-black border-8 border-black p-8 text-white shadow-[12px_12px_0px_0px_rgba(109,74,255,1)] relative overflow-hidden group">
            <div className="absolute top-[-20px] right-[-20px] opacity-10 group-hover:rotate-12 transition-transform">
              <Wallet size={150} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6D4AFF] italic mb-4">Total Pendapatan</p>
            
            {/* FIX: whitespace-nowrap (biar 1 baris) & truncate (kalau kepanjangan bakal jadi "...") */}
            <h2 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-black italic -skew-x-6 leading-tight tracking-tighter pr-2 pb-1">
  {formatRupiah(totalRevenue)}
</h2>
            
            <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase bg-[#6D4AFF] w-fit px-4 py-2 border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
               <TrendingUp size={14} strokeWidth={3} /> Live Balance
            </div>
          </div>

          <div className="bg-emerald-400 border-8 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/60 italic">Tiket Terjual</p>
            <div className="mt-6">
              <h2 className="text-5xl md:text-3xl sm:text-4xl md:text-5xl lg:text-6xl lg:text-7xl font-black italic -skew-x-6 leading-none whitespace-nowrap truncate pr-4 pb-1">
                {ticketsSold}
              </h2>
              <span className="text-sm font-black uppercase italic">Lembar Terverifikasi</span>
            </div>
          </div>

          <div className="bg-amber-400 border-8 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/60 italic">Pending Tx</p>
            <div className="mt-6">
              <h2 className="text-5xl md:text-3xl sm:text-4xl md:text-5xl lg:text-6xl lg:text-7xl font-black italic -skew-x-6 leading-none whitespace-nowrap truncate pr-4 pb-1">
                {ticketsPending}
              </h2>
              <span className="text-sm font-black uppercase italic">Menunggu Pembayaran</span>
            </div>
          </div>

          <div className="bg-red-500 border-8 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between overflow-hidden text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 italic">Expired Tx</p>
            <div className="mt-6">
              <h2 className="text-5xl md:text-3xl sm:text-4xl md:text-5xl lg:text-6xl lg:text-7xl font-black italic -skew-x-6 leading-none whitespace-nowrap truncate pr-4 pb-1">
                {ticketsExpired}
              </h2>
              <span className="text-sm font-black uppercase italic">Hangus (&gt;12 Jam)</span>
            </div>
          </div>
        </div>

        {/* CATEGORY FILTER TABS */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 border-4 border-black font-black uppercase italic text-xs shadow-[4px_4px_0_0_#000] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all flex items-center gap-2 ${
              activeCategory === "all"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-slate-100"
            }`}
          >
            📋 Semua ({countAll})
          </button>
          
          <button
            onClick={() => setActiveCategory("ticket_success")}
            className={`px-4 py-2 border-4 border-black font-black uppercase italic text-xs shadow-[4px_4px_0_0_#000] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all flex items-center gap-2 ${
              activeCategory === "ticket_success"
                ? "bg-emerald-400 text-black"
                : "bg-white text-black hover:bg-emerald-50"
            }`}
          >
            ✅ Tiket Sukses ({countTicketSuccess})
          </button>

          <button
            onClick={() => setActiveCategory("ticket_pending")}
            className={`px-4 py-2 border-4 border-black font-black uppercase italic text-xs shadow-[4px_4px_0_0_#000] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all flex items-center gap-2 ${
              activeCategory === "ticket_pending"
                ? "bg-amber-400 text-black"
                : "bg-white text-black hover:bg-amber-50"
            }`}
          >
            ⏳ Tiket Pending ({countTicketPending})
          </button>

          <button
            onClick={() => setActiveCategory("ticket_cancel")}
            className={`px-4 py-2 border-4 border-black font-black uppercase italic text-xs shadow-[4px_4px_0_0_#000] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all flex items-center gap-2 ${
              activeCategory === "ticket_cancel"
                ? "bg-red-500 text-white"
                : "bg-white text-black hover:bg-red-50"
            }`}
          >
            ❌ Batal/Hangus ({countTicketCancel})
          </button>

          <button
            onClick={() => setActiveCategory("boosted")}
            className={`px-4 py-2 border-4 border-black font-black uppercase italic text-xs shadow-[4px_4px_0_0_#000] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all flex items-center gap-2 ${
              activeCategory === "boosted"
                ? "bg-[#6D4AFF] text-white"
                : "bg-white text-black hover:bg-purple-50"
            }`}
          >
            ⚡ Boosted Event ({countBoosted})
          </button>
        </div>

        {/* TABEL TRANSAKSI */}
        <div className="bg-white border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-black p-6 flex justify-between items-center border-b-8 border-black">
            <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">Riwayat Arus Kas</h3>
            <div className="bg-white px-4 py-1 border-2 border-black font-black text-[10px] uppercase italic">
              Real-time DB sync
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-4 border-black text-left text-[10px] font-black uppercase tracking-widest">
                  <th className="p-6 border-r-4 border-black">User & Nama Konser</th>
                  <th className="p-6 border-r-4 border-black text-center">Nominal</th>
                  <th className="p-6 border-r-4 border-black text-center">Status</th>
                  <th className="p-6 text-center">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-black">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-24 text-center font-black italic text-2xl uppercase tracking-widest text-[#6D4AFF] animate-pulse">Scanning Ledgers...</td></tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr><td colSpan={4} className="p-24 text-center text-slate-300 font-black uppercase italic">Belum Ada Transaksi Kategori Ini.</td></tr>
                ) : (
                  filteredTransactions.map((t) => {
                    const price = getPrice(t);
                    const status = getStatus(t);
                    const success = isSuccess(status);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6 border-r-4 border-black">
                          <div className="flex items-center gap-4">
                            <div className="bg-black p-2 border-2 border-black text-white shadow-[3px_3px_0px_0px_rgba(109,74,255,1)]">
                              <CreditCard size={20} />
                            </div>
                            <div>
                              <span className="font-black text-lg italic uppercase block leading-none">
                                {t.profiles?.full_name || 'Guest User'}
                                {t.order_id?.startsWith('BOOST-') && (
                                  <span className="ml-2 bg-[#6D4AFF] text-white border border-black px-1.5 py-0.5 text-[8px] font-black uppercase italic shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    ⚡ BOOST
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic tracking-tighter">
                                {t.order_id?.startsWith('BOOST-') ? `Layanan: Boost Event (${t.events?.title || 'Unknown Stage'})` : `Event: ${t.events?.title || 'Unknown Stage'}`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 border-r-4 border-black text-center">
                          <span className="font-black text-xl italic tracking-tighter text-[#6D4AFF] whitespace-nowrap">
                            {formatRupiah(price)}
                          </span>
                        </td>
                        <td className="p-6 border-r-4 border-black text-center">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-black font-black uppercase italic text-[9px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                            success ? 'bg-emerald-400' : isExpired(status) ? 'bg-red-500 text-white' : 'bg-amber-400'
                          }`}>
                             {success ? <ArrowUpRight size={14} strokeWidth={3} /> : isExpired(status) ? <Zap size={14} strokeWidth={3} /> : <Clock size={14} strokeWidth={3} />}
                             {isExpired(status) ? 'EXPIRED' : status}
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="bg-slate-100 border-2 border-black px-3 py-1 font-black text-[9px] uppercase italic inline-block whitespace-nowrap">
                             {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER INFO */}
        <div className="bg-black text-white p-6 border-4 border-black flex items-center justify-center gap-4 italic font-black uppercase text-[10px] tracking-[0.5em] rotate-1">
          <Zap size={20} className="text-amber-400" />
          Global Ledger System // Data Encrypted & Verified
        </div>
      </div>
    </main>
  );
}
