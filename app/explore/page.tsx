"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Search, MapPin, Calendar, LogOut, Ticket,
  ChevronRight, Sparkles, User, LayoutDashboard,
  Heart as HeartIcon,
  Loader2, Mail, Phone, Camera, Send, Play,
  Trophy, MessageSquare, PlusCircle, Zap, TrendingUp,
  Ticket as TicketIcon, ShieldCheck, ArrowUp, Star,
  Users, Globe, Music, Receipt, Filter, X, Share2, Clock, BookOpen
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast-brutal";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import NotificationBell from "@/components/NotificationBell";
import ChatDrawer from "@/components/ChatDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const poppins_font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// ⚡ 1. DEFINISI INTERFACE TYPESCRIPT
interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  verification_status: string;
}

interface Event {
  id: string;
  title: string;
  location: string;
  description: string;
  category: string;
  image_url: string;
  date: string;
  end_date?: string | null;
  price: number;
  totalRemainingStock: number;
  avgRating?: number;
  totalReviews?: number;
  hasVoucher?: boolean;
  profiles?: {
    full_name: string;
    eo_name: string | null;
    verification_status: string;
  } | null;
}

// ⚡ EFEK BACKGROUND MEGA BRUTALIST
const GLOBAL_STYLES = `
  .noise::after {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:999; opacity:.04;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }
  .brutal-grid {
    background-size: 40px 40px;
    background-image:
      linear-gradient(to right, rgba(0, 0, 0, 0.05) 2px, transparent 2px),
      linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 2px, transparent 2px);
  }
  .dark .brutal-grid {
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.05) 2px, transparent 2px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 2px, transparent 2px);
  }
  .brutal-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .brutal-scroll::-webkit-scrollbar-track {
    background: #FCFAF1;
    border-left: 2px solid #000;
  }
  .dark .brutal-scroll::-webkit-scrollbar-track {
    background: #09090b;
    border-left: 2px solid #fff;
  }
  .brutal-scroll::-webkit-scrollbar-thumb {
    background: #6D4AFF;
    border: 2px solid #000;
  }
  .dark .brutal-scroll::-webkit-scrollbar-thumb {
    background: var(--primary-color, #6D4AFF);
    border: 2px solid #fff;
  }
  @keyframes marquee {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-50%); }
  }
  .animate-marquee-css {
    display: flex;
    animation: marquee 28s linear infinite;
  }
  .animate-marquee-css:hover {
    animation-play-state: paused;
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 10s linear infinite;
  }
  @keyframes equalizer-1 {
    0%, 100% { height: 4px; }
    50% { height: 11px; }
  }
  @keyframes equalizer-2 {
    0%, 100% { height: 10px; }
    50% { height: 3px; }
  }
  @keyframes equalizer-3 {
    0%, 100% { height: 6px; }
    50% { height: 12px; }
  }
  .animate-equalizer-bar-1 {
    animation: equalizer-1 0.8s ease-in-out infinite;
  }
  .animate-equalizer-bar-2 {
    animation: equalizer-2 0.7s ease-in-out infinite;
  }
  .animate-equalizer-bar-3 {
    animation: equalizer-3 0.9s ease-in-out infinite;
  }
`;

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ─── Marquee Component ───────────────────────────────────────────────────────
function MarqueeTicker({ items }: { items: string[] }) {
  const fallbackItems = [
    "🎸 KONSER TERBARU UDAH LIVE",
    "🎫 TIKET LIMITED — GASKEUN SEKARANG",
    "🎭 TEATER EKSKLUSIF HADIR DI TIKETIN",
    "🔥 500+ EVENT TERSEDIA BULAN INI",
    "🏆 #1 PLATFORM TIKET IN KONSER INDONESIA",
    "✨ DAFTARIN EVENT DI TIKETIN",
  ];
  const activeItems = items && items.length > 0 ? items : fallbackItems;
  const repeated = [...activeItems, ...activeItems];
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-amber-400 border-b-4 border-slate-900 overflow-hidden h-10 flex items-center relative z-10"
    >
      <div className="animate-marquee-css gap-16 whitespace-nowrap">
        {activeItems.length > 0 && repeated.map((item, i) => (
          <span key={i} className="font-black uppercase italic text-[11px] tracking-widest text-slate-900 shrink-0">
            {item}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Stats Counter ────────────────────────────────────────────────────────────
function AnimatedNumber({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 60;
    const interval = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(interval); return; }
      setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(interval);
  }, [inView, target]);
  return <span ref={ref}>{count.toLocaleString("id-ID")}</span>;
}

function DotGrid({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: "radial-gradient(circle, #00000018 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
      }}
    />
  );
}

