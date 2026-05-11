"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { 
  Wallet, Ticket, TrendingUp, Users, 
  Calendar, Loader2, Zap, AlertCircle, ArrowUpRight, PlusCircle 
} from "lucide-react";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function EODashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    ticketsSold: 0,
    remainingTickets: 0,
    activeEvents: 0
  });
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchEOData();
  }, []);

  const fetchEOData = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 1. Ambil semua event milik EO ini
    const { data: eoEvents, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("organizer_id", session.user.id);

    console.log("🎯 LOG EVENT EO:", eoEvents); // CEK KONSOL F12

    if (eoEvents && eoEvents.length > 0) {
      setEvents(eoEvents);
      
      // 2. Ambil semua transaksi sukses untuk event-event milik EO ini
      const eventIds = eoEvents.map(e => e.id);
      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select("total_price, quantity, status")
        .in("event_id", eventIds)
        .eq("status", "success");

      console.log("💰 LOG TRANSAKSI SUKSES:", transactions); // CEK KONSOL F12

      // 3. Kalkulasi metrik
      const revenue = transactions?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0;
      const sold = transactions?.reduce((acc, curr) => acc + (curr.quantity || 0), 0) || 0;
      const totalStock = eoEvents.reduce((acc, curr) => acc + (curr.stock || 0), 0);
      
      setStats({
        totalRevenue: revenue,
        ticketsSold: sold,
        remainingTickets: totalStock - sold,
        activeEvents: eoEvents.length
      });
    } else {
      console.log("EO INI BELUM PUNYA EVENT SAMA SEKALI.");
    }
    setIsLoading(false);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { 
      style: "currency", currency: "IDR", maximumFractionDigits: 0 
    }).format(angka);
  };

  if (!mounted || isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white font-black italic text-[#6D4AFF]">
      <Loader2 className="animate-spin mb-4" size={48} strokeWidth={4} />
      LOADING DASHBOARD...
    </div>
  );

  return (
    <div className={`space-y-12 pb-20 ${poppins.className} text-black text-left`}>
      
      {/* HEADER SECTION */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 border-b-8 border-black pb-10">
        <div className="space-y-4">
          <div className="bg-emerald-400 text-black border-2 border-black px-4 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Zap size={14} strokeWidth={3} /> EO Performance Radar
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
            EO <span className="text-[#6D4AFF]">DASHBOARD.</span>
          </h1>
          <p className="text-lg font-bold text-slate-500 italic">Pantau cuan dan sisa tiket lo secara real-time, </p>
        </div>

        {/* TOMBOL BUAT EVENT BARU */}
        <Link 
          href="/dashboard/create-event" 
          className="bg-[#6D4AFF] text-white border-4 border-black px-8 py-4 font-black uppercase italic text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-3"
        >
          <PlusCircle size={20} strokeWidth={3} /> Buat Event Baru
        </Link>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* TOTAL REVENUE CARD */}
        <div className="md:col-span-7 bg-black border-8 border-black p-10 text-white shadow-[12px_12px_0px_0px_rgba(109,74,255,1)] relative overflow-hidden group">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-[#6D4AFF] blur-[100px] opacity-40" />
          <div className="relative z-10 flex flex-col justify-between h-full gap-10">
            <div className="flex justify-between items-start">
              <div className="bg-[#6D4AFF] p-4 border-4 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Wallet size={32} strokeWidth={3} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] italic text-slate-400">Total Revenue</p>
            </div>
            <div>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter leading-none mb-4 truncate">
                {formatRupiah(stats.totalRevenue)}
              </h2>
              <div className="flex items-center gap-3 text-emerald-400 font-black uppercase italic text-xs">
                <TrendingUp size={20} strokeWidth={3} /> Net profit from successful sales
              </div>
            </div>
          </div>
        </div>

        {/* REMAINING TICKETS CARD */}
        <div className="md:col-span-5 bg-amber-400 border-8 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between -rotate-1 hover:rotate-0 transition-transform">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] italic text-black/60">Inventory Health</p>
            <Ticket size={24} strokeWidth={3} />
          </div>
          <div className="my-8 text-left">
            <h2 className="text-8xl font-black italic tracking-tighter leading-none">{stats.remainingTickets}</h2>
            <p className="text-sm font-black uppercase italic mt-2 text-black/60">Tiket Tersedia</p>
          </div>
          <div className="w-full bg-black/10 h-4 border-2 border-black">
             <div 
               className="bg-black h-full transition-all duration-1000" 
               style={{ width: stats.remainingTickets + stats.ticketsSold > 0 ? `${(stats.remainingTickets / (stats.remainingTickets + stats.ticketsSold)) * 100}%` : '0%' }} 
             />
          </div>
        </div>

        {/* TICKETS SOLD */}
        <div className="md:col-span-6 bg-white border-8 border-black p-10 shadow-[10px_10px_0px_0px_rgba(109,74,255,1)] group">
           <div className="bg-black text-white w-14 h-14 border-4 border-black flex items-center justify-center mb-8 shadow-[4px_4px_0px_0px_rgba(109,74,255,1)]">
             <Users size={28} strokeWidth={3} />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Sold Out Progress</p>
           <h2 className="text-7xl font-black italic tracking-tighter leading-none">{stats.ticketsSold} <span className="text-xl">Terjual</span></h2>
        </div>

        {/* ACTIVE EVENTS */}
        <div className="md:col-span-6 bg-slate-900 border-8 border-black p-10 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-white">
           <div className="bg-white text-black w-14 h-14 border-4 border-black flex items-center justify-center mb-8">
             <Calendar size={28} strokeWidth={3} />
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-2">Hosted Stages</p>
           <h2 className="text-7xl font-black italic tracking-tighter leading-none">{stats.activeEvents} <span className="text-xl">Events</span></h2>
        </div>

      </div>

      {/* RECENT SALES LIST */}
      <div className="bg-white border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="bg-black p-6 border-b-8 border-black">
           <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4">
             <ArrowUpRight className="text-[#6D4AFF]" size={28} strokeWidth={4} /> Live Inventory Status
           </h3>
        </div>
        <div className="p-8">
           {events.length === 0 ? (
             <div className="text-center py-10">
               <p className="font-black italic uppercase text-slate-300 text-2xl">Belum Ada Panggung </p>
               <p className="text-slate-400 font-bold mt-2">Bikin event pertama lo sekarang.</p>
             </div>
           ) : (
             <div className="space-y-4">
               {events.map((event) => (
                 <div key={event.id} className="flex justify-between items-center border-b-4 border-slate-100 pb-4">
                   <div className="text-left">
                     <p className="font-black italic uppercase text-lg leading-none">{event.title}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase italic mt-1">{event.location}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs font-black uppercase text-slate-400 italic">Tersisa</p>
                     <p className="font-black text-2xl italic text-[#6D4AFF]">{event.stock} <span className="text-[10px]">Tix</span></p>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}