"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import { 
  Users, CalendarCheck, MessageSquare, Wallet, 
  TrendingUp, Activity, ArrowUpRight, Globe, BarChart3,
  Zap, ShieldCheck, Terminal, IdCard, Landmark
} from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/components/ui/toast-brutal";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    ktpPending: 0,
    complaints: 0,
    revenue: 0,
    profit: 0
  });
  const [activeTab, setActiveTab] = useState<"overview" | "queues" | "settings">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [marqueeInput, setMarqueeInput] = useState("");
  const [isUpdatingMarquee, setIsUpdatingMarquee] = useState(false);
  const [revenueChartData, setRevenueChartData] = useState<{ month: string; revenue: number; profit: number }[]>([]);

  const fetchRealData = async () => {
    setIsLoading(true);
    
    // Total Users
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Pending Events
    const { count: eventCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Pending KTP Verifications
    const { count: ktpCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "pending");

    // Unresolved Complaints
    const { count: complaintCount } = await supabase
      .from("complaints")
      .select("*", { count: "exact", head: true })
      .neq("status", "resolved");

    // Total Revenue & Profit Calculation — with created_at for chart
    const { data: revenueData } = await supabase
      .from("transaksi")
      .select("total_bayar, created_at, order_id")
      .eq("status_pembayaran", "paid");
    
    let totalTicketGross = 0;
    let totalBoostGross = 0;
    revenueData?.forEach(item => {
      const isBoost = item.order_id?.startsWith('BOOST-');
      const val = Number(item.total_bayar) || 0;
      if (isBoost) {
        totalBoostGross += val;
      } else {
        totalTicketGross += val;
      }
    });

    const totalGross = totalTicketGross + totalBoostGross;
    
    // ⚡ PROFIT PLATFORM: 15% dari tiket biasa + 100% dari boost event
    const platformProfit = Math.round(totalTicketGross * 0.15) + totalBoostGross;

    setStats({
      users: userCount || 0,
      events: eventCount || 0,
      ktpPending: ktpCount || 0,
      complaints: complaintCount || 0,
      revenue: totalGross,
      profit: platformProfit
    });

    // ⚡ CHART DATA — Group by month
    const monthlyTicketMap: Record<string, number> = {};
    const monthlyBoostMap: Record<string, number> = {};
    const monthNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    
    revenueData?.forEach((item: any) => {
      const d = new Date(item.created_at);
      const key = `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
      const val = Number(item.total_bayar || 0);
      const isBoost = item.order_id?.startsWith('BOOST-');
      
      if (isBoost) {
        monthlyBoostMap[key] = (monthlyBoostMap[key] || 0) + val;
      } else {
        monthlyTicketMap[key] = (monthlyTicketMap[key] || 0) + val;
      }
    });

    const allMonths = Array.from(new Set([
      ...Object.keys(monthlyTicketMap), 
      ...Object.keys(monthlyBoostMap)
    ]));

    const chartArr = allMonths.map(month => {
      const ticketRev = monthlyTicketMap[month] || 0;
      const boostRev = monthlyBoostMap[month] || 0;
      const totalRev = ticketRev + boostRev;
      const profit = Math.round(ticketRev * 0.15) + boostRev;
      return { month, revenue: totalRev, profit };
    });

    setRevenueChartData(chartArr.slice(-6));
    
    // Fetch Marquee Settings
    const { data: marqueeData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "marquee_ticker")
      .single();
    if (marqueeData && Array.isArray(marqueeData.value)) {
      setMarqueeInput(marqueeData.value.join(", "));
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchRealData();

    const channel = supabase
      .channel('db-realtime-admin')
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

  const saveMarquee = async () => {
    setIsUpdatingMarquee(true);
    const items = marqueeInput.split(",").map(i => i.trim()).filter(i => i.length > 0);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "marquee_ticker", value: items, updated_at: new Date().toISOString() });
    if (error) {
      toast("Gagal mengupdate marquee: " + error.message, "error");
    } else {
      toast("Teks Marquee berhasil diperbarui!", "success");
    }
    setIsUpdatingMarquee(false);
  };

  if (!mounted) return null;

  return (
    <div className={`space-y-10 pb-20 ${poppins.className} bg-white text-black text-left`}>
      
      {/* HEADER COMMAND CENTER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-black pb-8">
        <div className="space-y-3">
          <div className="bg-black text-white border-2 border-black px-4 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(109,74,255,1)]">
            <Terminal size={14} /> System OS v2.0
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
            COMMAND <span className="text-[#6D4AFF]">CENTER.</span>
          </h1>
          <p className="text-lg font-bold text-slate-500 italic max-w-xl">
            Real-time monitoring engine. Kendali penuh di tangan Anda.
          </p>
        </div>

        <div className="flex flex-col gap-3 items-end">
           <div className="flex items-center gap-3 bg-emerald-400 border-4 border-black px-6 py-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-2 hover:rotate-0 transition-transform">
             <div className="w-3 h-3 bg-black rounded-full animate-pulse" />
             <span className="text-xs font-black uppercase tracking-widest text-black italic">Engine Online</span>
           </div>
           {isLoading && <span className="text-[10px] font-black uppercase tracking-widest italic text-slate-400 animate-pulse">Syncing Matrix...</span>}
        </div>
      </header>

      {/* QUICK ACTIONS BAR */}
      <div className="flex flex-wrap gap-4">
         <Link href="/admin/event-analytics" className="bg-[#6D4AFF] text-white px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all flex items-center gap-2 font-black italic uppercase text-xs">
            <BarChart3 size={16} /> Analytics
         </Link>
         <Link href="/admin/transactions" className="bg-amber-400 text-black px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all flex items-center gap-2 font-black italic uppercase text-xs">
            <Wallet size={16} /> Global Sales
         </Link>
         <Link href="/admin/withdrawals" className="bg-emerald-400 text-black px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all flex items-center gap-2 font-black italic uppercase text-xs">
            <Landmark size={16} /> Payouts
         </Link>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap gap-4 border-b-8 border-black pb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-6 py-3 border-4 border-black font-black uppercase italic text-xs shadow-[4px_4px_0_0_#000] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all ${
            activeTab === "overview"
              ? "bg-[#6D4AFF] text-white"
              : "bg-white text-black hover:bg-slate-50"
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab("queues")}
          className={`px-6 py-3 border-4 border-black font-black uppercase italic text-xs shadow-[4px_4px_0_0_#000] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all flex items-center gap-2 ${
            activeTab === "queues"
              ? "bg-amber-400 text-black"
              : "bg-white text-black hover:bg-slate-50"
          }`}
        >
          🔍 Antrean Verifikasi
          <span className="bg-red-500 text-white border-2 border-black px-2 py-0.5 text-[8px] font-black uppercase shadow-[1px_1px_0_0_#000] ml-1">
            {stats.events + stats.ktpPending + stats.complaints}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-6 py-3 border-4 border-black font-black uppercase italic text-xs shadow-[4px_4px_0_0_#000] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all ${
            activeTab === "settings"
              ? "bg-emerald-400 text-black"
              : "bg-white text-black hover:bg-slate-50"
          }`}
        >
          ⚙️ Pengaturan & Log
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* ========================================== */}
        {/* TAB 1: OVERVIEW                            */}
        {/* ========================================== */}
        {activeTab === "overview" && (
          <>
            {/* REVENUE CHART */}
            <div className="md:col-span-12 bg-white border-8 border-black p-8 shadow-[10px_10px_0px_0px_rgba(109,74,255,1)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Financial Overview</p>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Revenue <span className="text-[#6D4AFF]">per Bulan</span></h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase italic">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#6D4AFF] border-2 border-black" /><span>Gross Revenue</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-400 border-2 border-black" /><span>Profit (15%)</span></div>
                </div>
              </div>
              {revenueChartData.length === 0 ? (
                <div className="h-[240px] flex items-center justify-center border-4 border-dashed border-slate-200">
                  <p className="font-black italic uppercase text-slate-300 text-lg">Belum Ada Data Transaksi</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6D4AFF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6D4AFF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontFamily: "inherit", fontWeight: 900, fontSize: 10 }} axisLine={{ stroke: "#0f172a", strokeWidth: 3 }} tickLine={false} />
                    <YAxis tick={{ fontFamily: "inherit", fontWeight: 700, fontSize: 9 }} axisLine={{ stroke: "#0f172a", strokeWidth: 3 }} tickLine={false} tickFormatter={(v: number) => `${(v/1000000).toFixed(0)}jt`} />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "3px solid #0f172a", borderRadius: 0, fontFamily: "inherit" }}
                      labelStyle={{ color: "#FBBF24", fontWeight: 900, fontSize: 10, textTransform: "uppercase" }}
                      itemStyle={{ color: "#fff", fontWeight: 700, fontSize: 10 }}
                      formatter={(value) => [`Rp ${Number(value ?? 0).toLocaleString("id-ID")}`, ""]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6D4AFF" strokeWidth={3} fill="url(#colorRevenue)" dot={{ fill: "#6D4AFF", strokeWidth: 3, r: 5, stroke: "#0f172a" }} name="Gross" />
                    <Area type="monotone" dataKey="profit" stroke="#FBBF24" strokeWidth={3} fill="url(#colorProfit)" dot={{ fill: "#FBBF24", strokeWidth: 3, r: 5, stroke: "#0f172a" }} name="Profit" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* REVENUE GIANT CARD (GROSS) */}
            <div className="md:col-span-7 bg-black border-8 border-black p-10 relative overflow-hidden shadow-[15px_15px_0px_0px_rgba(109,74,255,1)] group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#6D4AFF] blur-[100px] opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                <div className="flex justify-between items-start">
                  <div className="bg-[#6D4AFF] border-4 border-white p-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <Wallet className="text-white" size={32} strokeWidth={3} />
                  </div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] italic text-right leading-relaxed">Total Gross<br/>Capital Flow</p>
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl sm:text-5xl lg:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter italic leading-none break-words pr-4 pb-1">
                    {isLoading ? "SYNC..." : formatRupiah(stats.revenue)}
                  </h2>
                  <div className="flex items-center gap-4 text-emerald-400 font-black italic uppercase text-[10px] tracking-widest">
                    <TrendingUp size={20} strokeWidth={4} /> 
                    <span>+ Real-time DB Sync</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ⚡ PLATFORM PROFIT CARD (OWNER'S SHARE 15%) */}
            <div className="md:col-span-5 bg-[#6D4AFF] border-8 border-black p-10 shadow-[15px_15px_0px_0px_#000] flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                <Zap size={180} fill="white" />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0_0_#000]">
                    <Zap className="text-[#6D4AFF]" size={32} strokeWidth={3} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">Net Profit</p>
                    <p className="text-[14px] font-black text-amber-400 uppercase italic">Tiketin Share</p>
                  </div>
                </div>
                <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tighter italic leading-none break-words mb-4 pr-2">
                  {formatRupiah(stats.profit)}
                </h2>
                <div className="inline-flex items-center gap-2 bg-black text-emerald-400 px-3 py-1 border-2 border-white text-[10px] font-black uppercase italic shadow-[3px_3px_0_0_#fff]">
                  <Activity size={14} /> Passive Income Active
                </div>
              </div>
            </div>

            {/* USERS TOTAL */}
            <div className="md:col-span-12 bg-white border-8 border-black p-8 shadow-[10px_10px_0px_0px_#FCD34D] group text-left">
               <div className="flex items-center justify-between">
                   <div className="flex items-center gap-6 text-left">
                        <div className="bg-black text-white w-14 h-14 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#FCD34D]">
                            <Users size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-left">Global Members</p>
                            <h2 className="text-5xl font-black italic tracking-tighter leading-none text-left">{stats.users} Users</h2>
                        </div>
                   </div>
                   <div className="flex-1 max-w-xs bg-slate-100 h-4 border-4 border-black overflow-hidden hidden md:block">
                      <div className="bg-[#6D4AFF] h-full w-[100%] animate-pulse" />
                   </div>
               </div>
            </div>
          </>
        )}

        {/* ========================================== */}
        {/* TAB 2: QUEUES                              */}
        {/* ========================================== */}
        {activeTab === "queues" && (
          <>
            {/* EVENT QUEUE CARD */}
            <div className="md:col-span-4 bg-amber-400 border-8 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between -rotate-1 hover:rotate-0 transition-transform">
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-black text-black/60 uppercase tracking-[0.2em] italic text-left">Approval Req</p>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none text-left">Event Queue</h3>
              </div>
              <div className="my-8 text-left">
                <h2 className="text-8xl font-black text-black tracking-tighter leading-none text-left">{stats.events}</h2>
                <p className="text-[10px] font-black uppercase italic mt-1 text-black/70 text-left">Events Waiting</p>
              </div>
              <Link href="/admin/verify-events" className="w-full py-4 bg-black text-white font-black uppercase italic text-[10px] tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2">
                Review Events <ArrowUpRight size={16} strokeWidth={3} />
              </Link>
            </div>

            {/* KTP QUEUE CARD */}
            <div className="md:col-span-4 bg-white border-8 border-black p-8 shadow-[12px_12px_0px_0px_#6D4AFF] flex flex-col justify-between rotate-1 hover:rotate-0 transition-transform">
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-left">KYC Check</p>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none text-left">KTP Queue</h3>
              </div>
              <div className="my-8 flex justify-between items-end text-left">
                <div>
                   <h2 className="text-8xl font-black tracking-tighter leading-none text-left">{stats.ktpPending}</h2>
                   <p className="text-[10px] font-black uppercase italic mt-1 text-slate-500 text-left">Unverified IDs</p>
                </div>
                <IdCard size={64} className="text-slate-100 -rotate-12" />
              </div>
              <Link href="/admin/verify-ktp" className="w-full py-4 bg-black text-white font-black uppercase italic text-[10px] tracking-widest shadow-[4px_4px_0px_0px_rgba(109,74,255,0.4)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2">
                Verify Users <ArrowUpRight size={16} strokeWidth={3} />
              </Link>
            </div>

            {/* COMPLAINTS QUEUE CARD */}
            <div className="md:col-span-4 bg-white border-8 border-black p-8 shadow-[12px_12px_0px_0px_rgba(239,68,68,1)] relative overflow-hidden group flex flex-col justify-between text-left">
              <div>
                <div className="bg-red-500 text-white w-14 h-14 border-4 border-black flex items-center justify-center mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <MessageSquare size={24} strokeWidth={3} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-2 text-left">Customer Issues</p>
                <div className="flex items-baseline gap-4 text-left">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tighter italic leading-none text-left">{stats.complaints}</h2>
                    {stats.complaints > 0 && (
                    <div className="bg-black text-white px-2 py-1 text-[8px] font-black uppercase animate-bounce">Pending</div>
                    )}
                </div>
              </div>
              <Link href="/admin/complaints" className="mt-6 flex items-center justify-between border-t-4 border-black pt-4 group-hover:bg-slate-50 transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Open Inbox</span>
                  <ArrowUpRight className="text-red-500" size={20} strokeWidth={4} />
              </Link>
            </div>
          </>
        )}

        {/* ========================================== */}
        {/* TAB 3: SETTINGS                            */}
        {/* ========================================== */}
        {activeTab === "settings" && (
          <>
            {/* DYNAMIC SETTINGS: MARQUEE EDITOR */}
            <div className="md:col-span-12 bg-white border-8 border-black p-8 shadow-[10px_10px_0px_0px_#6D4AFF] text-black text-left">
              <div className="flex items-center gap-3 mb-4 text-left">
                <Globe className="text-[#6D4AFF]" size={28} strokeWidth={3} />
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-left">📢 Marquee Ticker Settings</h3>
              </div>
              <p className="text-xs text-slate-500 font-bold mb-4 uppercase text-left">
                Ubah teks berjalan di halaman explore secara dinamis. Pisahkan setiap kalimat dengan tanda koma (,).
              </p>
              <div className="flex flex-col md:flex-row gap-4 text-left">
                <input
                  type="text"
                  value={marqueeInput}
                  onChange={(e) => setMarqueeInput(e.target.value)}
                  placeholder="Contoh: TIKET LIVE NOW, TIKET TERBATAS, PROMO BARU"
                  className="flex-1 p-4 border-4 border-black font-black italic uppercase text-xs outline-none focus:bg-slate-50 text-left"
                />
                <button
                  onClick={saveMarquee}
                  disabled={isUpdatingMarquee}
                  className="bg-black text-white px-8 py-4 border-4 border-black font-black italic uppercase text-xs shadow-[4px_4px_0_0_#6D4AFF] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {isUpdatingMarquee ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>

            {/* LOGS / SYSTEM HEALTH */}
            <div className="md:col-span-12 bg-slate-900 border-8 border-black p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center text-white gap-6 text-left">
               <div className="flex items-center gap-4 w-full md:w-auto text-left">
                  <div className="bg-white text-black w-14 h-14 border-4 border-black flex items-center justify-center shrink-0">
                    <Activity size={24} strokeWidth={3} />
                  </div>
                  <p className="text-[10px] md:text-xs font-bold leading-relaxed italic text-slate-400 max-w-sm text-left">
                    "Owner Control Module Active. Profit engine monitoring transactions in 15% ratio."
                  </p>
               </div>
               
               <div className="flex items-center gap-3 bg-black/50 p-4 border-2 border-white/10 w-full md:w-auto justify-center">
                  <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Profit Ledger Online</span>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
