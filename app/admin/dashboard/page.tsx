"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import { 
  Users, CalendarCheck, MessageSquare, Wallet, 
  TrendingUp, Activity, ArrowUpRight, Globe, BarChart3,
  Zap, ShieldCheck, Terminal
} from "lucide-react";
import Link from "next/link";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    complaints: 0,
    revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchRealData = async () => {
    setIsLoading(true);
    
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: eventCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: complaintCount } = await supabase
      .from("complaints")
      .select("*", { count: "exact", head: true })
      .neq("status", "resolved");

    const { data: revenueData } = await supabase
      .from("transactions")
      .select("total_price")
      .eq("status", "success");
    
    const totalRevenue = revenueData?.reduce((acc, item) => acc + (item.total_price || 0), 0) || 0;

    setStats({
      users: userCount || 0,
      events: eventCount || 0,
      complaints: complaintCount || 0,
      revenue: totalRevenue
    });
    
    setIsLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchRealData();

    const channel = supabase
      .channel('db-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchRealData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);
  };

  if (!mounted) return null;

  return (
    <div className={`space-y-12 pb-20 ${poppins.className} bg-white text-black text-left`}>
      
      {/* HEADER COMMAND CENTER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-black pb-10">
        <div className="space-y-4">
          <div className="bg-black text-white border-2 border-black px-4 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(109,74,255,1)]">
            <Terminal size={14} /> System OS v2.0
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
            COMMAND <span className="text-[#6D4AFF]">CENTER.</span>
          </h1>
          <p className="text-lg font-bold text-slate-500 italic max-w-xl">
            Real-time monitoring engine. Kendali penuh di tangan lo, Man!
          </p>
        </div>

        <div className="flex items-center gap-3 bg-emerald-400 border-4 border-black px-6 py-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-2">
          <div className="w-3 h-3 bg-black rounded-full animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-black italic">Engine Online</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* REVENUE GIANT CARD */}
        <div className="md:col-span-8 bg-black border-8 border-black p-12 relative overflow-hidden shadow-[15px_15px_0px_0px_rgba(109,74,255,1)] group">
          {/* Decorative Mesh */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#6D4AFF] blur-[100px] opacity-30 group-hover:opacity-50 transition-opacity" />
          
          <div className="relative z-10 flex flex-col h-full justify-between gap-12">
            <div className="flex justify-between items-start">
              <div className="bg-[#6D4AFF] border-4 border-white p-5 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Wallet className="text-white" size={40} strokeWidth={3} />
              </div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] italic">Cumulative Revenue</p>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-7xl md:text-9xl font-black text-white tracking-tighter italic leading-none">
                {isLoading ? "SYNC..." : formatRupiah(stats.revenue)}
              </h2>
              <div className="flex items-center gap-4 text-emerald-400 font-black italic uppercase text-sm tracking-widest">
                <TrendingUp size={24} strokeWidth={4} /> 
                <span>+ Real-time flow from success tx</span>
              </div>
            </div>
          </div>
        </div>

        {/* VERIFICATION QUEUE */}
        <div className="md:col-span-4 bg-amber-400 border-8 border-black p-10 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between -rotate-1 hover:rotate-0 transition-transform">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-black/60 uppercase tracking-[0.2em] italic">Attention Required</p>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Review Queue</h3>
          </div>
          
          <div className="my-10">
            <h2 className="text-9xl font-black text-black tracking-tighter leading-none">{stats.events}</h2>
            <p className="text-xs font-black uppercase italic mt-2">Events Waiting</p>
          </div>

          <Link href="/admin/verify-events" className="w-full py-5 bg-black text-white font-black uppercase italic text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3">
            Open Queue <ArrowUpRight size={18} strokeWidth={3} />
          </Link>
        </div>

        {/* USERS TOTAL */}
        <div className="md:col-span-4 bg-white border-8 border-black p-10 shadow-[10px_10px_0px_0px_rgba(109,74,255,1)] group">
           <div className="bg-black text-white w-16 h-16 border-4 border-black flex items-center justify-center mb-10 shadow-[4px_4px_0px_0px_rgba(109,74,255,1)] group-hover:-translate-y-2 transition-transform">
             <Users size={32} strokeWidth={3} />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Verified Members</p>
           <h2 className="text-7xl font-black italic tracking-tighter leading-none">{stats.users}</h2>
           <div className="w-full bg-slate-100 h-6 border-4 border-black mt-8 overflow-hidden">
              <div className="bg-[#6D4AFF] h-full w-[100%] animate-pulse" />
           </div>
        </div>

        {/* COMPLAINTS BOX */}
        <div className="md:col-span-4 bg-white border-8 border-black p-10 shadow-[10px_10px_0px_0px_rgba(239,68,68,1)] relative overflow-hidden group">
          <div className="bg-red-500 text-white w-16 h-16 border-4 border-black flex items-center justify-center mb-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <MessageSquare size={32} strokeWidth={3} />
          </div>
          <div className="flex items-baseline gap-4">
            <h2 className="text-8xl font-black text-black tracking-tighter italic leading-none">{stats.complaints}</h2>
            <div className="bg-black text-white px-2 py-1 text-[8px] font-black uppercase animate-bounce">Hot.</div>
          </div>
          <Link href="/admin/complaints" className="mt-10 flex items-center justify-between border-t-4 border-black pt-6 group-hover:bg-slate-50 transition-colors">
              <span className="text-xs font-black uppercase tracking-widest italic">Solve Issues</span>
              <ArrowUpRight className="text-red-500" size={24} strokeWidth={4} />
          </Link>
        </div>

        {/* LOGS / SYSTEM HEALTH */}
        <div className="md:col-span-4 bg-slate-900 border-8 border-black p-10 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between text-white">
           <div className="bg-white text-black w-16 h-16 border-4 border-black flex items-center justify-center mb-8">
             <Activity size={32} strokeWidth={3} />
           </div>
           <div className="space-y-6">
              <p className="text-xs font-bold leading-relaxed italic text-slate-400">
                "System is polling Supabase Realtime channel. All metrics are 1:1 with DB state."
              </p>
              <div className="flex items-center gap-3 bg-black/50 p-4 border-2 border-white/10">
                 <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Database Linked</span>
              </div>
           </div>
        </div>

      </div>

      {/* FOOTER BRUTAL */}
      <footer className="pt-10 flex items-center justify-center gap-4 text-slate-300">
         <div className="h-[2px] w-20 bg-slate-200" />
         <span className="text-[10px] font-black uppercase tracking-[0.6em] italic">Tiketin Admin OS // 2026</span>
         <div className="h-[2px] w-20 bg-slate-200" />
      </footer>
    </div>
  );
}