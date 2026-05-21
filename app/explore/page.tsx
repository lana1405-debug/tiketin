"use client";

import { useEffect, useState, useRef } from "react";
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
  Users, Globe, Music, Receipt, Filter, X
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
// import { ThemeToggle } from "@/components/ThemeToggle"; // Uncomment jika lo mau pake ini
import { Input } from "@/components/ui/input";
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
  .brutal-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .brutal-scroll::-webkit-scrollbar-track {
    background: #FCFAF1;
    border-left: 2px solid #000;
  }
  .brutal-scroll::-webkit-scrollbar-thumb {
    background: #6D4AFF;
    border: 2px solid #000;
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
    "🏆 #1 PLATFORM TIKET KONSER INDONESIA",
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
  return (
    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border-2 border-slate-900 ${style.bg} shadow-[2px_2px_0_0_#000]`}>
      {style.text}
    </span>
  );
}

function EventCardSkeleton() {
  return (
    <div className="bg-white border-4 border-slate-900 shadow-[6px_6px_0_0_rgba(109,74,255,0.2),12px_12px_0_0_rgba(0,0,0,1)] flex flex-col relative overflow-hidden animate-pulse">
      {/* Banner */}
      <div className="h-64 bg-slate-200 border-b-4 border-slate-900 relative">
        <div className="absolute top-4 left-4 h-6 w-16 bg-slate-300 border-2 border-slate-400" />
        <div className="absolute top-4 right-4 h-10 w-10 bg-slate-300 border-4 border-slate-400" />
      </div>
      {/* Content */}
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

export default function ExplorePage() {
  const router = useRouter();
  const today = getLocalDateString();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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

  // State for Event Details Modal
  const [selectedEventDetails, setSelectedEventDetails] = useState<Event | null>(null);
  const [eventTiers, setEventTiers] = useState<any[]>([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState(false);

  // State for Event Reviews
  const [eventReviews, setEventReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // ⚡ STATE UNTUK HAPPY FANS (DINAMIS DARI DATABASE)
  const [totalFans, setTotalFans] = useState(0);
  const [marqueeItems, setMarqueeItems] = useState<string[]>([]);

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
    if (profile) setUserProfile(profile as UserProfile);

    // ⚡ TARIK DATA HAPPY FANS REAL DARI DATABASE
    const { count: fansCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer");

    if (fansCount !== null) {
      setTotalFans(fansCount); // Murni sesuai jumlah customer di tabel profiles
    }

    const { data: wishlist } = await supabase.from("wishlist").select("event_id").eq("user_id", session.user.id);
    if (wishlist) {
      setLikedEvents(new Set(wishlist.map(w => w.event_id)));
    }

    const { data: eventData } = await supabase
      .from("events")
      .select("*, ticket_categories(stock), reviews(rating), vouchers(*)")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (eventData) {
      const formattedEvents = eventData.map((ev: any) => {
        const totalRemainingStock = ev.ticket_categories?.reduce((acc: number, cat: any) => acc + (cat.stock || 0), 0) || 0;
        
        // Kalkulasi rating rata-rata
        const reviewList = ev.reviews || [];
        const avgRating = reviewList.length > 0
          ? reviewList.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewList.length
          : 0;
        const totalReviews = reviewList.length;

        // Cek apakah ada voucher aktif
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
    // ⚡ TARIK DATA MARQUEE SETTINGS DARI DATABASE
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

  // ⚡ LOGIC ROLLBACK PADA WISHLIST
  const toggleLike = async (eventId: string) => {
    if (!userProfile) return;
    const isLiked = likedEvents.has(eventId);

    // Optimistic Update UI
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
      // Rollback ke state sebelumnya jika gagal
      setLikedEvents((prev) => {
        const next = new Set(prev);
        isLiked ? next.add(eventId) : next.delete(eventId);
        return next;
      });
      alert("Koneksi gagal, wishlist tidak tersimpan.");
    }
  };

  // ⚡ LOGIC RACE CONDITION MENGGUNAKAN RPC
  const handleBookNow = async (eventId: string) => {
    if (userProfile?.verification_status !== "approved") {
      alert("⚠️ HOLD UP! Kamu harus lolos verifikasi KTP dulu sebelum bisa war tiket!");
      router.push("/verify");
      return;
    }

    // Call prosedur Supabase untuk lock dan cek stok di level database
    try {
      const { data: success, error } = await supabase.rpc('lock_ticket_stock', {
        p_event_id: eventId,
        p_qty: 1
      });

      if (error || !success) {
        alert("Waduh! Kamu kalah cepat. Tiket barusan saja direbut orang lain.");
        return;
      }
      router.push(`/explore/checkout/${eventId}`);
    } catch (err) {
      // Jika RPC belum ada di DB, arahin biasa aja (Fallback Mode)
      console.warn("RPC lock_ticket_stock not found or failed, falling back to standard redirect.", err);
      router.push(`/explore/checkout/${eventId}`);
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
          profiles (
            full_name,
            avatar_url
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
    <div className={`min-h-screen flex flex-col items-center justify-center bg-[#FCFAF1] brutal-grid noise gap-4 ${poppins_font.className}`}>
      <motion.div
        animate={{ rotate: [0, -12, 12, -12, 0], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="h-24 w-24 bg-[#6D4AFF] border-4 border-slate-900 flex items-center justify-center shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
      >
        <TicketIcon className="text-amber-400" size={48} strokeWidth={3} />
      </motion.div>
      <p className="font-black italic text-3xl text-slate-900 uppercase -skew-x-6 tracking-tighter mt-4 bg-white px-4 border-4 border-black shadow-[4px_4px_0_0_#000]">
        LOADING ARENA<motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }}>...</motion.span>
      </p>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#FCFAF1] brutal-grid noise text-slate-900 ${poppins_font.className} selection:bg-amber-400 selection:text-black`}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <nav className="w-full bg-white border-b-4 border-slate-900 sticky top-0 z-[50] shadow-[0_4px_0_0_rgba(0,0,0,1)] h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/explore" className="flex items-center gap-2 group">
            <div className="h-10 w-10 bg-[#6D4AFF] border-4 border-slate-900 -rotate-12 flex items-center justify-center group-hover:rotate-0 transition-transform shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <TicketIcon className="text-amber-400" size={24} strokeWidth={3} />
            </div>
            <span className="text-2xl font-black italic -skew-x-12 tracking-tighter uppercase hidden md:block">TIKETIN</span>
          </Link>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group p-1 pr-3 rounded-2xl transition-all border-2 border-transparent hover:border-slate-900 bg-white">
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
                    <p className="text-xs font-black italic -skew-x-6 uppercase">{userProfile?.full_name?.split(" ")[0]}</p>
                  </div>
                  <Avatar className="h-10 w-10 border-4 border-slate-900 rounded-none -rotate-6 shadow-[3px_3px_0_0_rgba(0,0,0,1)] group-hover:rotate-0 transition-transform">
                    <AvatarImage src={userProfile?.avatar_url} />
                    <AvatarFallback className="bg-[#6D4AFF] text-white font-black">{userProfile?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 border-4 border-slate-900 rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-2 bg-white z-[60]">
                <DropdownMenuLabel className="font-black italic uppercase text-[10px] text-slate-400">Quick Access</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-900 h-0.5" />
                <DropdownMenuItem onClick={() => router.push("/verify")} className="focus:bg-amber-400 font-black italic uppercase text-xs py-3 cursor-pointer">
                  <ShieldCheck className="mr-2 h-4 w-4" /> {userProfile?.verification_status === "approved" ? "Status KTP (Lolos)" : "Verifikasi KTP"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/tickets")} className="focus:bg-blue-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer">
                  <TicketIcon className="mr-2 h-4 w-4" /> Tiket Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/complaints")} className="focus:bg-emerald-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer">
                  <MessageSquare className="mr-2 h-4 w-4" /> Pengaduan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/rewards")} className="focus:bg-purple-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer">
                  <Trophy className="mr-2 h-4 w-4" /> Tukar Poin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/history")} className="focus:bg-slate-900 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer">
                  <Receipt className="mr-2 h-4 w-4" /> Riwayat Pembayaran
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-900 h-0.5" />
                <DropdownMenuItem
                  className="focus:bg-red-500 focus:text-white font-black italic uppercase text-xs py-3 text-red-500 cursor-pointer"
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
                      Verifikasi sekarang agar kamu bisa berpartisipasi dalam war tiket event terpopuler!
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

        {/* HERO HEADER */}
        <header className="mb-16 space-y-8 flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl md:text-8xl font-black -skew-x-12 italic uppercase leading-[0.75] tracking-tighter drop-shadow-[4px_4px_0_#fff]">
              YO,{" "}
              <span className="relative inline-block">
                <span className="relative z-10">{userProfile?.full_name?.split(" ")[0].toUpperCase()}!</span>
                <span className="absolute bottom-0 left-0 right-0 h-4 bg-amber-400 -z-0 -skew-x-6 opacity-70 border-b-2 border-black" />
              </span>
            </h1>
          </motion.div>

          <motion.div
            className="relative w-full max-w-2xl"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-slate-400 z-10" strokeWidth={3} />
            <input
              placeholder="CARI KONSER..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(6);
              }}
              className="h-16 md:h-20 w-full pl-12 md:pl-16 pr-12 md:pr-16 border-4 border-slate-900 bg-white font-black text-sm md:text-lg uppercase outline-none -skew-x-3 focus:bg-amber-50 transition-all shadow-[4px_4px_0_0_#6D4AFF,8px_8px_0_0_#000] md:shadow-[6px_6px_0_0_#6D4AFF,12px_12px_0_0_#000,18px_18px_0_0_#FBBF24]"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setVisibleCount(6);
                }}
                className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 border-2 border-transparent hover:border-slate-900 rounded-none transition-all z-10"
              >
                <X className="h-5 w-5 md:h-6 md:w-6 text-slate-900" strokeWidth={3} />
              </button>
            )}
          </motion.div>
        </header>

        {/* SCROLL REVEAL: STATS */}
        {!searchQuery && (
          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 gap-0 border-4 border-slate-900 mb-20 shadow-[6px_6px_0_0_#6D4AFF,12px_12px_0_0_#000,18px_18px_0_0_#FBBF24] overflow-hidden"
          >
            {[
              { icon: <Music size={28} strokeWidth={3} className="text-[#6D4AFF]" />, label: "TOTAL EVENT", value: events.length || 500, suffix: "+" },
              { icon: <Users size={28} strokeWidth={3} className="text-emerald-500" />, label: "HAPPY FANS", value: totalFans, suffix: "+" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className={`p-8 flex flex-col gap-2 bg-white relative overflow-hidden ${i === 0 ? "border-r-4 border-slate-900" : ""}`}
              >
                <DotGrid className="opacity-30" />
                <div className="relative z-10">
                  {stat.icon}
                  <p className="text-3xl md:text-5xl font-black italic tracking-tighter mt-2">
                    <AnimatedNumber target={stat.value} />{stat.suffix}
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.section>
        )}
        {/* SCROLL REVEAL: HERO CAROUSEL */}
        {!searchQuery && (
          <motion.section
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-32"
          >
            {isLoading ? (
              <div className="relative w-full h-[350px] md:h-[450px] border-8 border-slate-900 overflow-hidden bg-slate-900 shadow-[8px_8px_0_0_#6D4AFF,16px_16px_0_0_#000,24px_24px_0_0_#FBBF24] mb-8 animate-pulse flex flex-col justify-end p-6 md:p-12 gap-4">
                <div className="absolute inset-0 bg-slate-800" />
                <div className="h-6 w-32 bg-slate-700 relative z-10" />
                <div className="h-14 w-2/3 bg-slate-700 relative z-10" />
                <div className="h-10 w-48 bg-slate-700 relative z-10" />
              </div>
            ) : (
              <div className="relative w-full h-[350px] md:h-[450px] border-8 border-slate-900 overflow-hidden bg-slate-900 shadow-[8px_8px_0_0_#6D4AFF,16px_16px_0_0_#000,24px_24px_0_0_#FBBF24] mb-8">
                <AnimatePresence mode="wait">
                  {heroEvents.length > 0 && (
                    <motion.img
                      key={currentHeroIndex}
                      src={heroEvents[currentHeroIndex]?.image_url}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0 w-full h-full object-cover grayscale-[20%]"
                    />
                  )}
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent" />

                <div className="relative z-20 h-full p-6 md:p-12 flex flex-col justify-end items-start text-left">
                  <div className="bg-amber-400 border-4 border-slate-900 px-4 py-2 font-black uppercase text-[10px] shadow-[4px_4px_0_0_rgba(0,0,0,1)] -rotate-2 mb-4 md:mb-6 italic inline-flex items-center gap-2">
                    <Sparkles size={14} /> RECOMMENDED
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={currentHeroIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-4xl sm:text-3xl sm:text-4xl md:text-5xl lg:text-6xl md:text-8xl font-black italic uppercase text-white tracking-tighter drop-shadow-[4px_4px_0_rgba(0,0,0,1)] -skew-x-6 mb-4 break-words leading-none"
                    >
                      {heroEvents[currentHeroIndex]?.title || "LIVE NOW"}
                    </motion.h2>
                  </AnimatePresence>

                  {heroEvents[currentHeroIndex]?.totalRemainingStock > 0 && heroEvents[currentHeroIndex]?.totalRemainingStock <= 20 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-4 bg-red-500 text-white border-2 border-slate-900 px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] animate-pulse inline-flex items-center gap-2"
                    >
                      🔥 Sisa {heroEvents[currentHeroIndex].totalRemainingStock} Tiket! Buruan War!
                    </motion.div>
                  )}

                  {heroEvents[currentHeroIndex]?.price && (
                    <motion.div
                      key={`price-${currentHeroIndex}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mb-6 md:mb-8 flex items-center gap-4"
                    >
                      <span className="text-purple-200 font-black uppercase text-[10px] tracking-widest">Mulai dari</span>
                      <span className="bg-[#6D4AFF] border-4 border-white px-4 py-2 font-black text-white text-base md:text-lg italic -skew-x-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
                        {formatRupiah(heroEvents[currentHeroIndex].price)}
                      </span>
                    </motion.div>
                  )}

                  {(() => {
                    const activeHero = heroEvents[currentHeroIndex];
                    const isHeroEnded = activeHero ? (activeHero.end_date ? activeHero.end_date < today : activeHero.date < today) : false;
                    return (
                      <button
                        disabled={heroEvents[currentHeroIndex]?.totalRemainingStock === 0 || isHeroEnded}
                        onClick={() => {
                          const activeHeroId = heroEvents[currentHeroIndex]?.id;
                          if (activeHeroId) handleBookNow(activeHeroId);
                        }}
                        className={`border-4 border-slate-900 px-8 md:px-10 py-4 md:py-5 font-black uppercase text-sm shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all -skew-x-6 ${(heroEvents[currentHeroIndex]?.totalRemainingStock === 0 || isHeroEnded)
                          ? 'bg-slate-500 text-slate-300 cursor-not-allowed'
                          : 'bg-white text-black hover:bg-amber-400'
                          }`}
                      >
                        {isHeroEnded ? "STAGE SELESAI" : heroEvents[currentHeroIndex]?.totalRemainingStock === 0 ? "SOLD OUT" : "BOOK NOW"}
                      </button>
                    );
                  })()}
                </div>

                <div className="absolute bottom-6 right-6 z-30 flex gap-3">
                  {heroEvents.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentHeroIndex(i)}
                      className={`transition-all border-2 border-white ${i === currentHeroIndex ? "w-8 h-3 bg-amber-400" : "w-3 h-3 bg-white/50 hover:bg-white"}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}

        <div className="flex flex-col items-center justify-center space-y-10 mb-22 mt-10 pt-10">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="flex flex-col items-center gap-4 bg-white p-6 border-4 border-black shadow-[8px_8px_0_0_#000] -rotate-1"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="text-red-500" size={40} strokeWidth={4} />
              <h2 className="text-4xl md:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter -skew-x-6 text-center">
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
                  className={`group relative flex-1 min-w-[75px] max-w-[220px] h-16 md:h-20 flex items-center justify-center border-4 border-slate-900 font-black italic uppercase transition-all shadow-[4px_4px_0_0_#6D4AFF,8px_8px_0_0_#000] md:shadow-[4px_4px_0_0_#6D4AFF,8px_8px_0_0_#000,12px_12px_0_0_#FBBF24] hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${isActive ? "bg-[#6D4AFF] text-white shadow-none translate-x-1 translate-y-1 md:translate-x-3 md:translate-y-3" : "bg-white text-slate-900"
                    }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
                    {cat === "MUSIK" && <Music className={`h-5 w-5 md:h-6 md:w-6 stroke-[3] ${isActive ? "text-amber-400" : "text-slate-900"}`} />}
                    {cat === "TEATER" && <Sparkles className={`h-5 w-5 md:h-6 md:w-6 stroke-[3] ${isActive ? "text-amber-300" : "text-slate-900"}`} />}
                    {cat === "ALL" && <TicketIcon className={`h-5 w-5 md:h-6 md:w-6 stroke-[3] ${isActive ? "text-amber-300" : "text-slate-900"}`} />}
                    {cat === "FAVORIT" && <HeartIcon className={`h-5 w-5 md:h-6 md:w-6 stroke-[3] ${isActive ? "text-white animate-pulse" : "text-slate-900"}`} fill={isActive ? "white" : "none"} />}
                    <span className="tracking-[0.1em] sm:tracking-[0.15em] text-[10px] sm:text-xs md:text-sm lg:text-base">{cat}</span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* ⚡ DROPDOWN SORTING */}
        <div className="flex flex-col md:flex flex-col md:flex-row justify-between items-start md:items-center mt-12 border-t-4 border-slate-900 pt-6 mb-12 gap-4 bg-white p-4 border-4 shadow-[4px_4px_0_0_#000]">
          <p className="font-black italic uppercase text-slate-400 text-sm">
            Menampilkan {visibleEvents.length} dari {processedEvents.length} Event
          </p>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Filter size={20} className="hidden md:block text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setVisibleCount(6);
              }}
              className="w-full md:w-auto p-4 border-4 border-slate-900 bg-amber-400 font-black italic uppercase text-xs shadow-[4px_4px_0_0_#000] outline-none cursor-pointer hover:bg-white transition-colors"
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
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: (idx % 3) * 0.1 }}
                    className="bg-white border-4 border-slate-900 shadow-[6px_6px_0_0_#6D4AFF,12px_12px_0_0_#000] md:shadow-[6px_6px_0_0_#6D4AFF,12px_12px_0_0_#000,18px_18px_0_0_#FBBF24] hover:shadow-[8px_8px_0_0_#6D4AFF,16px_16px_0_0_#000,24px_24px_0_0_#FBBF24] hover:-translate-x-1 hover:-translate-y-1 transition-all flex flex-col group cursor-pointer"
                    onClick={() => openDetailModal(event)}
                  >
                    <div className="relative h-64 border-b-4 border-slate-900 overflow-hidden bg-black">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500" />

                      {(() => {
                        const isEventEnded = event.end_date ? event.end_date < today : event.date < today;
                        if (isEventEnded) {
                          return (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-[2px] z-20">
                              <div className="bg-slate-900 text-amber-400 border-4 border-amber-400 px-6 py-2 font-black text-3xl italic uppercase -skew-x-12 shadow-[4px_4px_0_0_rgba(251,191,36,1)]">
                                STAGE SELESAI
                              </div>
                            </div>
                          );
                        }
                        if (event.totalRemainingStock === 0) {
                          return (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px] z-20">
                              <div className="bg-slate-900 text-red-500 border-4 border-red-500 px-6 py-2 font-black text-3xl italic uppercase -skew-x-12 shadow-[4px_4px_0_0_rgba(239,68,68,1)]">
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
                          <span className="bg-[#FF6B6B] text-white border-2 border-slate-900 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] animate-pulse flex items-center gap-1">
                            <Zap size={10} fill="white" strokeWidth={3} /> PROMO VOUCHER
                          </span>
                        )}
                      </div>

                      {event.totalRemainingStock > 0 && event.totalRemainingStock <= 20 && (
                        <div className="absolute top-4 left-32 z-30 bg-red-500 text-white border-2 border-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] animate-pulse">
                          🔥 Sisa {event.totalRemainingStock} Tiket!
                        </div>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(event.id); }}
                        className={`absolute top-4 right-4 z-30 p-3 border-4 border-slate-900 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all active:scale-95 hover:scale-110 ${likedEvents.has(event.id) ? "bg-red-500 text-white" : "bg-white hover:bg-red-500 hover:text-white"
                          }`}
                      >
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: [0, -10, 10, -10, 0] }}
                          transition={{ duration: 0.3 }}
                        >
                          <HeartIcon size={18} strokeWidth={3} fill={likedEvents.has(event.id) ? "white" : "none"} />
                        </motion.div>
                      </button>
                    </div>

                    <div className="p-8 space-y-6 flex-grow flex flex-col text-left">
                      {/* Rating Rata-rata & Total Ulasan */}
                      <div className="flex items-center gap-2">
                        {event.totalReviews && event.totalReviews > 0 ? (
                          <div className="flex items-center gap-1.5 bg-amber-400 border-2 border-slate-900 px-2 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0_0_#000] italic">
                            <Star size={10} fill="black" strokeWidth={3} />
                            <span>{Number(event.avgRating || 0).toFixed(1)} ({event.totalReviews} Ulasan)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-white border-2 border-slate-900 px-2 py-0.5 text-[9px] font-black uppercase text-slate-500 shadow-[2px_2px_0_0_#000] italic">
                            <Star size={10} strokeWidth={3} />
                            <span>Belum Ada Ulasan</span>
                          </div>
                        )}
                      </div>

                      <div className="h-[3.5rem] overflow-hidden pr-2">
                        <h3 className="text-lg lg:text-xl font-black italic uppercase -skew-x-6 tracking-tighter leading-snug break-all truncate whitespace-normal group-hover:text-[#6D4AFF] transition-colors">
                          {event.title}
                        </h3>
                      </div>
                      <div className="space-y-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <div className="flex items-center gap-3">
                          <Calendar size={18} className="text-red-500 shrink-0" /> {event.date}
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin size={18} className="text-[#6D4AFF] shrink-0" /> {event.location}
                        </div>
                        {event.description && (
                          <p className="mt-4 pt-3 border-t-2 border-slate-200 text-xs font-medium normal-case tracking-normal text-slate-600 italic line-clamp-2 bg-slate-50 p-2">
                            "{event.description}"
                          </p>
                        )}
                      </div>
                      <div className="pt-6 border-t-4 border-slate-900 flex flex-col gap-4 mt-auto">
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <p className="text-[8px] font-black text-slate-400 mb-1 uppercase italic">From</p>
                            <p className="text-2xl font-black text-[#6D4AFF] italic tracking-tighter leading-none">{formatRupiah(event.price)}</p>
                          </div>
                          {event.totalRemainingStock > 0 ? (
                            <span className="bg-emerald-400 border-2 border-slate-900 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000]">
                              Tersedia
                            </span>
                          ) : (
                            <span className="bg-red-500 text-white border-2 border-slate-900 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000]">
                              Sold Out
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openDetailModal(event); }}
                            className="w-full py-3 bg-white hover:bg-amber-400 text-slate-900 border-4 border-slate-900 font-black italic uppercase text-[10px] tracking-wider shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all text-center"
                          >
                            DETAIL INFO
                          </button>
                          {(() => {
                            const isEventEnded = event.end_date ? event.end_date < today : event.date < today;
                            return (
                              <button
                                disabled={event.totalRemainingStock === 0 || isEventEnded}
                                onClick={(e) => { e.stopPropagation(); handleBookNow(event.id); }}
                                className={`w-full py-3 border-4 border-slate-900 font-black italic uppercase text-[10px] tracking-wider shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all text-center ${(event.totalRemainingStock === 0 || isEventEnded)
                                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                  : 'bg-[#6D4AFF] text-white hover:bg-slate-900'
                                  }`}
                              >
                                {isEventEnded ? "SELESAI" : "WAR TIKET"}
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
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
          <div className="grid grid-cols-1 md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 mb-16">
            <div className="space-y-8 text-left">
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 bg-amber-400 border-4 border-white -rotate-12 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <TicketIcon size={28} strokeWidth={3} className="text-slate-900" />
                </div>
                <span className="text-3xl font-black italic -skew-x-12 tracking-tighter uppercase">TIKETIN</span>
              </div>
              <p className="text-purple-100 text-sm font-bold italic uppercase border-l-4 border-amber-400 pl-4">Platform war tiket konser paling gila di Indonesia.</p>
            </div>
            <div className="space-y-6">
              <h4 className="font-black uppercase tracking-widest text-[10px] text-amber-300 italic underline underline-offset-8 text-left bg-black inline-block px-3 py-1">Support</h4>
              <ul className="space-y-4 text-purple-50 text-sm font-bold text-left uppercase">
                <li onClick={() => router.push("/explore/complaints")} className="flex items-center gap-3 italic hover:text-amber-300 cursor-pointer hover:translate-x-2 transition-transform"><MessageSquare size={16} /> PUSAT PENGADUAN</li>
                <li onClick={() => router.push("/explore/history")} className="flex items-center gap-3 italic hover:text-amber-300 cursor-pointer hover:translate-x-2 transition-transform"><Receipt size={16} /> RIWAYAT PEMBAYARAN</li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t-4 border-black flex flex-col md:flex flex-col md:flex-row justify-between items-center gap-6">
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEventDetails(null)}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ type: "spring", stiffness: 150, damping: 18 }}
              className="bg-[#FCFAF1] border-8 border-slate-900 shadow-[12px_12px_0_0_#000] w-full max-w-4xl relative z-10 overflow-hidden flex flex-col md:flex-row my-8"
            >
              {/* Left Side: Banner Image & Category */}
              <div className="w-full md:w-1/2 relative min-h-[250px] md:min-h-[450px] border-b-8 md:border-b-0 md:border-r-8 border-slate-900 bg-black">
                <img
                  src={selectedEventDetails.image_url}
                  alt={selectedEventDetails.title}
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute top-4 left-4 z-20">
                  <CategoryBadge category={selectedEventDetails.category} />
                </div>

                {/* Expired / Soldout overlay */}
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

              {/* Right Side: Details Info */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[90vh] md:max-h-[600px] text-left relative">
                {/* Close Button */}
                <button
                  onClick={() => setSelectedEventDetails(null)}
                  className="absolute top-4 right-4 z-30 h-10 w-10 bg-white hover:bg-red-500 hover:text-white border-4 border-slate-900 shadow-[3px_3px_0_0_#000] flex items-center justify-center font-black transition-all hover:rotate-90"
                >
                  <X size={20} strokeWidth={3} />
                </button>

                <div className="space-y-6">
                  {/* Event Title */}
                  <h2 className="text-2xl md:text-3xl font-black italic uppercase -skew-x-6 tracking-tighter leading-snug break-words mt-4 pr-10">
                    {selectedEventDetails.title}
                  </h2>

                  {/* Metadata */}
                  <div className="space-y-3 border-y-4 border-slate-900 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700">
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
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Deskripsi Event</p>
                    <div className="bg-white border-4 border-slate-900 p-4 font-medium text-xs sm:text-sm text-slate-700 max-h-[150px] overflow-y-auto brutal-scroll">
                      {selectedEventDetails.description || "Tidak ada deskripsi untuk event ini."}
                    </div>
                  </div>

                  {/* Tiers/Kategori Tiket */}
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
                            className="bg-white border-2 border-slate-900 p-3 flex justify-between items-center shadow-[3px_3px_0_0_#000] gap-2"
                          >
                            <div className="text-left">
                              <p className="font-black text-xs md:text-sm uppercase italic text-slate-900">{tier.name}</p>
                              {tier.description && (
                                <p className="text-[9px] text-slate-500 font-bold uppercase">{tier.description}</p>
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

                  {/* Ulasan Pembeli */}
                  <div className="space-y-2 border-t-4 border-slate-900 pt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ulasan Pembeli</p>
                      {eventReviews.length > 0 && (
                        <span className="bg-amber-400 border-2 border-slate-900 px-2 py-0.5 text-[10px] font-black uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-1">
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
                      <div className="space-y-3 max-h-[200px] overflow-y-auto brutal-scroll pr-1">
                        {eventReviews.map((review) => (
                          <div key={review.id} className="bg-white border-2 border-slate-900 p-3 shadow-[3px_3px_0_0_#000] space-y-1">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 border-2 border-slate-900 rounded-none shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                                  <AvatarImage src={review.profiles?.avatar_url} />
                                  <AvatarFallback className="bg-amber-400 text-slate-900 font-black text-[9px]">
                                    {review.profiles?.full_name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-[10px] font-black uppercase text-slate-900 leading-none">
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
                            <p className="text-xs font-medium text-slate-600 normal-case tracking-normal italic pl-8">
                              "{review.comment}"
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 italic py-2">Belum ada ulasan untuk event ini.</p>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-6 border-t-4 border-slate-900 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase italic">Harga Mulai Dari</p>
                    <p className="text-3xl font-black text-[#6D4AFF] italic tracking-tighter leading-none">
                      {formatRupiah(selectedEventDetails.price)}
                    </p>
                  </div>
                  {(() => {
                    const isEnded = selectedEventDetails.end_date ? selectedEventDetails.end_date < today : selectedEventDetails.date < today;
                    return (
                      <button
                        disabled={selectedEventDetails.totalRemainingStock === 0 || isEnded}
                        onClick={() => {
                          setSelectedEventDetails(null);
                          handleBookNow(selectedEventDetails.id);
                        }}
                        className={`py-4 px-8 border-4 border-slate-900 font-black italic uppercase text-xs md:text-sm shadow-[6px_6px_0_0_#6D4AFF] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 ${selectedEventDetails.totalRemainingStock === 0 || isEnded
                          ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                          : "bg-amber-400 text-slate-900 hover:bg-[#6D4AFF] hover:text-white"
                          }`}
                      >
                        {selectedEventDetails.totalRemainingStock === 0 ? "SOLD OUT" : isEnded ? "EVENT SELESAI" : "BELI TIKET"}
                        <ChevronRight size={18} strokeWidth={4} />
                      </button>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}