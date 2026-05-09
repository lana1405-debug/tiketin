"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, ChevronLeft, Calendar, MapPin, 
  QrCode, Download, ShieldCheck, Zap, Ticket as TicketIcon, Loader2
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    box-shadow: 6px 6px 0px 0px #6D4AFF, 12px 12px 0px 0px #000, 18px 18px 0px 0px #FBBF24 !important;
    transition: all 0.3s ease;
  }
  .brutal-shadow-card:hover {
    box-shadow: 8px 8px 0px 0px #FBBF24, 16px 16px 0px 0px #000, 24px 24px 0px 0px #6D4AFF !important;
    transform: translate(-4px, -4px);
  }
  .ticket-stub-divider {
    background-image: linear-gradient(to bottom, #0f172a 50%, transparent 50%);
    background-size: 4px 16px;
    background-repeat: repeat-y;
  }
`;

export default function MyTicketsPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("AKTIF");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(style);
    setMounted(true);
    fetchUserAndTickets();
    return () => { document.head.removeChild(style); };
  }, []);

  const fetchUserAndTickets = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/login");
      return;
    }

    // 1. Ambil Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    if (profile) setUserProfile(profile);

    // 2. Ambil Tiket beneran dari database (Join Tiket -> Events & Transaksi)
    const { data: ticketData, error } = await supabase
      .from("tiket")
      .select(`
        id,
        ticket_code,
        seat_info,
        events (
          title,
          date,
          location,
          category,
          image_url
        ),
        transaksi!inner (
          status_pembayaran
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && ticketData) {
      const formatted = ticketData.map((t: any) => ({
        id: t.ticket_code,
        title: t.events.title,
        date: t.events.date,
        location: t.events.location,
        category: t.events.category,
        status: t.transaksi.status_pembayaran === "paid" ? "AKTIF" : "RIWAYAT",
        seat: t.seat_info || "GENERAL ADMISSION",
        image: t.events.image_url,
      }));
      setTickets(formatted);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const filteredTickets = tickets.filter(t => t.status === activeTab);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen bg-[#FCFAF1] text-slate-900 noise overflow-x-hidden ${poppins.className}`}>
      
      {/* ── HEADER ── */}
      <nav className="w-full bg-white border-b-8 border-slate-900 sticky top-0 z-[50] shadow-[0_8px_0_0_rgba(0,0,0,1)] h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/explore" className="flex items-center gap-2 group">
            <div className="h-10 w-10 bg-black flex items-center justify-center group-hover:-rotate-12 transition-transform shadow-[4px_4px_0_0_#6D4AFF]">
              <ChevronLeft className="text-white" size={24} strokeWidth={3} />
            </div>
            <span className="text-xl font-black italic -skew-x-12 tracking-tighter uppercase ml-2">BACK TO ARENA</span>
          </Link>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group p-1 pr-3 transition-all">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 border-2 border-slate-900 mb-1 inline-block">✓ VERIFIED</p>
                    <p className="text-xs font-black italic -skew-x-6 uppercase">{userProfile?.full_name?.split(" ")[0] || "LEGEND"}</p>
                  </div>
                  <Avatar className="h-10 w-10 border-4 border-slate-900 rounded-none -rotate-6 shadow-[4px_4px_0_0_#6D4AFF] group-hover:rotate-0 transition-transform">
                    <AvatarImage src={userProfile?.avatar_url} />
                    <AvatarFallback className="bg-amber-400 text-slate-900 font-black">X</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 border-4 border-slate-900 rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-0 bg-white z-[60]">
                <div className="p-3 bg-black text-amber-400 font-black italic uppercase text-[10px] tracking-widest border-b-4 border-black">Quick Access</div>
                <DropdownMenuItem onClick={() => router.push("/verify")} className="font-black italic uppercase text-xs py-4 px-4 border-b-4 border-black cursor-pointer hover:bg-amber-400 rounded-none"><ShieldCheck className="mr-3 h-4 w-4" strokeWidth={3} /> Verifikasi KTP</DropdownMenuItem>
                <DropdownMenuItem className="font-black italic uppercase text-xs py-4 px-4 border-b-4 border-black bg-[#6D4AFF] text-white rounded-none"><TicketIcon className="mr-3 h-4 w-4" strokeWidth={3} /> Tiket Saya</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="font-black italic uppercase text-xs py-4 px-4 text-red-500 cursor-pointer hover:bg-red-50 rounded-none"><LogOut className="mr-3 h-4 w-4" strokeWidth={3} /> Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 sm:px-12 pt-16 pb-40">
        
        {/* ── PAGE TITLE ── */}
        <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="bg-amber-400 border-4 border-slate-900 px-4 py-2 font-black uppercase text-[10px] shadow-[4px_4px_0_0_#000] -rotate-2 inline-flex items-center gap-2 mb-6 italic">
              <TicketIcon size={14} /> TICKET INVENTORY
            </div>
            <h1 className="text-6xl md:text-8xl font-black -skew-x-12 italic uppercase leading-[0.8] tracking-tighter drop-shadow-[6px_6px_0_#6D4AFF]">
              TIKET <span className="text-amber-400 drop-shadow-[4px_4px_0_#000] md:drop-shadow-[6px_6px_0_#000]">SAYA.</span>
            </h1>
          </div>
          
          {/* TAB FILTER */}
          <div className="flex bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#000] p-1 w-max">
            {["AKTIF", "RIWAYAT"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 font-black italic uppercase text-sm transition-all ${
                  activeTab === tab ? "bg-[#6D4AFF] text-white shadow-inner" : "bg-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {/* ── TICKET LIST (Spacing diperlebar untuk Triple Shadow) ── */}
        <div className="space-y-24">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-[#6D4AFF]" size={48} strokeWidth={4} />
                <p className="font-black italic text-xl uppercase">Menyusun Arena Tiket...</p>
              </div>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((ticket, idx) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="w-full flex flex-col md:flex-row bg-white border-4 border-slate-900 brutal-shadow-card group relative"
                >
                  {/* KIRI: Info Event */}
                  <div className="flex-1 flex flex-col sm:flex-row">
                    <div className="w-full sm:w-48 h-48 sm:h-full border-b-4 sm:border-b-0 sm:border-r-4 border-slate-900 overflow-hidden relative bg-black shrink-0">
                      <img src={ticket.image} alt={ticket.title} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500 opacity-80 group-hover:opacity-100" />
                      <div className="absolute top-3 left-3 bg-slate-900 text-white px-2 py-1 font-black text-[10px] tracking-widest uppercase border-2 border-white">
                        {ticket.category}
                      </div>
                    </div>
                    
                    <div className="p-6 md:p-8 flex flex-col justify-center flex-grow text-left">
                      <h3 className="text-3xl md:text-4xl font-black italic uppercase -skew-x-6 tracking-tighter mb-4 leading-none text-slate-900">
                        {ticket.title}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-400 p-2 border-2 border-slate-900 shadow-[2px_2px_0_0_#000]"><Calendar size={16} strokeWidth={3}/></div>
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">TANGGAL</p>
                            <p className="text-sm font-black uppercase text-slate-900">{ticket.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-[#6D4AFF] text-white p-2 border-2 border-slate-900 shadow-[2px_2px_0_0_#000]"><MapPin size={16} strokeWidth={3}/></div>
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">LOKASI</p>
                            <p className="text-sm font-black uppercase text-slate-900 line-clamp-1">{ticket.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PEMBATAS TIKET */}
                  <div className="hidden md:flex flex-col items-center justify-between relative w-8 shrink-0 bg-[#FCFAF1]">
                    <div className="w-6 h-6 rounded-full border-4 border-slate-900 bg-[#FCFAF1] absolute -top-4 -translate-y-1/2 z-10" />
                    <div className="w-0.5 h-full ticket-stub-divider my-2" />
                    <div className="w-6 h-6 rounded-full border-4 border-slate-900 bg-[#FCFAF1] absolute -bottom-4 translate-y-1/2 z-10" />
                  </div>

                  {/* KANAN: QR Code & ID */}
                  <div className="w-full md:w-64 p-6 md:p-8 flex flex-col justify-center items-center text-center bg-white shrink-0 border-t-4 md:border-t-0 border-slate-900">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">TICKET ID</p>
                    <p className="text-base font-black uppercase bg-slate-100 px-4 py-1 border-2 border-slate-900 mb-6">{ticket.id}</p>
                    
                    <div className="bg-slate-900 p-4 shadow-[4px_4px_0_0_#FBBF24] mb-6">
                      <QrCode size={64} className="text-white" strokeWidth={1.5} />
                    </div>

                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">SECTION / SEAT</p>
                    <p className="text-sm font-black text-[#6D4AFF] italic uppercase">{ticket.seat}</p>
                    
                    {activeTab === "AKTIF" && (
                      <button className="mt-6 w-full bg-slate-900 text-white font-black italic uppercase text-xs py-3 border-2 border-slate-900 shadow-[4px_4px_0_0_#6D4AFF] hover:bg-amber-400 hover:text-slate-900 hover:shadow-[4px_4px_0_0_#000] transition-all flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1 active:shadow-none">
                        <Download size={14} strokeWidth={3} /> E-TICKET
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="py-32 text-center border-[8px] border-dashed border-slate-300 bg-white shadow-[12px_12px_0_0_rgba(0,0,0,0.05)] w-full"
              >
                <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-slate-300">
                  <TicketIcon size={40} className="text-slate-300" strokeWidth={3} />
                </div>
                <p className="text-5xl font-black italic uppercase text-slate-300 mb-2">TIKET KOSONG!</p>
                <p className="text-slate-400 font-bold italic uppercase">Lo belum punya tiket di kategori ini.</p>
                <Link href="/explore" className="inline-block mt-8 bg-amber-400 text-black px-10 py-5 font-black uppercase italic border-4 border-black shadow-[6px_6px_0_0_#6D4AFF] hover:bg-white transition-all -skew-x-6">
                  CARI EVENT SEKARANG 🔥
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-black text-white py-12 px-6 sm:px-12 border-t-[12px] border-black text-center relative overflow-hidden mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap size={24} className="text-amber-400" fill="currentColor" />
            <span className="text-2xl font-black italic -skew-x-12 tracking-tighter uppercase text-white">TIKETIN</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">© 2026 TIKETIN. ALL STAGES PROTECTED.</p>
        </div>
      </footer>
    </div>
  );
}