function CategoryBadge({ category }: { category: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    MUSIK: { bg: "bg-[#6D4AFF] text-white", text: "MUSIK" },
    TEATER: { bg: "bg-emerald-400 text-slate-900", text: "TEATER" },
  };
  const style = map[category?.toUpperCase()] ?? { bg: "bg-slate-200 text-slate-700", text: category ?? "EVENT" };
  const isMusik = category?.toUpperCase() === "MUSIK";
  return (
    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border-2 border-slate-900 ${style.bg} shadow-[2px_2px_0_0_#000] flex items-center gap-1.5`}>
      {style.text}
      {isMusik && (
        <span className="flex items-end gap-[1.5px] h-2.5 w-3 pb-[1px]" aria-hidden="true">
          <span className="w-[1.5px] bg-white rounded-full animate-equalizer-bar-1" style={{ height: '4px' }} />
          <span className="w-[1.5px] bg-white rounded-full animate-equalizer-bar-2" style={{ height: '8px' }} />
          <span className="w-[1.5px] bg-white rounded-full animate-equalizer-bar-3" style={{ height: '6px' }} />
        </span>
      )}
    </span>
  );
}

// ─── Countdown Mini untuk Event Card ─────────────────────────────────────────
function EventCountdown({ dateStr }: { dateStr: string }) {
  const calculate = useCallback(() => {
    const now = new Date().getTime();
    const target = new Date(dateStr + "T00:00:00").getTime();
    const diff = target - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
  }, [dateStr]);
  const [cd, setCd] = useState(calculate);
  useEffect(() => {
    setCd(calculate());
    const interval = setInterval(() => setCd(calculate()), 60000);
    return () => clearInterval(interval);
  }, [calculate]);
  if (!cd) return null;
  return (
    <div className="flex items-center gap-1.5 bg-slate-900 border-l-4 border-amber-400 px-2 py-1 text-[9px] font-black uppercase text-white">
      <Clock size={10} strokeWidth={3} className="text-amber-400 shrink-0" />
      {cd.days > 0 ? (
        <span><span className="text-amber-400">{cd.days}</span> hari lagi</span>
      ) : (
        <span><span className="text-amber-400">{cd.hours}j {cd.minutes}m</span> lagi</span>
      )}
    </div>
  );
}

function EventCardSkeleton() {
  return (
    <div className="bg-white border-4 border-slate-900 shadow-[6px_6px_0_0_rgba(109,74,255,0.2),12px_12px_0_0_rgba(0,0,0,1)] flex flex-col relative overflow-hidden animate-pulse">
      <div className="h-64 bg-slate-200 border-b-4 border-slate-900 relative">
        <div className="absolute top-4 left-4 h-6 w-16 bg-slate-300 border-2 border-slate-400" />
        <div className="absolute top-4 right-4 h-10 w-10 bg-slate-300 border-4 border-slate-400" />
      </div>
      <div className="p-8 space-y-6 flex-grow flex flex-col text-left">
        <div className="space-y-2">
          <div className="h-5 bg-slate-300 w-3/4" />
          <div className="h-5 bg-slate-300 w-1/2" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-4 bg-slate-200 w-1/2" />
          <div className="h-4 bg-slate-200 w-2/3" />
        </div>
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 h-14 w-full" />
        <div className="pt-6 border-t-4 border-slate-200 flex flex-col gap-4 mt-auto">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="h-3 bg-slate-200 w-8" />
              <div className="h-6 bg-slate-300 w-24" />
            </div>
            <div className="h-4 bg-slate-200 w-12" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="h-10 bg-slate-200 border-2 border-slate-300" />
            <div className="h-10 bg-slate-200 border-2 border-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ANIMATION VARIANTS ──────────────────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

// ─── TILT EVENT CARD COMPONENT ────────────────────────────────────────────────
function TiltEventCard({
  event,
  idx,
  today,
  likedEvents,
  toggleLike,
  openDetailModal,
  formatRupiah,
  handleShareEvent,
  handleOpenQuickPurchase
}: {
  event: Event;
  idx: number;
  today: string;
  likedEvents: Set<string>;
  toggleLike: (id: string) => void;
  openDetailModal: (event: Event) => void;
  formatRupiah: (val: number) => string;
  handleShareEvent: (event: Event) => void;
  handleOpenQuickPurchase: (event: Event) => void;
}) {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, shadowX: 0, shadowY: 0, hovered: false });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const dx = x - xc;
    const dy = y - yc;
    const rotateX = -(dy / yc) * 8;
    const rotateY = (dx / xc) * 8;
    setTilt({
      rotateX,
      rotateY,
      shadowX: -rotateY * 1.5,
      shadowY: rotateX * 1.5,
      hovered: true
    });
  };
  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, shadowX: 0, shadowY: 0, hovered: false });
  };
  const isLiked = likedEvents.has(event.id);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: (idx % 3) * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${tilt.hovered ? 1.02 : 1}, ${tilt.hovered ? 1.02 : 1}, 1)`,
        boxShadow: tilt.hovered
          ? `0 20px 40px -15px rgba(109, 74, 255, 0.4), ${8 + tilt.shadowX}px ${8 + tilt.shadowY}px 0px 0px var(--primary-color), ${16 + tilt.shadowX * 1.2}px ${16 + tilt.shadowY * 1.2}px 0px 0px #000`
          : "6px 6px 0px 0px var(--primary-color), 12px 12px 0px 0px #000",
        transformStyle: "preserve-3d",
        transition: tilt.hovered ? "none" : "all 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
      }}
      className="bg-card text-card-foreground border-4 border-slate-900 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col group cursor-pointer relative"
      onClick={() => openDetailModal(event)}
    >
      <div className="relative h-64 border-b-4 border-slate-900 dark:border-zinc-800 overflow-hidden bg-black">
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-full object-contain opacity-90 group-hover:scale-105 transition-all duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        {(() => {
          const isEventEnded = event.end_date ? event.end_date < today : event.date < today;
          if (isEventEnded) {
            return (
              <div className="absolute inset-0 bg-black/75 flex items-center justify-center backdrop-blur-[3px] z-20">
                <div className="bg-slate-950 text-amber-400 border-4 border-amber-400 px-6 py-2.5 font-black text-2xl italic uppercase -skew-x-12 shadow-[4px_4px_0_0_#FBBF24] tracking-wider animate-pulse">
                  STAGE SELESAI
                </div>
              </div>
            );
          }
          if (event.totalRemainingStock === 0) {
            return (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[3px] z-20">
                <div className="bg-slate-950 text-red-500 border-4 border-red-500 px-6 py-2.5 font-black text-2xl italic uppercase -skew-x-12 shadow-[4px_4px_0_0_#EF4444] tracking-wider animate-pulse">
                  SOLD OUT
                </div>
              </div>
            );
          }
          return null;
        })()}
        <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 items-start">
          <CategoryBadge category={event.category} />
          {event.hasVoucher && (
            <span className="bg-[#FF6B6B] text-white border-2 border-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] animate-pulse flex items-center gap-1">
              <Zap size={10} fill="white" strokeWidth={3} /> PROMO VOUCHER
            </span>
          )}
        </div>
        {event.totalRemainingStock > 0 && event.totalRemainingStock <= 20 && (
          <div className="absolute top-4 left-32 z-30 bg-red-500 text-white border-2 border-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] animate-pulse">
            🔥 Sisa {event.totalRemainingStock} Tiket!
          </div>
        )}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(event.id);
          }}
          whileHover={{ scale: 1.15, rotate: -5 }}
          whileTap={{ scale: 0.85, rotate: 5 }}
          className={`absolute top-4 right-4 z-30 p-2.5 rounded-xl border-3 border-slate-900 shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all ${isLiked ? "bg-red-500 text-white" : "bg-white hover:bg-red-500 hover:text-white text-slate-900"
            }`}
        >
          <motion.div
            animate={{ scale: isLiked ? [1, 1.4, 0.9, 1] : 1 }}
            transition={{ duration: 0.4 }}
          >
            <HeartIcon size={16} strokeWidth={3} fill={isLiked ? "white" : "none"} />
          </motion.div>
        </motion.button>
      </div>
      <div className="p-6 sm:p-8 space-y-6 flex-grow flex flex-col text-left bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          {event.totalReviews && event.totalReviews > 0 ? (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 border-2 border-slate-900 px-2.5 py-1 text-[9px] font-black uppercase shadow-[2px_2px_0_0_#000] italic">
              <Star size={10} fill="black" strokeWidth={3} className="animate-pulse" />
              <span>{Number(event.avgRating || 0).toFixed(1)} ({event.totalReviews} Ulasan)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-card border-2 border-slate-900 dark:border-zinc-800 px-2.5 py-1 text-[9px] font-black uppercase text-slate-500 dark:text-zinc-400 shadow-[2px_2px_0_0_#000] italic">
              <Star size={10} strokeWidth={3} />
              <span>Belum Ada Ulasan</span>
            </div>
          )}
        </div>
        <div className="min-h-[3rem] flex items-center">
          <h3 className="text-lg lg:text-xl font-black italic uppercase -skew-x-6 tracking-tight leading-snug break-words group-hover:text-[var(--primary-color)] transition-colors duration-300 line-clamp-2">
            {event.title}
          </h3>
        </div>
        <div className="space-y-2.5 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-red-500 shrink-0" /> {event.date}
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-[var(--primary-color)] shrink-0" /> {event.location}
          </div>
          {event.description && (
            <div className="mt-3 p-3 bg-gradient-to-r from-slate-50 to-amber-50/20 dark:from-zinc-950 dark:to-zinc-900 border-l-4 border-amber-400 rounded-r-lg">
              <p className="text-xs font-semibold normal-case tracking-normal text-slate-600 dark:text-zinc-400 italic line-clamp-2">
                "{event.description.replace(/--seating-enabled:\d+x\d+--/g, "").trim()}"
              </p>
            </div>
          )}
        </div>
        <div className="pt-6 border-t-4 border-slate-900 dark:border-zinc-800 flex flex-col gap-4 mt-auto">
          {(() => {
            const isEventEnded = event.end_date ? event.end_date < today : event.date < today;
            return !isEventEnded && event.totalRemainingStock > 0 ? (
              <EventCountdown dateStr={event.date} />
            ) : null;
          })()}
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-[8px] font-black text-slate-400 mb-0.5 uppercase italic">Start From</p>
              <p className="text-2xl font-black text-[var(--primary-color)] italic tracking-tighter leading-none">{formatRupiah(event.price)}</p>
            </div>
            {event.totalRemainingStock > 0 ? (
              <span className="bg-emerald-400 text-slate-900 border-2 border-slate-900 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000]">
                Tersedia
              </span>
            ) : (
              <span className="bg-red-500 text-white border-2 border-slate-900 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000]">
                Sold Out
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDetailModal(event);
              }}
              className="w-full py-3 bg-white dark:bg-zinc-800 hover:bg-amber-400 hover:text-slate-900 text-slate-900 dark:text-white border-4 border-slate-900 dark:border-zinc-700 font-black italic uppercase text-[10px] tracking-wider shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all text-center rounded-xl"
            >
              DETAIL INFO
            </button>
            {(() => {
              const isEventEnded = event.end_date ? event.end_date < today : event.date < today;
              return (
                <button
                  disabled={event.totalRemainingStock === 0 || isEventEnded}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenQuickPurchase(event);
                  }}
                  className={`w-full py-3 border-4 border-slate-900 dark:border-zinc-750 font-black italic uppercase text-[10px] tracking-wider shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all text-center rounded-xl ${(event.totalRemainingStock === 0 || isEventEnded)
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none border-slate-300 dark:border-zinc-850 dark:bg-zinc-850'
                      : 'bg-[var(--primary-color)] text-white hover:bg-slate-900 dark:hover:bg-white dark:hover:text-black'
                    }`}
                >
                  {isEventEnded ? "SELESAI" : "BELI TIKET"}
                </button>
              );
            })()}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShareEvent(event);
            }}
            className="group/share relative w-full py-2.5 bg-emerald-50 text-emerald-850 dark:bg-emerald-950/20 dark:text-emerald-400 border-2 border-emerald-400 dark:border-emerald-500/30 font-black italic uppercase text-[10px] tracking-wider shadow-[3px_3px_0_0_rgba(16,185,129,0.3)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all overflow-hidden flex items-center justify-center rounded-xl"
          >
            <div className="absolute inset-0 w-full h-full bg-emerald-500 translate-y-full group-hover/share:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10 flex items-center justify-center gap-2 group-hover/share:text-white transition-colors duration-300 font-black">
              <Share2 size={12} strokeWidth={3} /> SHARE KE WHATSAPP
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const today = getLocalDateString();
  const { toast } = useToast();

  const [heroTilt, setHeroTilt] = useState({ rotateX: 0, rotateY: 0, shadowX: 0, shadowY: 0, hovered: false });
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const dx = x - xc;
    const dy = y - yc;
    const rotateX = -(dy / yc) * 6;
    const rotateY = (dx / xc) * 6;
    setHeroTilt({
      rotateX,
      rotateY,
      shadowX: -rotateY * 2,
      shadowY: rotateX * 2,
      hovered: true
    });
  };
  const handleHeroMouseLeave = () => {
    setHeroTilt({ rotateX: 0, rotateY: 0, shadowX: 0, shadowY: 0, hovered: false });
  };

  const handleShareEvent = useCallback((event: Event) => {
    const text = `🎫 *${event.title}*\n📅 ${event.date}\n📍 ${event.location}\n\nBeli tiketnya di Tiketin sekarang! 🔥\n${window.location.origin}/explore`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
    toast(`Event "${event.title}" siap di-share!`, "success", 2000);
  }, [toast]);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [heroEvents, setHeroEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [likedEvents, setLikedEvents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [visibleCount, setVisibleCount] = useState(6);

  const [selectedEventDetails, setSelectedEventDetails] = useState<Event | null>(null);
  const [eventTiers, setEventTiers] = useState<any[]>([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState(false);

  const [eventReviews, setEventReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const [totalFans, setTotalFans] = useState(0);
  const [marqueeItems, setMarqueeItems] = useState<string[]>([]);

  const [quickPurchaseEvent, setQuickPurchaseEvent] = useState<Event | null>(null);
  const [drawerTiers, setDrawerTiers] = useState<any[]>([]);
  const [isLoadingDrawerTiers, setIsLoadingDrawerTiers] = useState(false);
  const [selectedDrawerTierId, setSelectedDrawerTierId] = useState<string | null>(null);
  const [drawerQty, setDrawerQty] = useState(1);
  const [activeTicketsCount, setActiveTicketsCount] = useState(0);
  const [userTicketEventIds, setUserTicketEventIds] = useState<Set<string>>(new Set());

  // ─── PERSONALIZED RECOMMENDATIONS ───
  const personalizedRecommendations = (() => {
    if (!events.length) return [];
    const preferredCategories = new Set<string>();
    events.forEach(e => {
      if (likedEvents.has(e.id) || userTicketEventIds.has(e.id)) {
        preferredCategories.add(e.category.toUpperCase());
      }
    });

    if (preferredCategories.size === 0) {
      return [...events]
        .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
        .slice(0, 3);
    }

    const recs = events.filter(e => 
      preferredCategories.has(e.category.toUpperCase()) && 
      !userTicketEventIds.has(e.id)
    );

    if (recs.length > 0) {
      return recs.slice(0, 3);
    }
    return events.filter(e => !userTicketEventIds.has(e.id)).slice(0, 3);
  })();

  const [chatOpen, setChatOpen] = useState(false);
  const [chatEventId, setChatEventId] = useState("");
  const [chatEventTitle, setChatEventTitle] = useState("");

  const handleOpenEventChat = (eventId: string, eventTitle: string) => {
    setChatEventId(eventId);
    setChatEventTitle(eventTitle);
    setChatOpen(true);
  };

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMoveGlobal = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleOpenQuickPurchase = async (event: Event) => {
    if (userProfile?.verification_status !== "approved") {
      toast("⚠️ Kamu harus lolos verifikasi KTP dulu sebelum bisa membeli tiket!", "warning");
      router.push("/verify");
      return;
    }

    setQuickPurchaseEvent(event);
    setDrawerQty(1);
    setIsLoadingDrawerTiers(true);
    setDrawerTiers([]);
    setSelectedDrawerTierId(null);

    try {
      const { data, error } = await supabase
        .from("ticket_categories")
        .select("*")
        .eq("event_id", event.id)
        .order("price", { ascending: true });
      if (!error && data) {
        setDrawerTiers(data);
        const availableTier = data.find((c: any) => c.stock > 0) || data[0];
        if (availableTier) {
          setSelectedDrawerTierId(availableTier.id);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil ticket categories:", err);
    } finally {
      setIsLoadingDrawerTiers(false);
    }
  };

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(styleTag);
    setMounted(true);
    fetchData();
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.head.removeChild(styleTag);
    };
  }, [router]);

  useEffect(() => {
    if (mounted && heroEvents.length > 1) {
      const timer = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroEvents.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [mounted, heroEvents]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", session.user.id).single();
    if (profile) {
      setUserProfile(profile as UserProfile);
      const todayStr = new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0") + "-" + String(new Date().getDate()).padStart(2, "0");
      const lastSpin = localStorage.getItem(`last_spin_date_${profile.id}`);
      setHasSpunToday(lastSpin === todayStr);
    }

    const { count: fansCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer");
    if (fansCount !== null) {
      setTotalFans(fansCount);
    }

    const { data: wishlist } = await supabase.from("wishlist").select("event_id").eq("user_id", session.user.id);
    if (wishlist) {
      setLikedEvents(new Set(wishlist.map(w => w.event_id)));
    }

    try {
      const { data: userBoughtTickets } = await supabase
        .from("tiket")
        .select("event_id, status_checkin, transaksi!inner(user_id, status_pembayaran)")
        .eq("transaksi.user_id", session.user.id)
        .eq("transaksi.status_pembayaran", "paid");
      if (userBoughtTickets) {
        const activeCount = userBoughtTickets.filter((t: any) => t.status_checkin === false).length;
        setActiveTicketsCount(activeCount);
        setUserTicketEventIds(new Set(userBoughtTickets.map((t: any) => t.event_id)));
      }
    } catch (err) {
      console.warn("Gagal mengambil daftar tiket user:", err);
    }

    const { data: eventData } = await supabase
      .from("events")
      .select("*, ticket_categories(stock), reviews(rating), vouchers(*), profiles:organizer_id(full_name, eo_name, verification_status)")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (eventData) {
      const formattedEvents = eventData.map((ev: any) => {
        const totalRemainingStock = ev.ticket_categories?.reduce((acc: number, cat: any) => acc + (cat.stock || 0), 0) || 0;
        const reviewList = ev.reviews || [];
        const avgRating = reviewList.length > 0
          ? reviewList.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewList.length
          : 0;
        const totalReviews = reviewList.length;

        const activeVouchers = ev.vouchers?.filter((v: any) => {
          const isValidTo = !v.valid_to || new Date(v.valid_to) > new Date();
          const hasRemainingUses = v.max_uses === null || (v.uses_count || 0) < v.max_uses;
          return isValidTo && hasRemainingUses;
        }) || [];
        const hasVoucher = activeVouchers.length > 0;
        return {
          ...ev,
          totalRemainingStock,
          avgRating,
          totalReviews,
          hasVoucher
        };
      });
      setEvents(formattedEvents);
      setHeroEvents(formattedEvents.slice(0, 3));
    }

    try {
      const { data: setting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "marquee_ticker")
        .single();
      if (setting && Array.isArray(setting.value)) {
        setMarqueeItems(setting.value as string[]);
      }
    } catch (err) {
      console.warn("Gagal mengambil settings marquee:", err);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const toggleLike = async (eventId: string) => {
    if (!userProfile) return;
    const isLiked = likedEvents.has(eventId);
    setLikedEvents((prev) => {
      const next = new Set(prev);
      isLiked ? next.delete(eventId) : next.add(eventId);
      return next;
    });
    try {
      if (isLiked) {
        const { error } = await supabase.from("wishlist").delete().eq("user_id", userProfile.id).eq("event_id", eventId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("wishlist").insert({ user_id: userProfile.id, event_id: eventId });
        if (error) throw error;
      }
    } catch (error) {
      console.error("Wishlist Update Error:", error);
      setLikedEvents((prev) => {
        const next = new Set(prev);
        isLiked ? next.add(eventId) : next.delete(eventId);
        return next;
      });
      toast("Koneksi gagal, wishlist tidak tersimpan.", "error");
    }
  };



  const openDetailModal = async (event: Event) => {
    setSelectedEventDetails(event);
    setIsLoadingTiers(true);
    setEventTiers([]);
    setIsLoadingReviews(true);
    setEventReviews([]);
    try {
      const { data, error } = await supabase
        .from("ticket_categories")
        .select("*")
        .eq("event_id", event.id)
        .order("price", { ascending: true });
      if (!error && data) {
        setEventTiers(data);
      }
    } catch (err) {
      console.error("Gagal mengambil tier tiket:", err);
    } finally {
      setIsLoadingTiers(false);
    }
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          reply_comment,
          replied_at,
          profiles (
            full_name
          )
        `)
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setEventReviews(data);
      }
    } catch (err) {
      console.error("Gagal mengambil ulasan:", err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  let processedEvents = events.filter((event) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      event.title?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query)
    );
    const matchesCategory =
      selectedCategory === "ALL" ||
      (selectedCategory === "FAVORIT"
        ? likedEvents.has(event.id)
        : event.category?.toUpperCase() === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (sortBy === "PRICE_ASC") processedEvents.sort((a, b) => a.price - b.price);
  else if (sortBy === "PRICE_DESC") processedEvents.sort((a, b) => b.price - a.price);
  else if (sortBy === "TRENDING") processedEvents.sort((a, b) => a.totalRemainingStock - b.totalRemainingStock);

  const visibleEvents = processedEvents.slice(0, visibleCount);

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  if (!mounted) return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-[#FCFAF1] dark:bg-zinc-950 brutal-grid noise gap-4 ${poppins_font.className}`}>
      <motion.div
        animate={{ rotate: [0, -12, 12, -12, 0], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="h-24 w-24 bg-[#6D4AFF] border-4 border-slate-900 dark:border-zinc-700 flex items-center justify-center shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_var(--primary-color)]"
      >
        <TicketIcon className="text-amber-400" size={48} strokeWidth={3} />
      </motion.div>
      <p className="font-black italic text-3xl text-slate-900 dark:text-zinc-50 uppercase -skew-x-6 tracking-tighter mt-4 bg-white dark:bg-zinc-900 px-4 border-4 border-black dark:border-zinc-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)]">
        LOADING ARENA<motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }}>...</motion.span>
      </p>
    </div>
  );

  return (
    <div
      onMouseMove={handleMouseMoveGlobal}
      className={`min-h-screen bg-[#FCFAF1] dark:bg-zinc-950 brutal-grid noise text-slate-900 dark:text-zinc-50 ${poppins_font.className} selection:bg-amber-400 selection:text-black relative overflow-hidden`}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 opacity-60 dark:opacity-40"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(109, 74, 255, 0.08), transparent 80%)`,
        }}
      />
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <nav className="w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b-2 border-slate-900/10 dark:border-zinc-800 sticky top-0 z-[50] shadow-[0_8px_32px_0_rgba(109,74,255,0.05)] h-20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/explore" className="flex items-center gap-2 group text-slate-900 dark:text-zinc-50">
              <div className="h-10 w-10 bg-[#6D4AFF] border-4 border-slate-900 dark:border-zinc-700 -rotate-12 flex items-center justify-center group-hover:rotate-0 transition-transform shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <TicketIcon className="text-amber-400" size={24} strokeWidth={3} />
              </div>
              <span className="text-2xl font-black italic -skew-x-12 tracking-tighter uppercase hidden md:block">TIKETIN</span>
            </Link>
            <Link 
              href="/explore/articles" 
              className="bg-[#6D4AFF] text-white border-2 border-black px-4 py-1.5 shadow-[2px_2px_0_0_#000] text-xs font-black uppercase italic -skew-x-6 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#000] transition-all ml-2"
            >
              📚 ARTIKEL
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell userId={userProfile?.id} />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group p-1 pr-3 rounded-2xl transition-all border-2 border-transparent hover:border-slate-900 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900">
                  <div className="text-right hidden md:block">
                    <p className="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">
                      {userProfile?.verification_status === "approved" ? (
                        <span className="text-emerald-500">✓ VERIFIED</span>
                      ) : userProfile?.verification_status === "pending" ? (
                        <span className="text-amber-500">⏳ PENDING KYC</span>
                      ) : (
                        <span className="text-red-500">✗ UNVERIFIED</span>
                      )}
                    </p>
                    <p className="text-xs font-black italic -skew-x-6 uppercase text-slate-900 dark:text-zinc-50">{userProfile?.full_name?.split(" ")[0]}</p>
                  </div>
                  <Avatar className="h-10 w-10 border-4 border-slate-900 rounded-none -rotate-6 shadow-[3px_3px_0_0_rgba(0,0,0,1)] group-hover:rotate-0 transition-transform">
                    <AvatarImage src={userProfile?.avatar_url} />
                    <AvatarFallback className="bg-[#6D4AFF] text-white font-black">{userProfile?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 border-4 border-slate-900 dark:border-zinc-700 rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_var(--primary-color)] p-2 bg-white dark:bg-zinc-900 z-[60]">
                <DropdownMenuLabel className="font-black italic uppercase text-[10px] text-slate-400">Quick Access</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-900 dark:bg-zinc-750 h-0.5" />
                <DropdownMenuItem onClick={() => router.push("/explore/profile")} className="focus:bg-rose-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <User className="mr-2 h-4 w-4" /> Profil Saya
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push("/verify")} className="focus:bg-amber-400 font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <ShieldCheck className="mr-2 h-4 w-4" /> {userProfile?.verification_status === "approved" ? "Status KTP (Lolos)" : "Verifikasi KTP"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/tickets")} className="focus:bg-blue-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <TicketIcon className="mr-2 h-4 w-4" /> Tiket Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/complaints")} className="focus:bg-emerald-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <MessageSquare className="mr-2 h-4 w-4" /> Pengaduan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/rewards")} className="focus:bg-purple-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <Trophy className="mr-2 h-4 w-4" /> Tukar Poin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/articles")} className="focus:bg-[#6D4AFF] focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <BookOpen className="mr-2 h-4 w-4" /> Baca & Tulis Artikel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/history")} className="focus:bg-slate-900 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <Receipt className="mr-2 h-4 w-4" /> Riwayat Pembayaran
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-900 dark:bg-zinc-750 h-0.5" />
                <DropdownMenuItem
                  className="focus:bg-red-500 focus:text-white font-black italic uppercase text-xs py-3 text-red-500 dark:text-red-400 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
      <MarqueeTicker items={marqueeItems} />

      <AnimatePresence>
        {userProfile && userProfile.verification_status !== "approved" && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className="w-full max-w-7xl mx-auto px-6 sm:px-12 mt-6 relative z-30"
          >
            {userProfile.verification_status === "pending" ? (
              <div className="bg-amber-400 border-4 border-slate-900 p-5 md:p-6 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-left w-full">
                  <div className="h-12 w-12 bg-white border-4 border-slate-900 flex items-center justify-center shrink-0 -rotate-3 shadow-[3px_3px_0_0_#000]">
                    <span className="text-2xl animate-pulse">⏳</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black uppercase italic text-slate-900 leading-tight">
                      KYC SEDANG DIPROSES
                    </h3>
                    <p className="font-bold text-xs text-slate-700 uppercase tracking-wider mt-0.5">
                      Dokumen KTP kamu sedang diverifikasi oleh admin. Harap tunggu proses verifikasi selesai!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-500 border-4 border-slate-900 p-5 md:p-6 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-left w-full">
                  <div className="h-12 w-12 bg-white border-4 border-slate-900 flex items-center justify-center shrink-0 rotate-3 shadow-[3px_3px_0_0_#000]">
                    <span className="text-2xl animate-bounce">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black uppercase italic text-white leading-tight">
                      BELUM VERIFIKASI KTP!
                    </h3>
                    <p className="font-bold text-xs text-red-100 uppercase tracking-wider mt-0.5">
                      Verifikasi sekarang agar kamu bisa memesan tiket event terpopuler secara aman!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/verify")}
                  className="w-full md:w-auto bg-amber-400 hover:bg-white text-slate-900 border-4 border-slate-900 px-6 py-3 font-black italic uppercase text-sm shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all shrink-0 text-center"
                >
                  VERIFIKASI SEKARANG!
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 sm:px-12 pt-10 pb-24 relative z-10">
        {/* DUAL-PANE HERO SECTION */}
        {!searchQuery ? (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-20 items-center">
            <div className="lg:col-span-7 space-y-8 text-left">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-3"
              >
                <div className="inline-flex items-center gap-2 bg-purple-500/10 dark:bg-purple-500/20 text-[#6D4AFF] px-3.5 py-1.5 rounded-full border border-purple-500/20 font-black uppercase text-[10px] tracking-widest italic">
                  <Sparkles size={12} className="animate-pulse" /> EXPLORE SHOWS
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black -skew-x-12 italic uppercase leading-[0.9] tracking-tighter drop-shadow-[3px_3px_0_var(--primary-color)]">
                  HALO,{" "}
                  <span className="relative inline-block text-slate-900 dark:text-white">
                    <span className="relative z-10">{userProfile?.full_name?.split(" ")[0].toUpperCase()}!</span>
                    <span className="absolute bottom-0 left-0 right-0 h-4 bg-amber-400 -z-0 -skew-x-6 opacity-80 border-b-2 border-black" />
                  </span>
                </h1>
                <p className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest italic">
                  MAU PESAN TIKET APA HARI INI? JANGAN SAMPAI KETINGGALAN EVENT!
                </p>
              </motion.div>

              <motion.div
                className="relative w-full max-w-2xl group"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-zinc-500 z-10" strokeWidth={3} />
                <input
                  placeholder="CARI KONSER ATAU STAGE..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(6);
                  }}
                  className="h-16 w-full pl-12 pr-12 border-4 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 font-black text-sm md:text-base uppercase outline-none -skew-x-2 focus:bg-amber-50/50 dark:focus:bg-zinc-800 transition-all rounded-2xl shadow-[4px_4px_0_0_var(--primary-color),8px_8px_0_0_#000] focus:shadow-[0_0_30px_-5px_rgba(109,74,255,0.4)]"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setVisibleCount(6);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 border-2 border-transparent hover:border-slate-900 dark:hover:border-zinc-700 rounded-none transition-all z-10"
                  >
                    <X className="h-5 w-5 text-slate-900 dark:text-zinc-100" strokeWidth={3} />
                  </button>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-2.5 items-center"
              >
                <span className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500 italic mr-1 tracking-wider">Trending:</span>
                {["Padi Reborn", "Konser Jakarta", "Teater Koma", "K-Pop Festival"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      setVisibleCount(6);
                    }}
                    className="px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest bg-white dark:bg-zinc-900 hover:bg-amber-400 dark:hover:bg-amber-400 hover:text-black dark:hover:text-black text-slate-700 dark:text-zinc-300 border-2 border-slate-900 dark:border-zinc-700 shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all rounded-xl"
                  >
                    #{tag}
                  </button>
                ))}
              </motion.div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                {[
                  { icon: <Music size={20} strokeWidth={3} className="text-[#6D4AFF]" />, label: "TOTAL EVENT", value: events.length || 500, suffix: "+" },
                  { icon: <Users size={20} strokeWidth={3} className="text-emerald-500" />, label: "HAPPY FANS", value: totalFans, suffix: "+" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="p-5 bg-white dark:bg-zinc-900 border-3 border-slate-900 dark:border-zinc-800 shadow-[4px_4px_0_0_var(--primary-color)] dark:shadow-[4px_4px_0_0_rgba(109,74,255,0.4)] rounded-2xl relative overflow-hidden flex items-center gap-4 hover:translate-y-[-2px] transition-transform duration-300"
                  >
                    <DotGrid className="opacity-15" />
                    <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 shrink-0">
                      {stat.icon}
                    </div>
                    <div className="relative z-10">
                      <p className="text-2xl md:text-3xl font-black italic tracking-tighter text-slate-900 dark:text-zinc-100 leading-none">
                        <AnimatedNumber target={stat.value} />{stat.suffix}
                      </p>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1.5">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Hero Carousel Recommended Showcase */}
            <div className="lg:col-span-5 relative w-full h-[400px] md:h-[450px]">
              {isLoading ? (
                <div className="w-full h-full border-8 border-slate-900 dark:border-zinc-800 rounded-3xl overflow-hidden bg-slate-900 animate-pulse flex flex-col justify-end p-8 gap-4 shadow-[8px_8px_0_0_#6D4AFF,16px_16px_0_0_#000]">
                  <div className="h-6 w-24 bg-slate-770 rounded" />
                  <div className="h-12 w-3/4 bg-slate-700 rounded" />
                  <div className="h-10 w-32 bg-slate-700 rounded" />
                </div>
              ) : (
                <motion.div
                  onMouseMove={handleHeroMouseMove}
                  onMouseLeave={handleHeroMouseLeave}
                  style={{
                    transform: `perspective(1000px) rotateX(${heroTilt.rotateX}deg) rotateY(${heroTilt.rotateY}deg) scale3d(${heroTilt.hovered ? 1.015 : 1}, ${heroTilt.hovered ? 1.015 : 1}, 1)`,
                    boxShadow: heroTilt.hovered
                      ? `0 25px 50px -12px rgba(109, 74, 255, 0.35), ${8 + heroTilt.shadowX}px ${8 + heroTilt.shadowY}px 0px 0px #6D4AFF, ${16 + heroTilt.shadowX * 1.2}px ${16 + heroTilt.shadowY * 1.2}px 0px 0px #000`
                      : "8px 8px 0px 0px #6D4AFF, 16px 16px 0px 0px #000",
                    transformStyle: "preserve-3d",
                    transition: heroTilt.hovered ? "none" : "all 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
                  }}
                  className="relative w-full h-full border-6 border-slate-900 dark:border-zinc-800 rounded-3xl overflow-hidden bg-slate-900"
                >
                  <AnimatePresence mode="wait">
                    {heroEvents.length > 0 && (
                      <motion.img
                        key={currentHeroIndex}
                        src={heroEvents[currentHeroIndex]?.image_url}
                        alt={heroEvents[currentHeroIndex]?.title}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 0.4, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                      />
                    )}
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentHeroIndex}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.08
                          }
                        },
                        exit: {
                          opacity: 0,
                          transition: {
                            staggerChildren: 0.05,
                            staggerDirection: -1
                          }
                        }
                      }}
                      className="absolute inset-0 p-8 flex flex-col justify-end items-start text-left z-20"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* RECOMMENDED EVENT BADGE */}
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 15 },
                          visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
                          exit: { opacity: 0, y: -10 }
                        }}
                        style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        className="bg-amber-400 border-3 border-slate-900 px-3.5 py-1.5 font-black uppercase text-[9px] shadow-[3px_3px_0_0_rgba(0,0,0,1)] -rotate-2 mb-4 italic inline-flex items-center gap-2 cursor-default select-none rounded-lg"
                      >
                        <Sparkles size={12} className="animate-spin-slow text-slate-900" /> RECOMMENDED EVENT
                      </motion.div>

                      {/* TITLE */}
                      <motion.h2
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
                          exit: { opacity: 0, y: -15 }
                        }}
                        style={{ transform: "translateZ(50px)" }}
                        className="text-2xl sm:text-3xl md:text-4xl font-black italic uppercase text-white tracking-tighter drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)] -skew-x-6 mb-3 break-words leading-none"
                      >
                        {heroEvents[currentHeroIndex]?.title || "LIVE NOW"}
                      </motion.h2>

                      {/* STOCK WARNING */}
                      {heroEvents[currentHeroIndex]?.totalRemainingStock > 0 && heroEvents[currentHeroIndex]?.totalRemainingStock <= 20 && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, scale: 0.9 },
                            visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } },
                            exit: { opacity: 0, scale: 0.9 }
                          }}
                          style={{ transform: "translateZ(40px)" }}
                          className="mb-3 bg-red-500 text-white border-2 border-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] animate-pulse inline-flex items-center gap-1.5 rounded-lg"
                        >
                          🔥 Sisa {heroEvents[currentHeroIndex].totalRemainingStock} Tiket! Segera Pesan!
                        </motion.div>
                      )}

                      {/* PRICE */}
                      {heroEvents[currentHeroIndex]?.price && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, x: -15 },
                            visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } },
                            exit: { opacity: 0, x: -10 }
                          }}
                          style={{ transform: "translateZ(45px)" }}
                          className="mb-5 flex items-center gap-3"
                        >
                          <span className="text-slate-300 font-black uppercase text-[8px] tracking-wider">Mulai</span>
                          <span className="bg-[#6D4AFF] border-2 border-white px-3.5 py-1.5 font-black text-white text-sm italic -skew-x-6 shadow-[3px_3px_0_0_rgba(0,0,0,0.4)] rounded-lg">
                            {formatRupiah(heroEvents[currentHeroIndex].price)}
                          </span>
                        </motion.div>
                      )}

                      {/* BUTTON */}
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 15 },
                          visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
                          exit: { opacity: 0, y: -10 }
                        }}
                        style={{ transform: "translateZ(60px)" }}
                      >
                        {(() => {
                          const activeHero = heroEvents[currentHeroIndex];
                          const isHeroEnded = activeHero ? (activeHero.end_date ? activeHero.end_date < today : activeHero.date < today) : false;
                          return (
                            <button
                              disabled={heroEvents[currentHeroIndex]?.totalRemainingStock === 0 || isHeroEnded}
                              onClick={() => {
                                const activeHero = heroEvents[currentHeroIndex];
                                if (activeHero) handleOpenQuickPurchase(activeHero);
                              }}
                              className={`border-4 border-slate-900 dark:border-white px-6 md:px-8 py-3.5 md:py-4 font-black uppercase text-xs shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all -skew-x-6 rounded-xl ${(heroEvents[currentHeroIndex]?.totalRemainingStock === 0 || isHeroEnded)
                                  ? 'bg-slate-500 text-slate-300 cursor-not-allowed shadow-none border-slate-500'
                                  : 'bg-white text-black hover:bg-amber-400'
                                }`}
                            >
                              {isHeroEnded ? "EVENT SELESAI" : heroEvents[currentHeroIndex]?.totalRemainingStock === 0 ? "SOLD OUT" : "BELI TIKET NOW"}
                            </button>
                          );
                        })()}
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="absolute bottom-6 right-6 z-30 flex gap-2">
                    {heroEvents.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentHeroIndex(i)}
                        className={`transition-all rounded-full border border-white ${i === currentHeroIndex ? "w-6 h-2 bg-amber-400" : "w-2 h-2 bg-white/50 hover:bg-white"}`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </section>
        ) : (
          <header className="mb-12 space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase -skew-x-6">
                HASIL PENCARIAN
              </h1>
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-550 uppercase tracking-widest mt-1">
                Menampilkan hasil pencarian untuk "{searchQuery}"
              </p>
            </motion.div>
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" strokeWidth={3} />
              <input
                placeholder="CARI KONSER..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(6);
                }}
                className="h-16 w-full pl-12 pr-12 border-4 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 font-black text-sm uppercase outline-none -skew-x-2 rounded-xl shadow-[4px_4px_0_0_var(--primary-color)]"
              />
              <button
                onClick={() => {
                  setSearchQuery("");
                  setVisibleCount(6);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 border-2 border-transparent hover:border-slate-900 dark:hover:border-zinc-700 rounded-none transition-all z-10"
              >
                <X className="h-5 w-5 text-slate-900 dark:text-zinc-100" strokeWidth={3} />
              </button>
            </div>
          </header>
        )}

        {/* LUCKY SPIN HARIAN PROMO BANNER */}
        {!searchQuery && userProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full max-w-7xl mx-auto mb-16 bg-gradient-to-r from-[#FF3B30] via-rose-600 to-[#D11A2A] border-4 border-slate-900 dark:border-zinc-700 p-8 md:p-10 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color)] flex flex-col lg:flex-row items-center justify-between gap-6 -rotate-1 relative overflow-hidden rounded-3xl group/spin hover:rotate-0 transition-transform duration-300"
          >
            <div className="absolute right-[-80px] top-[-80px] w-64 h-64 border-[16px] border-white/10 rounded-full animate-spin-slow pointer-events-none group-hover/spin:scale-110 transition-transform duration-700" />
            <div className="absolute left-[-40px] bottom-[-40px] w-48 h-48 border-[8px] border-white/5 rounded-full animate-spin pointer-events-none" style={{ animationDuration: '6s' }} />
            <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full text-center md:text-left">
              <div className="h-20 w-20 bg-white border-4 border-slate-900 flex items-center justify-center shrink-0 -rotate-12 shadow-[4px_4px_0_0_#000] animate-bounce rounded-2xl group-hover/spin:rotate-12 transition-transform duration-300">
                <span className="text-4xl">🎡</span>
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-slate-900 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded shadow-[1.5px_1.5px_0_0_#000]">
                  🔥 GRATIS SETIAP HARI
                </div>
                <h3 className="text-3xl md:text-4xl font-black italic -skew-x-6 uppercase text-white drop-shadow-[3px_3px_0px_#000] leading-none tracking-tight">
                  LUCKY SPIN HARIAN!
                </h3>
                <p className="font-bold text-xs md:text-sm text-rose-100 uppercase tracking-wide max-w-xl">
                  Putar roda keberuntungan Anda gratis! Berkesempatan mendapatkan Poin Reward, Tiket Acara, atau Voucher gratis setiap hari!
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (userProfile?.verification_status !== "approved") {
                  toast("⚠️ Kamu harus lolos verifikasi KTP terlebih dahulu untuk bermain Lucky Spin!", "warning");
                  router.push("/verify");
                  return;
                }
                router.push("/explore/rewards/spin");
              }}
              className="bg-amber-400 hover:bg-white text-slate-900 border-4 border-slate-900 px-8 py-5 font-black italic uppercase text-xs sm:text-sm shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all shrink-0 z-10 w-full lg:w-auto text-center cursor-pointer rounded-2xl"
            >
              COBA SPIN SEKARANG! ⚡
            </button>
          </motion.div>
        )}

        {/* DAILY QUIZ PROMO BANNER (SUDAH DI-FIX DARI DUPLIKASI) */}
        {!searchQuery && userProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full max-w-7xl mx-auto mb-16 bg-gradient-to-r from-[#6D4AFF] via-violet-600 to-[#5B37E5] border-4 border-slate-900 dark:border-zinc-700 p-8 md:p-10 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color)] flex flex-col lg:flex-row items-center justify-between gap-6 rotate-1 relative overflow-hidden rounded-3xl group/quiz hover:rotate-0 transition-transform duration-300"
          >
            <div className="absolute right-[-60px] bottom-[-60px] w-56 h-56 border-[12px] border-white/10 rounded-full animate-pulse pointer-events-none" />
            <div className="absolute left-[-50px] top-[-50px] w-64 h-64 border-[16px] border-white/5 rounded-full animate-spin pointer-events-none" style={{ animationDuration: '10s' }} />

            <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full text-center md:text-left">
              <div className="h-20 w-20 bg-white border-4 border-slate-900 flex items-center justify-center shrink-0 rotate-12 shadow-[4px_4px_0_0_#000] animate-bounce rounded-2xl group-hover/quiz:-rotate-12 transition-transform duration-300">
                <span className="text-4xl">🧠</span>
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-slate-900 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded shadow-[1.5px_1.5px_0_0_#000]">
                  🔥 KUIS HARIAN TIKETIN
                </div>
                <h3 className="text-3xl md:text-4xl font-black italic -skew-x-6 uppercase text-white drop-shadow-[3px_3px_0px_#000] leading-none tracking-tight">
                  KUIS TRIVIA HARIAN!
                </h3>
                <p className="font-bold text-xs md:text-sm text-purple-100 uppercase tracking-wide max-w-xl">
                  Jawab kuis harian seputar Musik, Teater, &amp; Bandung dalam 10 detik! Berkesempatan memenangkan Poin Reward atau Voucher gratis setiap hari!
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (userProfile?.verification_status !== "approved") {
                  toast("⚠️ Kamu harus lolos verifikasi KTP terlebih dahulu untuk bermain Kuis Harian!", "warning");
                  router.push("/verify");
                  return;
                }
                router.push("/explore/rewards/quiz");
              }}
              className="bg-amber-400 hover:bg-white text-slate-900 border-4 border-slate-900 px-8 py-5 font-black italic uppercase text-xs sm:text-sm shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all shrink-0 z-10 w-full lg:w-auto text-center cursor-pointer rounded-2xl"
            >
              MAIN KUIS SEKARANG! ⚡
            </button>
          </motion.div>
        )}

        {/* PILIHAN UNTUK KAMU / RECOMMENDATIONS */}
        {!searchQuery && personalizedRecommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full max-w-7xl mx-auto mb-20 text-left"
          >
            <div className="flex items-center gap-3 mb-8 bg-white dark:bg-zinc-900 border-4 border-black dark:border-zinc-700 p-4 shadow-[4px_4px_0_0_var(--primary-color,#6D4AFF)] -rotate-1 inline-flex">
              <Sparkles className="text-amber-500 animate-pulse" size={24} strokeWidth={3} />
              <h2 className="text-2xl md:text-3xl font-black italic uppercase -skew-x-6 tracking-tight dark:text-white">
                PILIHAN UNTUK KAMU
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {personalizedRecommendations.map((event, idx) => (
                <TiltEventCard
                  key={`rec-${event.id}`}
                  event={event}
                  idx={idx}
                  today={today}
                  likedEvents={likedEvents}
                  toggleLike={toggleLike}
                  openDetailModal={openDetailModal}
                  formatRupiah={formatRupiah}
                  handleShareEvent={handleShareEvent}
                  handleOpenQuickPurchase={handleOpenQuickPurchase}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex flex-col items-center justify-center space-y-10 mb-22 mt-10 pt-10">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="flex flex-col items-center gap-4 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 p-6 border-4 border-black dark:border-zinc-700 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color)] -rotate-1"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="text-red-500" size={40} strokeWidth={4} />
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter -skew-x-6 text-center">
                {searchQuery ? `SEARCHING...` : "NEARBY STAGES"}
              </h2>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="flex flex-row justify-center w-full max-w-5xl mx-auto pt-6 px-4 gap-4 sm:gap-6 md:gap-8"
          >
            {["ALL", "MUSIK", "TEATER", "FAVORIT"].map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <motion.button
                  variants={fadeInUp}
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setVisibleCount(6);
                  }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  animate={{
                    scale: isActive ? 1.04 : 1,
                    rotate: isActive ? -1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                  className={`group relative flex-1 min-w-[75px] max-w-[220px] h-16 md:h-20 flex items-center justify-center border-4 border-slate-900 dark:border-zinc-700 font-black italic uppercase rounded-2xl overflow-visible z-10 ${isActive
                    ? "text-white -skew-x-6 shadow-[4px_4px_0_0_#FBBF24]"
                    : "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 shadow-[4px_4px_0_0_var(--primary-color),8px_8px_0_0_#000] md:shadow-[4px_4px_0_0_var(--primary-color),8px_8px_0_0_#000,12px_12px_0_0_#FBBF24]"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryHighlight"
                      className="absolute inset-0 bg-gradient-to-r from-[#6D4AFF] to-indigo-600 border-4 border-slate-900 dark:border-zinc-300 rounded-2xl -skew-x-6 -z-10"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                  <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 z-20">
                    {cat === "ALL" && <TicketIcon className={`h-5 w-5 md:h-6 md:w-6 stroke-[3] ${isActive ? "text-amber-300 animate-pulse" : "text-slate-900 dark:text-zinc-50"}`} />}
                    {cat === "MUSIK" && <Music className={`h-5 w-5 md:h-6 md:w-6 stroke-[3] ${isActive ? "text-amber-400" : "text-slate-900 dark:text-zinc-50"}`} />}
                    {cat === "TEATER" && <Sparkles className={`h-5 w-5 md:h-6 md:w-6 stroke-[3] ${isActive ? "text-amber-300 animate-spin-slow" : "text-slate-900 dark:text-zinc-50"}`} />}
                    {cat === "FAVORIT" && <HeartIcon className={`h-5 w-5 md:h-6 md:w-6 stroke-[3] ${isActive ? "text-white animate-pulse" : "text-slate-900 dark:text-zinc-50"}`} fill={isActive ? "white" : "none"} />}
                    <span className="tracking-[0.1em] sm:tracking-[0.15em] text-[10px] sm:text-xs md:text-sm lg:text-base">{cat}</span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* ── DROPDOWN SORTING ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-12 border-t-4 border-slate-900 dark:border-zinc-700 pt-6 mb-12 gap-4 bg-white dark:bg-zinc-900 p-4 border-4 border-black dark:border-zinc-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)]">
          <p className="font-black italic uppercase text-slate-400 dark:text-zinc-500 text-sm">
            Menampilkan {visibleEvents.length} dari {processedEvents.length} Event
          </p>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Filter size={20} className="hidden md:block text-slate-400 dark:text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setVisibleCount(6);
              }}
              className="w-full md:w-auto p-4 border-4 border-slate-900 dark:border-zinc-700 bg-amber-400 dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 font-black italic uppercase text-xs shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] outline-none cursor-pointer hover:bg-white dark:hover:bg-zinc-800 transition-colors"
            >
              <option value="NEWEST">🔥 Terbaru</option>
              <option value="PRICE_ASC">💵 Harga: Termurah</option>
              <option value="PRICE_DESC">💎 Harga: Termahal</option>
              <option value="TRENDING">📈 Paling Laku (Sisa Dikit)</option>
            </select>
          </div>
        </div>

        <div className="mt-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
              {[...Array(6)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : visibleEvents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
                {visibleEvents.map((event, idx) => (
                  <TiltEventCard
                    key={event.id}
                    event={event}
                    idx={idx}
                    today={today}
                    likedEvents={likedEvents}
                    toggleLike={toggleLike}
                    openDetailModal={openDetailModal}
                    formatRupiah={formatRupiah}
                    handleShareEvent={handleShareEvent}
                    handleOpenQuickPurchase={handleOpenQuickPurchase}
                  />
                ))}
              </div>
              {visibleCount < processedEvents.length && (
                <div className="flex justify-center mb-24">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 6)}
                    className="bg-white border-4 border-slate-900 px-12 py-6 font-black italic uppercase text-sm shadow-[8px_8px_0_0_#FBBF24] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all flex items-center gap-3"
                  >
                    <PlusCircle size={20} /> MUAT LEBIH BANYAK
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center border-8 border-black shadow-[8px_8px_0_0_#000] bg-white mb-24 relative overflow-hidden -rotate-1 flex flex-col items-center justify-center gap-6">
              <DotGrid className="opacity-20" />
              <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 relative z-10">🎫</p>
              <p className="text-4xl font-black italic uppercase text-slate-300 relative z-10">STAGE GAK NEMU</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("ALL");
                  setSortBy("NEWEST");
                  setVisibleCount(6);
                }}
                className="relative z-10 bg-amber-400 hover:bg-white text-slate-900 border-4 border-slate-900 px-8 py-4 font-black italic uppercase text-xs shadow-[6px_6px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all -skew-x-3"
              >
                RESET PENCARIAN & FILTER
              </button>
            </div>
          )}
        </div>

        {/* SCROLL REVEAL: CTA EO */}
        {!searchQuery && (
          <motion.section
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="bg-gradient-to-br from-[#6D4AFF] to-[#553C9A] border-8 border-slate-900 p-8 md:p-20 text-white shadow-[8px_8px_0_0_#000] md:shadow-[12px_12px_0_0_#6D4AFF,24px_24px_0_0_#000,36px_36px_0_0_#FBBF24] relative overflow-hidden mb-20 text-left"
          >
            <DotGrid className="opacity-10" />
            <div className="relative z-10 space-y-8 max-w-xl">
              <div className="bg-white border-4 border-slate-900 px-4 py-2 font-black uppercase text-[10px] text-slate-900 -rotate-2 inline-block italic shadow-[4px_4px_0_0_#000]">EVENT MANAGER</div>
              <h2 className="text-4xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.8] -skew-x-6 drop-shadow-[4px_4px_0_#000]">PUNYA EVENT? <br /> JUAL DI SINI.</h2>
              <Button asChild className="bg-amber-400 border-4 border-slate-900 text-slate-900 px-8 md:px-12 py-6 md:py-8 font-black uppercase text-xs md:text-sm shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:bg-white hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_0_#000] transition-all -skew-x-6 h-auto">
                <Link href="/explore/ajukan">DAFTAR EO SEKARANG</Link>
              </Button>
            </div>
            <TicketIcon size={250} className="absolute right-[-50px] bottom-[-50px] text-white/10 rotate-12 hidden md:block" strokeWidth={4} />
          </motion.section>
        )}
      </main>

      {/* SCROLL REVEAL: FOOTER */}
      <motion.footer
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-[#6D4AFF] text-white pt-24 pb-12 px-6 sm:px-12 border-t-8 border-slate-900 text-left relative z-20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 mb-16">
            <div className="space-y-8 text-left">
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 bg-amber-400 border-4 border-white -rotate-12 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <TicketIcon size={28} strokeWidth={3} className="text-slate-900" />
                </div>
                <span className="text-3xl font-black italic -skew-x-12 tracking-tighter uppercase">TIKETIN</span>
              </div>
              <p className="text-purple-100 text-sm font-bold italic uppercase border-l-4 border-amber-400 pl-4">Platform pemesanan tiket konser terpercaya & aman di Indonesia.</p>
            </div>
            <div className="space-y-6">
              <h4 className="font-black uppercase tracking-widest text-[10px] text-amber-300 italic underline underline-offset-8 text-left bg-black inline-block px-3 py-1">Support</h4>
              <ul className="space-y-4 text-purple-50 text-sm font-bold text-left uppercase">
                <li onClick={() => router.push("/explore/complaints")} className="flex items-center gap-3 italic hover:text-amber-300 cursor-pointer hover:translate-x-2 transition-transform"><MessageSquare size={16} /> PUSAT PENGADUAN</li>
                <li onClick={() => router.push("/explore/history")} className="flex items-center gap-3 italic hover:text-amber-300 cursor-pointer hover:translate-x-2 transition-transform"><Receipt size={16} /> RIWAYAT PEMBAYARAN</li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t-4 border-black flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black bg-amber-400 px-4 py-2 border-2 border-black">© 2026 TIKETIN. ALL STAGES PROTECTED.</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300 italic -skew-x-12 drop-shadow-[2px_2px_0_#000]">BUILT BY IKMAN @ UPI</p>
          </div>
        </div>
      </motion.footer>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 right-8 z-50 h-14 w-14 bg-amber-400 border-4 border-slate-900 shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-center justify-center hover:bg-[#6D4AFF] hover:text-white transition-colors"
          >
            <ArrowUp size={24} strokeWidth={4} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── EVENT DETAILS MODAL ─── */}
      <AnimatePresence>
        {selectedEventDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEventDetails(null)}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ type: "spring", stiffness: 150, damping: 18 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(event, info) => {
                if (info.offset.y > 120) {
                  setSelectedEventDetails(null);
                }
              }}
              className="bg-[#FCFAF1] dark:bg-zinc-950 border-8 border-slate-900 dark:border-zinc-700 shadow-[12px_12px_0_0_#000] dark:shadow-[12px_12px_0_0_var(--primary-color)] w-full max-w-4xl relative z-10 overflow-hidden flex flex-col md:flex-row my-4 md:my-8 max-h-[calc(100vh-3rem)] md:max-h-none text-slate-900 dark:text-zinc-50"
            >
              <div className="w-full md:w-1/2 relative h-48 md:h-auto md:min-h-[450px] shrink-0 border-b-8 md:border-b-0 md:border-r-8 border-slate-900 dark:border-zinc-700 bg-black">
                <img
                  src={selectedEventDetails.image_url}
                  alt={selectedEventDetails.title}
                  className="w-full h-full object-contain opacity-90"
                />
                <div className="absolute top-4 left-4 z-20">
                  <CategoryBadge category={selectedEventDetails.category} />
                </div>
                {(() => {
                  const isEnded = selectedEventDetails.end_date ? selectedEventDetails.end_date < today : selectedEventDetails.date < today;
                  if (isEnded) {
                    return (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-[2px] z-10">
                        <div className="bg-slate-900 text-amber-400 border-4 border-amber-400 px-6 py-2 font-black text-2xl md:text-3xl italic uppercase -rotate-12 shadow-[4px_4px_0_0_rgba(251,191,36,1)]">
                          STAGE SELESAI
                        </div>
                      </div>
                    );
                  }
                  if (selectedEventDetails.totalRemainingStock === 0) {
                    return (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px] z-10">
                        <div className="bg-slate-900 text-red-500 border-4 border-red-500 px-6 py-2 font-black text-2xl md:text-3xl italic uppercase -rotate-12 shadow-[4px_4px_0_0_rgba(239,68,68,1)]">
                          SOLD OUT
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto flex-1 md:max-h-[600px] text-left relative bg-white dark:bg-zinc-900">
                <button
                  onClick={() => setSelectedEventDetails(null)}
                  className="absolute top-4 right-4 z-30 h-10 w-10 bg-white dark:bg-zinc-900 hover:bg-red-500 hover:text-white border-4 border-slate-900 dark:border-zinc-700 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_var(--primary-color)] flex items-center justify-center font-black transition-all hover:rotate-90"
                >
                  <X size={20} strokeWidth={3} className="text-slate-900 dark:text-zinc-50" />
                </button>
                <div className="space-y-6">
                  <h2 className="text-2xl md:text-3xl font-black italic uppercase -skew-x-6 tracking-tighter leading-snug break-words mt-4 pr-10">
                    {selectedEventDetails.title}
                  </h2>
                  <div className="space-y-3 border-y-4 border-slate-900 dark:border-zinc-750 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-zinc-300">
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-red-500 shrink-0" />
                      <span>
                        Mulai: {selectedEventDetails.date}
                        {selectedEventDetails.end_date && ` s/d ${selectedEventDetails.end_date}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-[#6D4AFF] shrink-0" />
                      <span>{selectedEventDetails.location}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t-2 border-slate-200 dark:border-zinc-800 pt-3">
                      <div className="flex items-center gap-3">
                        <User size={18} className="text-amber-500 shrink-0" />
                        <span>
                          Organizer: {selectedEventDetails.profiles ? (selectedEventDetails.profiles.eo_name || selectedEventDetails.profiles.full_name) : "Organizer"}
                        </span>
                      </div>
                      {selectedEventDetails.profiles?.verification_status === 'approved' && (
                        <span className="bg-emerald-400 text-black border-2 border-slate-900 dark:border-white px-2 py-0.5 text-[8px] font-black uppercase italic shadow-[2px_2px_0px_0px_#000] rotate-[-2deg] shrink-0">
                          ✓ VERIFIED EO
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Deskripsi Event</p>
                    <div className="bg-white dark:bg-zinc-900 border-4 border-slate-900 dark:border-zinc-700 p-4 font-medium text-xs sm:text-sm text-slate-700 dark:text-zinc-300 max-h-[150px] overflow-y-auto brutal-scroll">
                      {selectedEventDetails.description ? selectedEventDetails.description.replace(/--seating-enabled:\d+x\d+--/g, "").trim() : "Tidak ada deskripsi untuk event ini."}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kategori Tiket Tersedia</p>
                    {isLoadingTiers ? (
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold italic py-2">
                        <Loader2 className="animate-spin text-[#6D4AFF]" size={14} />
                        MENGAMBIL TIER TIKET...
                      </div>
                    ) : eventTiers.length > 0 ? (
                      <div className="space-y-2 max-h-[180px] overflow-y-auto brutal-scroll pr-1">
                        {eventTiers.map((tier) => (
                          <div
                            key={tier.id}
                            className="bg-white dark:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-700 p-3 flex justify-between items-center shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_var(--primary-color)] gap-2"
                          >
                            <div className="text-left">
                              <p className="font-black text-xs md:text-sm uppercase italic text-slate-900 dark:text-zinc-50">{tier.name}</p>
                              {tier.description && (
                                <p className="text-[9px] text-slate-500 dark:text-zinc-400 font-bold uppercase">{tier.description}</p>
                              )}
                              <p className="text-[9px] text-red-500 font-bold uppercase mt-0.5">Sisa: {tier.stock} Tiket</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-xs md:text-sm text-[#6D4AFF] italic">{formatRupiah(tier.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-red-500 italic py-2">KATEGORI TIKET BELUM DIATUR EO!</p>
                    )}
                  </div>
                  <div className="space-y-3 border-t-4 border-slate-900 dark:border-zinc-700 pt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ulasan Pembeli</p>
                      {eventReviews.length > 0 && (
                        <span className="bg-amber-400 border-2 border-slate-900 dark:border-zinc-700 px-2 py-0.5 text-[10px] font-black uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-1">
                          ★ {(eventReviews.reduce((acc, r) => acc + r.rating, 0) / eventReviews.length).toFixed(1)} / 5.0 ({eventReviews.length})
                        </span>
                      )}
                    </div>
                    {isLoadingReviews ? (
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold italic py-2">
                        <Loader2 className="animate-spin text-[#6D4AFF]" size={14} />
                        MENGAMBIL ULASAN...
                      </div>
                    ) : eventReviews.length > 0 ? (
                      (() => {
                        const totalCount = eventReviews.length;
                        const starCounts = [0, 0, 0, 0, 0, 0];
                        eventReviews.forEach(r => {
                          if (r.rating >= 1 && r.rating <= 5) starCounts[r.rating]++;
                        });
                        return (
                          <div className="space-y-4">
                            <div className="bg-slate-100 dark:bg-zinc-800 border-2 border-slate-900 dark:border-zinc-700 p-3 shadow-[2px_2px_0_0_#000] space-y-1">
                              {[5, 4, 3, 2, 1].map((star) => {
                                const count = starCounts[star];
                                const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                                return (
                                  <div key={star} className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-700 dark:text-zinc-300">
                                    <span className="w-12 text-left">{star} Bintang</span>
                                    <div className="flex-grow h-2.5 bg-slate-200 dark:bg-zinc-700 border border-slate-900 dark:border-zinc-600 relative overflow-hidden">
                                      <div
                                        className="h-full bg-amber-400 border-r border-slate-900"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="w-12 text-right">{count} ({Math.round(pct)}%)</span>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="space-y-3 max-h-[220px] overflow-y-auto brutal-scroll pr-1">
                              {eventReviews.map((review) => (
                                <div key={review.id} className="bg-white dark:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-700 p-3 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_var(--primary-color)] space-y-1">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6 border-2 border-slate-900 rounded-none shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                                        <AvatarImage src={review.profiles?.avatar_url} />
                                        <AvatarFallback className="bg-amber-400 text-slate-900 font-black text-[9px]">
                                          {review.profiles?.full_name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-[10px] font-black uppercase text-slate-900 dark:text-zinc-100 leading-none">
                                          {review.profiles?.full_name || "Anonymous"}
                                        </p>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase">
                                          {new Date(review.created_at).toLocaleDateString("id-ID")}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          size={10}
                                          className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-xs font-medium text-slate-600 dark:text-zinc-300 normal-case tracking-normal italic pl-8">
                                    "{review.comment}"
                                  </p>
                                  {review.reply_comment && (
                                    <div className="mt-2.5 p-3 bg-slate-50 dark:bg-zinc-800/80 border border-dashed border-[#6D4AFF] text-left relative pl-6 ml-8">
                                      <div className="absolute left-2.5 top-3.5 w-1.5 h-1.5 rounded-full bg-[#6D4AFF] animate-pulse" />
                                      <p className="text-[9px] font-black uppercase text-[#6D4AFF] tracking-widest mb-1">
                                        Tanggapan EO Resmi
                                      </p>
                                      <p className="text-[11px] font-medium text-slate-700 dark:text-zinc-300 normal-case tracking-normal italic">
                                        "{review.reply_comment}"
                                      </p>
                                      {review.replied_at && (
                                        <p className="text-[8px] text-slate-400 uppercase mt-1 text-right">
                                          {new Date(review.replied_at).toLocaleDateString("id-ID")}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-xs font-bold text-slate-400 italic py-2">Belum ada ulasan untuk event ini.</p>
                    )}
                  </div>
                </div>
                <div className="pt-6 border-t-4 border-slate-900 dark:border-zinc-700 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase italic">Harga Mulai Dari</p>
                    <p className="text-3xl font-black text-[#6D4AFF] italic tracking-tighter leading-none">
                      {formatRupiah(selectedEventDetails.price)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-end">
                    {userTicketEventIds.has(selectedEventDetails.id) && (
                      <button
                        onClick={() => {
                          setSelectedEventDetails(null);
                          handleOpenEventChat(selectedEventDetails.id, selectedEventDetails.title);
                        }}
                        className="py-4 px-6 border-4 border-slate-900 dark:border-zinc-750 bg-[#6D4AFF] text-white hover:bg-amber-400 hover:text-slate-900 font-black italic uppercase text-xs md:text-sm shadow-[6px_6px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 rounded-xl"
                      >
                        <MessageSquare size={16} strokeWidth={3} className="shrink-0" />
                        GRUP CHAT
                      </button>
                    )}
                    {(() => {
                      const isEnded = selectedEventDetails.end_date ? selectedEventDetails.end_date < today : selectedEventDetails.date < today;
                      return (
                        <button
                          disabled={selectedEventDetails.totalRemainingStock === 0 || isEnded}
                          onClick={() => {
                            setSelectedEventDetails(null);
                            handleOpenQuickPurchase(selectedEventDetails);
                          }}
                          className={`py-4 px-8 border-4 border-slate-900 dark:border-zinc-750 font-black italic uppercase text-xs md:text-sm shadow-[6px_6px_0_0_#6D4AFF] dark:shadow-[6px_6px_0_0_var(--primary-color)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 rounded-xl ${selectedEventDetails.totalRemainingStock === 0 || isEnded
                              ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none border-slate-300 dark:border-zinc-800"
                              : "bg-amber-400 dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 hover:bg-[#6D4AFF] hover:text-white"
                            }`}
                        >
                          {selectedEventDetails.totalRemainingStock === 0 ? "SOLD OUT" : isEnded ? "EVENT SELESAI" : "BELI TIKET"}
                          <ChevronRight size={18} strokeWidth={4} />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎫 SLIDE-OUT TICKET DRAWER */}
      <AnimatePresence>
        {quickPurchaseEvent && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickPurchaseEvent(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 150 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(event, info) => {
                if (info.offset.y > 120) {
                  setQuickPurchaseEvent(null);
                }
              }}
              className="relative w-full max-w-md h-full bg-[#FCFAF1] dark:bg-zinc-950 border-l-8 border-slate-900 dark:border-zinc-800 shadow-[-10px_0_0_0_rgba(0,0,0,0.15)] flex flex-col z-10 overflow-y-auto brutal-scroll p-6 md:p-8"
            >
              <div className="flex justify-between items-center border-b-4 border-slate-900 dark:border-zinc-850 pb-4 mb-6">
                <div>
                  <h3 className="text-xl font-black italic uppercase -skew-x-6 text-slate-900 dark:text-white">
                    PILIH TIKET
                  </h3>
                  <p className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
                    Pemesanan Aman & Cepat
                  </p>
                </div>
                <button
                  onClick={() => setQuickPurchaseEvent(null)}
                  className="p-2 border-3 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white hover:bg-red-500 hover:text-white shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all rounded-xl"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              <div className="bg-white dark:bg-zinc-900 border-4 border-slate-900 dark:border-zinc-800 p-4 shadow-[4px_4px_0_0_rgba(109,74,255,0.2),8px_8px_0_0_#000] rounded-2xl mb-6">
                <h4 className="text-md font-black uppercase italic -skew-x-3 text-slate-900 dark:text-white leading-tight">
                  {quickPurchaseEvent.title}
                </h4>
                <div className="mt-3 space-y-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-red-500 shrink-0" /> {quickPurchaseEvent.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-[#6D4AFF] shrink-0" /> {quickPurchaseEvent.location}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Kategori Tiket Tersedia
                </p>
                {isLoadingDrawerTiers ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500 dark:text-zinc-400 font-bold italic text-xs">
                    <Loader2 className="animate-spin text-[#6D4AFF]" size={24} />
                    MENCARI TIKET TERBAIK...
                  </div>
                ) : drawerTiers.length > 0 ? (
                  drawerTiers.map((tier) => {
                    const isSelected = selectedDrawerTierId === tier.id;
                    const isSoldOut = tier.stock <= 0;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => !isSoldOut && setSelectedDrawerTierId(tier.id)}
                        className={`border-4 p-4 rounded-2xl flex justify-between items-center transition-all relative overflow-hidden select-none cursor-pointer ${isSoldOut
                            ? "bg-slate-100 dark:bg-zinc-900/50 border-slate-300 dark:border-zinc-850 opacity-60 cursor-not-allowed"
                            : isSelected
                              ? "bg-amber-50 dark:bg-zinc-900/80 border-[#6D4AFF] shadow-[4px_4px_0_0_#6D4AFF]"
                              : "bg-white dark:bg-zinc-900 border-slate-900 dark:border-zinc-800 shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                          }`}
                      >
                        {isSoldOut && (
                          <div className="absolute inset-0 bg-black/5 dark:bg-white/5 flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
                            <span className="bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 border border-slate-900 shadow-[1px_1px_0_0_#000] rotate-6">
                              SOLD OUT
                            </span>
                          </div>
                        )}
                        <div className="text-left pr-2">
                          <p className="font-black text-xs md:text-sm uppercase text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                            {tier.name}
                            {isSelected && <span className="h-2 w-2 rounded-full bg-[#6D4AFF]" />}
                          </p>
                          {tier.description && (
                            <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase mt-0.5">{tier.description}</p>
                          )}
                          <p className="text-[9px] text-red-500 font-black uppercase mt-1">Sisa: {tier.stock} Tiket</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-sm text-[#6D4AFF] italic">{formatRupiah(tier.price)}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs font-bold text-red-500 italic py-2">KATEGORI TIKET BELUM DIATUR EO!</p>
                )}
              </div>

              {selectedDrawerTierId && (
                (() => {
                  const selectedTier = drawerTiers.find((t) => t.id === selectedDrawerTierId);
                  if (!selectedTier) return null;
                  const maxQty = Math.min(4, selectedTier.stock);
                  const totalPrice = selectedTier.price * drawerQty;
                  return (
                    <div className="border-t-4 border-slate-900 dark:border-zinc-850 pt-5 mt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500">Jumlah Tiket</p>
                          <p className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 italic uppercase">Maksimal 4 tiket per transaksi</p>
                        </div>
                        <div className="flex items-center gap-2 border-3 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 rounded-xl shadow-[2px_2px_0_0_#000]">
                          <button
                            disabled={drawerQty <= 1}
                            onClick={() => setDrawerQty(prev => Math.max(1, prev - 1))}
                            className="h-8 w-8 font-black text-sm border-2 border-slate-900 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 disabled:opacity-40 flex items-center justify-center rounded-lg"
                          >
                            -
                          </button>
                          <span className="font-black text-sm px-3 text-slate-900 dark:text-white">
                            {drawerQty}
                          </span>
                          <button
                            disabled={drawerQty >= maxQty}
                            onClick={() => setDrawerQty(prev => Math.min(maxQty, prev + 1))}
                            className="h-8 w-8 font-black text-sm border-2 border-slate-900 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 disabled:opacity-40 flex items-center justify-center rounded-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-slate-100 dark:bg-zinc-900 border-3 border-slate-900 dark:border-zinc-850 p-4 rounded-xl shadow-[3px_3px_0_0_#000]">
                        <div>
                          <p className="text-[8px] font-black uppercase text-slate-400">Total Pembayaran</p>
                          <p className="text-[10px] font-black uppercase text-[#6D4AFF]">{drawerQty}x {selectedTier.name}</p>
                        </div>
                        <p className="text-xl font-black italic text-[#6D4AFF]">{formatRupiah(totalPrice)}</p>
                      </div>
                      <button
                        onClick={() => {
                          setQuickPurchaseEvent(null);
                          router.push(`/explore/checkout/${quickPurchaseEvent.id}?category_id=${selectedDrawerTierId}&qty=${drawerQty}`);
                        }}
                        className="w-full py-4 bg-amber-400 hover:bg-[#6D4AFF] text-slate-900 hover:text-white border-4 border-slate-900 font-black italic uppercase text-xs md:text-sm shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-center rounded-xl flex items-center justify-center gap-2"
                      >
                        PESAN SEKARANG
                        <ChevronRight size={16} strokeWidth={3} />
                      </button>
                    </div>
                  );
                })()
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎫 FLOATING ACTIVE TICKETS WIDGET */}
      {activeTicketsCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.05, rotate: -2 }}
          className="fixed bottom-6 left-6 z-40"
        >
          <Link
            href="/explore/tickets"
            className="flex items-center gap-3 bg-[#6D4AFF] text-white border-4 border-slate-900 px-4 py-3 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all -skew-x-6 rounded-2xl relative group"
          >
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping" />
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-emerald-400 border-2 border-slate-900 rounded-full" />

            <div className="h-8 w-8 bg-amber-400 border-2 border-slate-900 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
              <TicketIcon className="text-slate-900" size={16} strokeWidth={3} />
            </div>
            <div className="text-left -skew-x-3">
              <p className="text-[8px] font-black text-amber-300 tracking-wider uppercase leading-none mb-0.5">TIKET AKTIF</p>
              <p className="text-xs font-black uppercase text-white leading-none">
                {activeTicketsCount} Tiket Siap Pakai
              </p>
            </div>
          </Link>
        </motion.div>
      )}

      {/* 💬 CHAT DRAWER KOMUNITAS */}
      <ChatDrawer
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        eventId={chatEventId}
        eventTitle={chatEventTitle}
        userProfile={userProfile ? {
          id: userProfile.id,
          full_name: userProfile.full_name,
          avatar_url: userProfile.avatar_url || ""
        } : null}
      />

      {/* 🚀 BACK TO TOP BUTTON */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            whileHover={{ scale: 1.1, rotate: -3 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-40 h-14 w-14 bg-amber-400 hover:bg-[var(--primary-color,#6D4AFF)] text-slate-900 hover:text-white border-4 border-slate-900 shadow-[4px_4px_0_0_#000] flex items-center justify-center cursor-pointer transition-colors duration-200"
          >
            <ArrowUp size={24} strokeWidth={4} />
          </motion.button>
        )}
      </AnimatePresence>

      <SpeedInsights />
    </div>
  );
}