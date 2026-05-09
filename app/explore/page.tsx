"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Search, MapPin, Calendar, LogOut, Ticket,
  ChevronRight, Sparkles, User, LayoutDashboard,
  Heart as HeartIcon,
  Loader2, Mail, Phone, Camera, Send, Play,
  Trophy, MessageSquare, PlusCircle, Zap, TrendingUp,
  Ticket as TicketIcon, ShieldCheck, ArrowUp, Star,
  Users, Globe, Music, Receipt // ⚡ ICON RECEIPT DITAMBAHIN
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
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

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// ─── Marquee Component ───────────────────────────────────────────────────────
function MarqueeTicker() {
  const items = [
    "🎸 KONSER TERBARU UDAH LIVE",
    "⚡ TIKET LIMITED — GASKEUN SEKARANG",
    "🎭 TEATER EKSKLUSIF HADIR DI TIKETIN",
    "🔥 500+ EVENT TERSEDIA BULAN INI",
    "🏆 #1 PLATFORM TIKET KONSER INDONESIA",
    "✨ DAFTARIN EVENT LO DI TIKETIN",
  ];
  const repeated = [...items, ...items];

  return (
    <div className="w-full bg-amber-400 border-b-4 border-slate-900 overflow-hidden h-10 flex items-center">
      <motion.div
        className="flex gap-16 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="font-black uppercase italic text-[11px] tracking-widest text-slate-900 shrink-0">
            {item}
          </span>
        ))}
      </motion.div>
    </div>
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

// ─── Dot Grid BG ─────────────────────────────────────────────────────────────
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

