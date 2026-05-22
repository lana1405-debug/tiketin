"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import { 
  ArrowLeft, Activity, Users, QrCode, Clock, 
  CheckCircle2, RefreshCw, AlertCircle, Calendar, MapPin
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from "recharts";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700", "900"] });

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface Ticket {
  id: string;
  ticket_code: string;
  seat_info: string;
  status_checkin: boolean;
  last_scanned_date: string | null;
  checked_in_at: string | null;
}

interface LiveScan {
  id: string;
  ticket_code: string;
  seat_info: string;
  time: string;
  isNew: boolean;
}

export default function GateAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const today = getLocalDateString();

  const [event, setEvent] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [liveFeed, setLiveFeed] = useState<LiveScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [flowRates, setFlowRates] = useState<number[]>([]); // Keep track of recent scan timestamps to calculate flow rate

  // Audio ref for check-in beep sound (synthesized using Web Audio API so it works out of the box)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Failed to play beep audio:", e);
    }
  };

  const fetchEventAndTickets = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      // 1. Fetch Event details
      const { data: eventData, error: eventErr } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventErr || !eventData) {
        throw new Error(eventErr?.message || "Event tidak ditemukan.");
      }
      setEvent(eventData);

      // 2. Fetch all tickets for this event
      const { data: ticketsData, error: ticketsErr } = await supabase
        .from("tiket")
        .select("id, ticket_code, seat_info, status_checkin, last_scanned_date, checked_in_at")
        .eq("event_id", eventId);

      if (ticketsErr) throw ticketsErr;

      const formattedTickets = (ticketsData || []).map((t: any) => ({
        id: t.id,
        ticket_code: t.ticket_code,
        seat_info: t.seat_info || "REGULAR",
        status_checkin: t.status_checkin,
        last_scanned_date: t.last_scanned_date,
        checked_in_at: t.checked_in_at
      }));

      setTickets(formattedTickets);

      // 3. Initialize live feed from today's checked-in tickets
      const todayCheckedIn = formattedTickets
        .filter(t => t.status_checkin === true || t.last_scanned_date === today)
        .map(t => {
          let checkinTime = "Hari Ini";
          if (t.checked_in_at) {
            checkinTime = new Date(t.checked_in_at).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            });
          }
          return {
            id: t.id,
            ticket_code: t.ticket_code || `TKT-${t.id.slice(0, 8)}`,
            seat_info: t.seat_info,
            time: checkinTime,
            isNew: false
          };
        })
        // Sort newest check-ins first
        .sort((a, b) => b.time.localeCompare(a.time))
        .slice(0, 15);

      setLiveFeed(todayCheckedIn);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal menyinkronkan data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventAndTickets();

    // ⚡ Setup Supabase Realtime Subscription
    const channel = supabase
      .channel(`live-gate-analytics-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tiket",
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          const updated = payload.new as Ticket;
          
          setTickets((prev) => {
            const index = prev.findIndex(t => t.id === updated.id);
            if (index === -1) return [...prev, updated];
            const next = [...prev];
            next[index] = { ...next[index], ...updated };
            return next;
          });

          // Check if this update constitutes a successful check-in today
          const isCheckin = updated.status_checkin === true || updated.last_scanned_date === today;
          if (isCheckin) {
            playBeep();
            
            // Add check-in timestamp to track flow rate
            const now = Date.now();
            setFlowRates(prev => [...prev, now]);

            // Add to live feed with transition
            const timeStr = new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            });

            const newFeedItem: LiveScan = {
              id: updated.id,
              ticket_code: updated.ticket_code || `TKT-${updated.id.slice(0, 8)}`,
              seat_info: updated.seat_info || "REGULAR",
              time: timeStr,
              isNew: true
            };

            setLiveFeed(prev => [newFeedItem, ...prev.slice(0, 14)]);
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // Clean old flow rates to calculate accurate average scans per minute in the last 10 mins
  useEffect(() => {
    const interval = setInterval(() => {
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      setFlowRates(prev => prev.filter(time => time > tenMinutesAgo));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // 📈 Stats Calculations
  const stats = useMemo(() => {
    const totalSold = tickets.length;
    const checkedIn = tickets.filter(t => t.status_checkin === true || t.last_scanned_date === today).length;
    const remaining = Math.max(0, totalSold - checkedIn);
    const percentage = totalSold > 0 ? Math.round((checkedIn / totalSold) * 100) : 0;
    
    // Calculate flow rate: scans in the last 10 minutes divided by 10
    const recentScansCount = flowRates.length;
    const scansPerMinute = recentScansCount > 0 ? (recentScansCount / 10).toFixed(1) : "0.0";

    return {
      totalSold,
      checkedIn,
      remaining,
      percentage,
      scansPerMinute
    };
  }, [tickets, today, flowRates]);

  // 📊 Ticket categories breakdown data
  const categoryStats = useMemo(() => {
    const categories: Record<string, { sold: number; checkedIn: number }> = {};
    
    tickets.forEach(t => {
      const catName = t.seat_info || "REGULAR";
      if (!categories[catName]) {
        categories[catName] = { sold: 0, checkedIn: 0 };
      }
      categories[catName].sold += 1;
      if (t.status_checkin === true || t.last_scanned_date === today) {
        categories[catName].checkedIn += 1;
      }
    });

    return Object.entries(categories).map(([name, counts]) => ({
      name,
      sold: counts.sold,
      checkedIn: counts.checkedIn,
      pct: counts.sold > 0 ? Math.round((counts.checkedIn / counts.sold) * 100) : 0
    }));
  }, [tickets, today]);

  // 📊 Chart Data: Check-ins by Hour
  const chartData = useMemo(() => {
    const hourlyDistribution: Record<string, number> = {};
    
    // Pre-populate common event check-in hours (e.g. 13:00 to 21:00)
    for (let i = 13; i <= 21; i++) {
      hourlyDistribution[`${String(i).padStart(2, '0')}:00`] = 0;
    }

    tickets.forEach(t => {
      const isChecked = t.status_checkin === true || t.last_scanned_date === today;
      if (isChecked && t.checked_in_at) {
        const time = new Date(t.checked_in_at);
        const hour = time.getHours();
        const key = `${String(hour).padStart(2, '0')}:00`;
        hourlyDistribution[key] = (hourlyDistribution[key] || 0) + 1;
      }
    });

    return Object.entries(hourlyDistribution)
      .map(([hour, count]) => ({ hour, "Check-ins": count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [tickets, today]);

  return (
    <main className={`min-h-screen bg-[#FCFAF1] text-slate-900 p-6 md:p-12 ${poppins.className} text-left`}>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER BAR */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b-8 border-black pb-8">
          <div className="flex items-start gap-4">
            <button 
              onClick={() => router.back()} 
              className="p-3 bg-white border-4 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
            >
              <ArrowLeft size={20} strokeWidth={3} />
            </button>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-emerald-400 text-black border-2 border-black px-3 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2">
                  <Activity size={14} /> Gate Performance Live
                </div>
                
                {/* Live Realtime Status indicator */}
                <div className={`px-3 py-1 text-[10px] font-black uppercase italic border-2 border-black inline-flex items-center gap-1.5 ${
                  isRealtimeConnected ? 'bg-indigo-600 text-white animate-pulse' : 'bg-red-500 text-white'
                }`}>
                  <div className={`h-2.5 w-2.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-400' : 'bg-white'}`} />
                  {isRealtimeConnected ? 'LIVE MATRIX CONNECTED' : 'OFFLINE - RECONNECTING'}
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                GATE <span className="text-[#6D4AFF]">LIVE ANALYTICS.</span>
              </h1>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={fetchEventAndTickets} 
              className="bg-white hover:bg-slate-50 border-4 border-black p-4 font-black uppercase italic text-xs tracking-wider shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} strokeWidth={3} /> Sync Ledger
            </button>
          </div>
        </header>

        {/* EVENT BRIEF CARD */}
        {event && (
          <div className="bg-white border-4 border-black p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[6px_6px_0_0_#000]">
            <div>
              <h2 className="text-2xl font-black italic uppercase -skew-x-3 text-slate-800">{event.title}</h2>
              <div className="flex flex-wrap gap-4 mt-2 font-bold text-xs uppercase text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar size={14} /> {event.date}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} /> {event.location}</span>
              </div>
            </div>
            <div className="bg-black text-white px-4 py-2 border-2 border-black font-black uppercase italic text-xs">
              Category: {event.category || "General Event"}
            </div>
          </div>
        )}

        {/* ERROR BOX */}
        {errorMsg && (
          <div className="bg-red-500 text-white border-4 border-black p-5 font-black italic uppercase flex items-center gap-3 shadow-[6px_6px_0_0_#000] animate-bounce">
            <AlertCircle size={28} />
            <div>
              <p>Database Connection Failure</p>
              <p className="text-xs font-bold mt-1 text-white/80">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* MAIN STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
          
          {/* CHECK-IN PROGRESS PROGRESS CARD */}
          <div className="md:col-span-8 md-gate-col-span-8 bg-amber-400 border-8 border-black p-8 shadow-[12px_12px_0_0_#000] flex flex-col justify-between group relative overflow-hidden w-full">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white blur-[100px] opacity-20" />
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className="bg-black text-white p-3 border-2 border-black shadow-[3px_3px_0_0_#fff]">
                  <QrCode size={24} strokeWidth={3} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] italic text-black/75">Gate Check-in Ratio</p>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-6xl sm:text-7xl font-black italic tracking-tighter leading-none mb-2">
                    {stats.checkedIn}
                  </h2>
                  <span className="text-2xl font-black text-black/60">/ {stats.totalSold} TICKETS SOLD</span>
                </div>
                
                {/* Huge Progress Bar */}
                <div className="w-full bg-black/10 h-8 border-4 border-black mt-4 relative overflow-hidden">
                  <div 
                    className="bg-black h-full transition-all duration-500 flex items-center justify-end pr-3" 
                    style={{ width: `${stats.percentage}%` }}
                  >
                    {stats.percentage > 10 && (
                      <span className="text-[10px] font-black text-amber-400 italic">{stats.percentage}%</span>
                    )}
                  </div>
                  {stats.percentage <= 10 && (
                    <span className="absolute inset-0 flex items-center justify-start pl-3 text-[10px] font-black text-black italic">
                      {stats.percentage}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FLOW RATE & REMAINING GRID */}
          <div className="md:col-span-4 md-gate-col-span-4 grid grid-cols-1 gap-8 w-full">
            {/* FLOW RATE */}
            <div className="bg-cyan-400 border-8 border-black p-6 shadow-[10px_10px_0_0_#000] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase text-slate-900/60 tracking-wider italic">SCAN VELOCITY</p>
                <Clock size={18} strokeWidth={3} />
              </div>
              <div className="my-2">
                <h2 className="text-5xl font-black italic tracking-tighter leading-none">{stats.scansPerMinute}</h2>
                <p className="text-[10px] font-black uppercase italic text-black/60 mt-1">Check-ins / Minute</p>
              </div>
              <p className="text-[8px] font-bold text-slate-800 uppercase tracking-tighter">Rolling avg calculated over last 10 mins</p>
            </div>

            {/* REMAINING ATTENDEES */}
            <div className="bg-white border-8 border-black p-6 shadow-[10px_10px_0_0_#6D4AFF] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider italic">ABSENT MATRIX</p>
                <Users size={18} strokeWidth={3} className="text-[#6D4AFF]" />
              </div>
              <div className="my-2">
                <h2 className="text-5xl font-black italic tracking-tighter leading-none text-[#6D4AFF]">{stats.remaining}</h2>
                <p className="text-[10px] font-black uppercase italic text-slate-500 mt-1">Pending Entrance</p>
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Attendees yet to scan at the gate</p>
            </div>
          </div>
        </div>

        {/* BOTTOM ANALYTICS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          
          {/* TIME SERIES CHART CARD */}
          <div className="lg:col-span-7 lg-gate-col-span-7 bg-white border-8 border-black p-8 shadow-[12px_12px_0_0_#000] flex flex-col min-h-[350px] w-full">
            <h3 className="text-xl font-black italic uppercase mb-6 tracking-tighter border-b-4 border-black pb-2 flex items-center gap-2">
              <Activity size={20} /> HOURLY CHECK-IN DISTRIBUTION
            </h3>
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center font-black uppercase text-slate-400 italic animate-pulse">Syncing distribution...</div>
            ) : chartData.every(d => d["Check-ins"] === 0) ? (
              <div className="flex-1 flex items-center justify-center font-black uppercase text-slate-400 italic">Belum ada scan masuk hari ini.</div>
            ) : (
              <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                    <XAxis dataKey="hour" stroke="#000" tick={{ fontWeight: 'bold', fontSize: 10 }} />
                    <YAxis stroke="#000" tick={{ fontWeight: 'bold', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip 
                      formatter={(value) => [value, 'Check-ins']} 
                      contentStyle={{ background: '#fff', border: '4px solid #000', fontWeight: 'bold' }} 
                    />
                    <Bar dataKey="Check-ins" fill="#6D4AFF" stroke="#000" strokeWidth={3}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6D4AFF' : '#FCD34D'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* TICKET CATEGORIES BREAKDOWN */}
          <div className="lg:col-span-5 lg-gate-col-span-5 bg-white border-8 border-black p-8 shadow-[12px_12px_0_0_#FCD34D] flex flex-col w-full">
            <h3 className="text-xl font-black italic uppercase mb-6 tracking-tighter border-b-4 border-black pb-2 flex items-center gap-2">
              <QrCode size={20} /> RATIO BY CATEGORY / TIER
            </h3>
            <div className="space-y-4 overflow-y-auto flex-1 max-h-[300px] pr-2">
              {categoryStats.length === 0 ? (
                <div className="text-center py-10 font-black uppercase text-slate-300 italic">No category data.</div>
              ) : (
                categoryStats.map((tier, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 border-4 border-black shadow-[3px_3px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-black italic uppercase text-sm text-[#6D4AFF]">{tier.name}</span>
                      <span className="font-black italic text-xs">{tier.checkedIn} / {tier.sold} Scanned</span>
                    </div>
                    {/* Tiny Progress bar */}
                    <div className="w-full bg-slate-200 h-3 border-2 border-black">
                      <div 
                        className="bg-emerald-400 h-full border-r-2 border-black transition-all" 
                        style={{ width: `${tier.pct}%` }} 
                      />
                    </div>
                    <p className="font-black text-right text-[10px] italic mt-1 text-slate-400">{tier.pct}% In-venue</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* LIVE SCAN LOGGER / FEED */}
        <div className="bg-white border-8 border-black shadow-[15px_15px_0_0_#000] overflow-hidden">
          <div className="bg-black p-6 border-b-8 border-black flex justify-between items-center">
            <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
              <CheckCircle2 className="text-[#6D4AFF]" size={28} strokeWidth={3} /> LIVE GATE ENTRANTS LOG
            </h3>
            <span className="bg-[#6D4AFF] text-white border-2 border-white px-3 py-1 text-[10px] font-black uppercase italic tracking-widest animate-pulse">
              REAL-TIME MATRIX
            </span>
          </div>
          <div className="p-8 max-h-[400px] overflow-y-auto space-y-4">
            {liveFeed.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-black italic uppercase text-slate-300 text-2xl">Belum ada scan masuk</p>
                <p className="text-slate-400 font-bold mt-2">Mulai scan e-ticket di pintu masuk untuk menyinkronkan data.</p>
              </div>
            ) : (
              <div className="divide-y-4 divide-slate-100">
                {liveFeed.map((feedItem) => (
                  <div 
                    key={feedItem.id} 
                    className={`flex justify-between items-center py-4 text-left transition-all duration-500 ${
                      feedItem.isNew ? "bg-emerald-100 px-4 border-2 border-emerald-500 animate-bounce" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="font-black italic text-base uppercase text-slate-800">{feedItem.ticket_code}</p>
                      <span className="inline-block bg-black text-amber-400 border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase italic">
                        {feedItem.seat_info}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400 italic">Checked-in At</p>
                      <p className="font-black text-xl italic text-[#6D4AFF]">{feedItem.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