// ─── Category Badge ───────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    MUSIK:  { bg: "bg-[#6D4AFF] text-white",  text: "MUSIK"  },
    TEATER: { bg: "bg-emerald-400 text-slate-900", text: "TEATER" },
  };
  const style = map[category?.toUpperCase()] ?? { bg: "bg-slate-200 text-slate-700", text: category ?? "EVENT" };
  return (
    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border-2 border-slate-900 ${style.bg}`}>
      {style.text}
    </span>
  );
}

const poppins_font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export default function ExplorePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroEvents, setHeroEvents] = useState<any[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [likedEvents, setLikedEvents] = useState<Set<string>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  useEffect(() => {
    setMounted(true);
    fetchData();

    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    if (profile) setUserProfile(profile);

    const { data: eventData } = await supabase
      .from("events").select("*").eq("status", "approved").order("created_at", { ascending: false });

    if (eventData) {
      setEvents(eventData);
      setHeroEvents(eventData.slice(0, 3));
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  
  const toggleLike = (id: string) => {
    setLikedEvents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ⚡ FUNGSI CHECKOUT DENGAN VALIDASI KYC KTP
  const handleBookNow = (eventId: string) => {
    if (userProfile?.verification_status !== "approved") {
      alert("⚠️ HOLD UP MAN! Lo harus lolos verifikasi KTP dulu sebelum bisa war tiket!");
      router.push("/verify"); // Arahin ke halaman verifikasi KTP
      return;
    }
    router.push(`/explore/checkout/${eventId}`);
  };

  const filteredEvents = events.filter((event) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      event.title?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query)
    );
    const matchesCategory = selectedCategory === "ALL" || event.category?.toUpperCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  const isNewEvent = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) < 7;
  };

  if (!mounted || isLoading) return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-white gap-4 ${poppins_font.className}`}>
      <motion.div
        animate={{ rotate: [0, -12, 12, -12, 0], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="h-20 w-20 bg-[#6D4AFF] border-4 border-slate-900 flex items-center justify-center shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
      >
        <Zap className="text-amber-400" size={40} strokeWidth={3} />
      </motion.div>
      <p className="font-black italic text-2xl text-slate-900 uppercase -skew-x-6 tracking-tighter">
        LOADING TIKETIN<motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1 }}>...</motion.span>
      </p>
    </div>
  );

  return (
    <div className={`min-h-screen bg-white text-slate-900 ${poppins_font.className}`}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <nav className="w-full bg-white border-b-4 border-slate-900 sticky top-0 z-[50] shadow-[0_4px_0_0_rgba(0,0,0,1)] h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/explore" className="flex items-center gap-2 group">
            <div className="h-10 w-10 bg-[#6D4AFF] border-4 border-slate-900 -rotate-12 flex items-center justify-center group-hover:rotate-0 transition-transform shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <Zap className="text-amber-400" size={24} strokeWidth={3} />
            </div>
            <span className="text-2xl font-black italic -skew-x-12 tracking-tighter uppercase">TIKETIN</span>
          </Link>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group p-1 pr-3 rounded-2xl transition-all border-2 border-transparent hover:border-slate-900">
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
                <DropdownMenuItem onClick={() => router.push("/verify")} className="focus:bg-amber-400 font-black italic uppercase text-xs py-3 cursor-pointer"><ShieldCheck className="mr-2 h-4 w-4" /> {userProfile?.verification_status === "approved" ? "Status KTP (Lolos)" : "Verifikasi KTP"}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/tickets")} className="focus:bg-blue-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer"><TicketIcon className="mr-2 h-4 w-4" /> Tiket Saya</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/complaints")} className="focus:bg-emerald-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer"><MessageSquare className="mr-2 h-4 w-4" /> Pengaduan</DropdownMenuItem>
                {/* ⚡ MENU RIWAYAT PEMBAYARAN DITAMBAH DI SINI */}
                <DropdownMenuItem onClick={() => router.push("explore/history")} className="focus:bg-purple-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer"><Receipt className="mr-2 h-4 w-4" /> Riwayat Pembayaran</DropdownMenuItem>
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

      {/* ── MARQUEE TICKER ──────────────────────────────────────────────────── */}
      <MarqueeTicker />

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 pt-16 pb-24">

        {/* HERO TEXT + SEARCH */}
        <header className="mb-16 space-y-8 flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-6xl md:text-8xl font-black -skew-x-12 italic uppercase leading-[0.75] tracking-tighter">
              YO,{" "}
              <span className="relative inline-block">
                <span className="relative z-10">{userProfile?.full_name?.split(" ")[0].toUpperCase()}!</span>
                {/* Yellow underline brush stroke */}
                <span className="absolute bottom-0 left-0 right-0 h-4 bg-amber-400 -z-0 -skew-x-6 opacity-70" />
              </span>
            </h1>
          </motion.div>

          <motion.div
            className="relative w-full max-w-2xl"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" strokeWidth={3} />
            <input
              placeholder="CARI KONSER (lokasi dan artis)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-20 w-full pl-16 pr-6 border-4 border-slate-900 bg-white font-black text-lg uppercase shadow-[6px_6px_0_0_#6D4AFF,12px_12px_0_0_#000,18px_18px_0_0_#FBBF24] outline-none -skew-x-3 focus:bg-slate-50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400 hover:text-red-500 text-lg uppercase"
              >✕</button>
            )}
          </motion.div>
        </header>

        {/* ── STATS BAR ─────────────────────────────────────────────────────── */}
        {!searchQuery && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="grid grid-cols-2 gap-0 border-4 border-slate-900 mb-20 shadow-[6px_6px_0_0_#6D4AFF,12px_12px_0_0_#000,18px_18px_0_0_#FBBF24] overflow-hidden"
          >
            {[
              { icon: <Music size={28} strokeWidth={3} className="text-[#6D4AFF]" />, label: "TOTAL EVENT", value: events.length || 500, suffix: "+" },
              { icon: <Users size={28} strokeWidth={3} className="text-emerald-500" />, label: "HAPPY FANS", value: 12000, suffix: "+" },
            ].map((stat, i) => (
              <div
                key={i}
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
              </div>
            ))}
          </motion.section>
        )}

        {/* ── HERO CAROUSEL ─────────────────────────────────────────────────── */}
        {!searchQuery && (
          <section className="mb-32">
            <div className="relative w-full h-[450px] border-8 border-slate-900 overflow-hidden bg-slate-900 shadow-[8px_8px_0_0_#6D4AFF,16px_16px_0_0_#000,24px_24px_0_0_#FBBF24] mb-8">
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

              {/* Content */}
              <div className="relative z-20 h-full p-12 flex flex-col justify-end items-start text-left">
                <div className="bg-amber-400 border-4 border-slate-900 px-4 py-2 font-black uppercase text-[10px] shadow-[4px_4px_0_0_rgba(0,0,0,1)] -rotate-2 mb-6 italic inline-flex items-center gap-2">
                  <Sparkles size={14} /> RECOMMENDED
                </div>

                <AnimatePresence mode="wait">
                  <motion.h2
                    key={currentHeroIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-6xl md:text-8xl font-black italic uppercase text-white tracking-tighter drop-shadow-[4px_4px_0_rgba(0,0,0,1)] -skew-x-6 mb-4"
                  >
                    {heroEvents[currentHeroIndex]?.title || "LIVE NOW"}
                  </motion.h2>
                </AnimatePresence>

                {/* Price tag on hero */}
                {heroEvents[currentHeroIndex]?.price && (
                  <motion.div
                    key={`price-${currentHeroIndex}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8 flex items-center gap-4"
                  >
                    <span className="text-purple-200 font-black uppercase text-[10px] tracking-widest">Mulai dari</span>
                    <span className="bg-[#6D4AFF] border-4 border-white px-4 py-2 font-black text-white text-lg italic -skew-x-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
                      {formatRupiah(heroEvents[currentHeroIndex].price)}
                    </span>
                  </motion.div>
                )}

                <button 
                  onClick={() => {
                    const activeHeroId = heroEvents[currentHeroIndex]?.id;
                    if (activeHeroId) handleBookNow(activeHeroId);
                  }}
                  className="bg-white border-4 border-slate-900 px-10 py-5 font-black uppercase text-sm shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:bg-amber-400 transition-all -skew-x-6"
                >
                  BOOK NOW
                </button>
              </div>

              {/* Carousel Dots */}
              <div className="absolute bottom-6 right-6 z-30 flex gap-3">
                {heroEvents.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentHeroIndex(i)}
                    className={`transition-all border-2 border-white ${i === currentHeroIndex ? "w-8 h-3 bg-amber-400" : "w-3 h-3 bg-white/50 hover:bg-white"}`}
                  />
                ))}
              </div>

              {/* Slide counter badge */}
              <div className="absolute top-6 right-6 z-30 bg-black/60 border-2 border-white px-3 py-1 font-black text-white text-[10px] uppercase tracking-widest">
                {String(currentHeroIndex + 1).padStart(2, "0")} / {String(heroEvents.length).padStart(2, "0")}
              </div>
            </div>
          </section>
        )}

        {/* ── FILTER + TITLE SECTION ────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center space-y-16 mb-24 mt-40 pt-10">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-red-500" size={40} strokeWidth={4} />
              <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter -skew-x-6 text-center">
                {searchQuery ? `SEARCHING: "${searchQuery}"` : "NEARBY STAGES"}
              </h2>
            </div>
            <div className="h-2 w-40 bg-slate-900 -skew-x-12 mt-2" />

            {/* Event count badge */}
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-slate-900 text-white px-4 py-2 font-black text-xs uppercase italic tracking-widest border-4 border-slate-900 shadow-[4px_4px_0_0_rgba(109,74,255,1)]">
                {filteredEvents.length} EVENT DITEMUKAN
              </span>
            </div>
          </div>

          {/* FILTER CHIPS (DIPAKSA SAMA RATA PAKE GRID) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 w-full max-w-4xl mx-auto pt-6 px-4">
            {["ALL", "MUSIK", "TEATER"].map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`group relative w-full h-16 md:h-20 flex items-center justify-center border-4 border-slate-900 font-black italic uppercase transition-all shadow-[4px_4px_0_0_#6D4AFF,8px_8px_0_0_#000,12px_12px_0_0_#FBBF24] hover:shadow-[2px_2px_0_0_#6D4AFF,4px_4px_0_0_#000,6px_6px_0_0_#FBBF24] hover:translate-x-1 hover:translate-y-1 ${
                    isActive
                      ? "bg-[#6D4AFF] text-white shadow-none translate-x-3 translate-y-3"
                      : "bg-white text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {cat === "MUSIK" && <Zap size={24} strokeWidth={3} className={isActive ? "text-amber-400" : "text-slate-900"} />}
                    {cat === "TEATER" && <Sparkles size={24} strokeWidth={3} className={isActive ? "text-amber-300" : "text-slate-900"} />}
                    {cat === "ALL" && <Star size={24} strokeWidth={3} className={isActive ? "text-amber-300" : "text-slate-900"} />}
                    <span className="tracking-[0.15em] text-base md:text-lg">{cat}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── EVENT GRID ────────────────────────────────────────────────────── */}
        <div className="mt-12">
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-24">
              {filteredEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: (idx % 3) * 0.1 }}
                  className="bg-white border-4 border-slate-900 shadow-[6px_6px_0_0_#6D4AFF,12px_12px_0_0_#000,18px_18px_0_0_#FBBF24] hover:shadow-[8px_8px_0_0_#6D4AFF,16px_16px_0_0_#000,24px_24px_0_0_#FBBF24] hover:-translate-x-1 hover:-translate-y-1 transition-all flex flex-col group"
                >
                  {/* Image */}
                  <div className="relative h-64 border-b-4 border-slate-900 overflow-hidden">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Category badge */}
                    <div className="absolute top-4 left-4">
                      <CategoryBadge category={event.category} />
                    </div>

                    {/* NEW sticker */}
                    {event.created_at && isNewEvent(event.created_at) && (
                      <div className="absolute top-4 left-4 mt-8">
                        <span className="bg-red-500 text-white px-2 py-1 text-[9px] font-black uppercase border-2 border-slate-900 -rotate-2 inline-block italic shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                          NEW!
                        </span>
                      </div>
                    )}

                    {/* Like button */}
                    <button
                      onClick={() => toggleLike(event.id)}
                      className={`absolute top-4 right-4 p-3 border-4 border-slate-900 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all ${
                        likedEvents.has(event.id)
                          ? "bg-red-500 text-white"
                          : "bg-white hover:bg-red-500 hover:text-white"
                      }`}
                    >
                      <HeartIcon size={18} strokeWidth={3} fill={likedEvents.has(event.id) ? "white" : "none"} />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-8 space-y-6 flex-grow flex flex-col text-left">
                    <h3 className="text-2xl font-black italic uppercase -skew-x-6 tracking-tighter line-clamp-1">
                      {event.title}
                    </h3>

                    <div className="space-y-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-red-500 shrink-0" /> {event.date}
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin size={18} className="text-[#6D4AFF] shrink-0" /> {event.location}
                      </div>
                    </div>

                    {/* Divider + price + CTA */}
                    <div className="pt-6 border-t-4 border-slate-900 flex items-center justify-between mt-auto">
                      <div className="text-left">
                        <p className="text-[8px] font-black text-slate-400 mb-1 uppercase italic">From</p>
                        <p className="text-2xl font-black text-[#6D4AFF] italic tracking-tighter leading-none">
                          {formatRupiah(event.price)}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleBookNow(event.id)}
                        className="h-14 w-14 bg-slate-900 text-white flex items-center justify-center border-4 border-slate-900 shadow-[4px_4px_0_0_rgba(109,74,255,1)] rotate-12 hover:rotate-0 hover:bg-[#6D4AFF] transition-all"
                      >
                        <ChevronRight size={24} strokeWidth={4} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center border-8 border-dashed border-slate-200 mb-24 relative overflow-hidden"
            >
              <DotGrid className="opacity-20" />
              <p className="text-6xl mb-4">🎸</p>
              <p className="text-4xl font-black italic uppercase text-slate-300">STAGE GAK NEMU, MAN!</p>
              <p className="text-slate-400 font-bold italic mt-2 uppercase">Coba cari kategori atau artis lain.</p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedCategory("ALL"); }}
                className="mt-8 px-8 py-4 bg-[#6D4AFF] text-white border-4 border-slate-900 font-black uppercase italic text-sm shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:bg-amber-400 hover:text-slate-900 transition-all -skew-x-6"
              >
                RESET FILTER
              </button>
            </motion.div>
          )}
        </div>

        {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
        {!searchQuery && (
          <section className="bg-gradient-to-br from-[#6D4AFF] to-[#553C9A] border-8 border-slate-900 p-12 md:p-20 text-white shadow-[12px_12px_0_0_#6D4AFF,24px_24px_0_0_#000,36px_36px_0_0_#FBBF24] relative overflow-hidden mb-20 text-left">
            <DotGrid className="opacity-10" />
            <div className="relative z-10 space-y-8 max-w-xl">
              <div className="bg-white border-4 border-slate-900 px-4 py-2 font-black uppercase text-[10px] text-slate-900 -rotate-2 inline-block italic">
                EVENT MANAGER
              </div>
              <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.8] -skew-x-6">
                PUNYA EVENT? <br /> JUAL DI SINI.
              </h2>
              <p className="text-purple-100 font-bold text-lg italic opacity-90">
                Kelola tiket konsermu sendiri dengan sistem dashboard profesional Tiketin.
              </p>
              <Button asChild className="bg-amber-400 border-4 border-slate-900 text-slate-900 px-12 py-8 font-black uppercase text-sm shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:bg-white transition-all -skew-x-6 h-auto">
                <Link href="/dashboard/upgrade-eo">DAFTAR EO SEKARANG</Link>
              </Button>
            </div>
            <PlusCircle size={250} className="absolute right-[-50px] bottom-[-50px] text-white/10 rotate-12" strokeWidth={4} />
          </section>
        )}
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-[#6D4AFF] text-white pt-24 pb-12 px-6 sm:px-12 border-t-8 border-slate-900 text-left">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
            <div className="space-y-8 text-left">
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 bg-amber-400 border-4 border-white -rotate-12 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <Zap size={28} strokeWidth={3} className="text-slate-900" />
                </div>
                <span className="text-3xl font-black italic -skew-x-12 tracking-tighter uppercase">TIKETIN</span>
              </div>
              <p className="text-purple-100 text-sm font-bold italic uppercase">Platform war tiket konser paling gila di Indonesia.</p>
            </div>
            <div className="space-y-6">
              <h4 className="font-black uppercase tracking-widest text-[10px] text-amber-300 italic underline underline-offset-8 text-left">Explore</h4>
              <ul className="space-y-3 text-purple-50 text-sm font-bold italic uppercase text-left">
                <li className="hover:text-amber-300 cursor-pointer">Trending Now</li>
                <li className="hover:text-amber-300 cursor-pointer">Featured Festivals</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-black uppercase tracking-widest text-[10px] text-amber-300 italic underline underline-offset-8 text-left">Support</h4>
              <ul className="space-y-4 text-purple-50 text-sm font-bold text-left uppercase">
                <li onClick={() => router.push("/explore/complaints")} className="flex items-center gap-3 italic hover:text-amber-300 cursor-pointer"><MessageSquare size={16} /> PUSAT PENGADUAN</li>
                {/* ⚡ MENU RIWAYAT PEMBAYARAN DITAMBAH DI BAWAH PENGADUAN FOOTER */}
                <li onClick={() => router.push("explore/history")} className="flex items-center gap-3 italic hover:text-amber-300 cursor-pointer"><Receipt size={16} /> RIWAYAT PEMBAYARAN</li>
                <li className="flex items-center gap-3 italic"><Mail size={16} /> HELLO@TIKETIN.COM</li>
                <li className="flex items-center gap-3 italic"><Phone size={16} /> +62 812 3456 789</li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t-2 border-white/20 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-200">© 2026 TIKETIN. ALL STAGES PROTECTED.</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300 italic -skew-x-12">BUILT BY IKMAN @ UPI</p>
          </div>
        </div>
      </footer>

      {/* ── SCROLL TO TOP ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 right-8 z-50 h-14 w-14 bg-amber-400 border-4 border-slate-900 shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-center justify-center hover:bg-[#6D4AFF] hover:text-white transition-colors group"
          >
            <ArrowUp size={24} strokeWidth={4} className="group-hover:text-white text-slate-900" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}