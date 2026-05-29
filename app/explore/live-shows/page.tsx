"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Ticket as TicketIcon, Search, Calendar, MapPin, User,
  PlusCircle, Filter, Music, Sparkles, Heart as HeartIcon, X, AlertOctagon, Star, Loader2, ArrowLeft, Zap
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast-brutal";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const poppins_font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  end_date: string | null;
  location: string;
  category: string;
  image_url: string;
  price: number;
  max_buy: number;
  totalRemainingStock: number;
  hasVoucher?: boolean;
  isBoosted?: boolean;
  totalReviews?: number;
  averageRating?: number;
  profiles?: {
    full_name: string;
    eo_name: string | null;
    avatar_url: string | null;
    verification_status: string;
  };
}

function CategoryBadge({ category }: { category: string }) {
  const isMusik = category?.toUpperCase() === "MUSIK";
  return (
    <span
      className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border-2 border-slate-900 shadow-[2px_2px_0_0_#000] ${
        isMusik ? "bg-[var(--primary-color)] text-slate-950" : "bg-[#00F0FF] text-black"
      }`}
    >
      {category || "GENERAL"}
    </span>
  );
}

function TiltEventCard({
  event,
  idx,
  today,
  likedEvents,
  toggleLike,
  openDetailModal,
  formatRupiah
}: {
  event: Event;
  idx: number;
  today: string;
  likedEvents: Set<string>;
  toggleLike: (id: string) => void;
  openDetailModal: (event: Event) => void;
  formatRupiah: (val: number) => string;
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
      className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 border-4 border-slate-900 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col group cursor-pointer relative"
      onClick={() => openDetailModal(event)}
    >
      <div className="relative h-64 border-b-4 border-slate-900 dark:border-zinc-800 overflow-hidden bg-black">
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-full object-contain opacity-90 group-hover:scale-105 transition-all duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 items-start">
          <CategoryBadge category={event.category} />
          {event.isBoosted && (
            <span className="bg-red-500 text-white border-2 border-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] flex items-center gap-1 animate-pulse">
              <Zap size={10} fill="white" strokeWidth={3} /> SPONSORED
            </span>
          )}
        </div>
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
          <HeartIcon size={16} strokeWidth={3} fill={isLiked ? "white" : "none"} />
        </motion.button>
      </div>
      <div className="p-6 sm:p-8 space-y-6 flex-grow flex flex-col text-left">
        <div className="flex items-center gap-2">
          {event.totalReviews && event.totalReviews > 0 ? (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 border-2 border-slate-900 px-2.5 py-1 text-[9px] font-black uppercase shadow-[2px_2px_0_0_#000] italic">
              <Star size={10} fill="black" strokeWidth={3} className="animate-pulse" />
              ★ {event.averageRating?.toFixed(1) || "5.0"} ({event.totalReviews} ULASAN)
            </div>
          ) : (
            <span className="text-[8px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 border border-slate-200 dark:border-zinc-700">★ BELUM ADA RATINGS</span>
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
        <div className="border-t-3 border-dashed border-slate-200 dark:border-zinc-800 pt-5 flex items-center justify-between mt-auto">
          <div>
            <p className="text-[8px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">HARGA MULAI</p>
            <p className="text-xl font-black italic tracking-tighter text-[var(--primary-color)] dark:text-zinc-100 leading-none">
              {formatRupiah(event.price || 0)}
            </p>
          </div>
          <span className="text-[9px] font-black uppercase italic text-amber-500 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded">DETAIL →</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function LiveShowsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [likedEvents, setLikedEvents] = useState<Set<string>>(new Set());
  const [selectedEventDetails, setSelectedEventDetails] = useState<Event | null>(null);
  const [eventTiers, setEventTiers] = useState<any[]>([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState(false);
  const [eventReviews, setEventReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [visibleCount, setVisibleCount] = useState(18);
  const [boostedEvents, setBoostedEvents] = useState<Event[]>([]);
  const [currentBoostedIdx, setCurrentBoostedIdx] = useState(0);

  const [userProfile, setUserProfile] = useState<any>(null);
  // ─── Q&A STATES ───
  const [qaList, setQaList] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState("");

  const today = new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0") + "-" + String(new Date().getDate()).padStart(2, "0");

  useEffect(() => {
    fetchEvents();
    fetchWishlist();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles").select("*").eq("id", session.user.id).single();
      if (profile) {
        setUserProfile(profile);
      }
    } catch (err) {
      console.warn("Gagal mengambil profil user:", err);
    }
  };

  useEffect(() => {
    if (boostedEvents.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBoostedIdx((prev) => (prev + 1) % boostedEvents.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [boostedEvents]);

  const fetchEvents = async () => {
    try {
      let boostedEventIds: string[] = [];
      try {
        const { data: boostedSetting } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "boosted_events")
          .single();
        if (boostedSetting && Array.isArray(boostedSetting.value)) {
          const activeBoosts = boostedSetting.value.filter((b: any) => {
            return new Date(b.boosted_until) >= new Date();
          });
          boostedEventIds = activeBoosts.map((b: any) => b.event_id);
        }
      } catch (err) {
        console.warn("Gagal mengambil boosted_events:", err);
      }

      const { data: eventData, error } = await supabase
        .from("events")
        .select("*, ticket_categories(stock), reviews(rating), vouchers(*), profiles:organizer_id(full_name, eo_name, verification_status)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedEvents = (eventData || []).map((ev: any) => {
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
        const isBoosted = boostedEventIds.includes(ev.id);
        return {
          ...ev,
          totalRemainingStock,
          averageRating: avgRating,
          totalReviews,
          hasVoucher,
          isBoosted
        };
      });

      // Boosted banner: only ACTIVE (not ended) boosted events
      const boosted = formattedEvents.filter((e: any) => {
        const isEnded = e.end_date ? e.end_date < today : e.date < today;
        return e.isBoosted && !isEnded;
      });
      setBoostedEvents(boosted);

      // Sort by boosted first, then newest
      formattedEvents.sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return 0;
      });

      setEvents(formattedEvents);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWishlist = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: wishlist } = await supabase.from("wishlist").select("event_id").eq("user_id", session.user.id);
    if (wishlist) {
      setLikedEvents(new Set(wishlist.map(w => w.event_id)));
    }
  };

  const toggleLike = async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    const isLiked = likedEvents.has(eventId);
    setLikedEvents((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(eventId);
      else next.add(eventId);
      return next;
    });

    if (isLiked) {
      await supabase.from("wishlist").delete().eq("user_id", session.user.id).eq("event_id", eventId);
      toast("Dihapus dari wishlist! 💔", "success", 1500);
    } else {
      await supabase.from("wishlist").insert({ user_id: session.user.id, event_id: eventId });
      toast("Ditambahkan ke wishlist! ❤️", "success", 1500);
    }
  };

  const openDetailModal = async (event: Event) => {
    setSelectedEventDetails(event);
    setIsLoadingTiers(true);
    setIsLoadingReviews(true);

    // Load Q&A from localStorage
    const savedQa = localStorage.getItem(`tiketin_qa_${event.id}`);
    if (savedQa) {
      setQaList(JSON.parse(savedQa));
    } else {
      const defaultQa = [
        {
          id: "q1",
          question: "Apakah event ini ramah kursi roda?",
          answer: "Halo! Ya, kami menyediakan ramp khusus dan area khusus ramah kursi roda di dekat Front of House (FOH).",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          userName: "Ahmad"
        },
        {
          id: "q2",
          question: "Jam berapa open gate hari H?",
          answer: "Open gate akan dibuka mulai pukul 15:00 WIB, sedangkan show utama baru dimulai jam 19:30 WIB.",
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
          userName: "Clara"
        }
      ];
      setQaList(defaultQa);
      localStorage.setItem(`tiketin_qa_${event.id}`, JSON.stringify(defaultQa));
    }

    try {
      const { data: tiers } = await supabase.from("ticket_categories").select("*").eq("event_id", event.id).order("price", { ascending: true });
      if (tiers) setEventTiers(tiers);

      const { data: reviews } = await supabase
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
            full_name,
            avatar_url
          )
        `)
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (reviews) setEventReviews(reviews);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTiers(false);
      setIsLoadingReviews(false);
    }
  };

  const handleSendQuestion = () => {
    if (!newQuestion.trim()) return;
    if (!selectedEventDetails) return;

    const newQaItem = {
      id: `q-${Date.now()}`,
      question: newQuestion.trim(),
      answer: null,
      createdAt: new Date().toISOString(),
      userName: userProfile?.full_name?.split(" ")[0] || "Kamu"
    };

    const updated = [...qaList, newQaItem];
    setQaList(updated);
    localStorage.setItem(`tiketin_qa_${selectedEventDetails.id}`, JSON.stringify(updated));
    setNewQuestion("");

    // Trigger simulated response after 2 seconds
    setTimeout(() => {
      const lowerQ = newQaItem.question.toLowerCase();
      let answer = "Halo! Pertanyaan Anda telah kami terima. Tim promotor kami akan segera memverifikasinya. Stay tuned!";
      
      if (lowerQ.includes("kursi roda") || lowerQ.includes("difabel") || lowerQ.includes("wheelchair")) {
        answer = "Halo! Ya, event ini ramah kursi roda. Kami menyediakan jalur ramp khusus di gate masuk serta tribun/area khusus penonton disabilitas di section Festival B.";
      } else if (lowerQ.includes("pintu") || lowerQ.includes("gate") || lowerQ.includes("jam") || lowerQ.includes("buka")) {
        answer = "Halo! Pintu gerbang utama (open gate) akan dibuka mulai pukul 15.00 WIB. Kami menyarankan untuk datang lebih awal untuk menghindari antrean panjang.";
      } else if (lowerQ.includes("refund") || lowerQ.includes("batal") || lowerQ.includes("kembali")) {
        answer = "Halo! Tiket yang sudah dibeli bersifat final dan tidak dapat direfund atau dibatalkan. Namun, e-ticket dapat dipindahtangankan secara aman dengan menyerahkan surat kuasa.";
      } else if (lowerQ.includes("makan") || lowerQ.includes("minum") || lowerQ.includes("f&b")) {
        answer = "Halo! Penonton dilarang membawa makanan dan minuman dari luar venue. Namun, jangan khawatir karena kami menyediakan puluhan booth kuliner resmi di dalam area konser.";
      } else if (lowerQ.includes("kamera") || lowerQ.includes("foto") || lowerQ.includes("sler") || lowerQ.includes("dslr")) {
        answer = "Halo! Kamera profesional seperti DSLR, Mirrorless, atau Go-Pro tidak diperkenankan masuk tanpa kartu pers resmi. Kamera handphone diperbolehkan.";
      }

      setQaList((prevList) => {
        const listCopy = prevList.map((item) => {
          if (item.id === newQaItem.id) {
            return { ...item, answer };
          }
          return item;
        });
        localStorage.setItem(`tiketin_qa_${selectedEventDetails.id}`, JSON.stringify(listCopy));
        return listCopy;
      });
      
      toast("Promotor membalas pertanyaanmu! 💬", "success");
    }, 2000);
  };

  // Filter out events that ended more than 2 days ago
  let processedEvents = events.filter((event) => {
    const eventDateVal = event.end_date || event.date;
    let endedMoreThan2DaysAgo = false;
    if (eventDateVal) {
      const eventDate = new Date(eventDateVal);
      eventDate.setHours(0, 0, 0, 0);
      const limitDate = new Date(eventDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      const todayDate = new Date(today);
      todayDate.setHours(0, 0, 0, 0);
      endedMoreThan2DaysAgo = todayDate > limitDate;
    }

    if (endedMoreThan2DaysAgo) return false;

    // Filter live only (not ended yet)
    const isEnded = event.end_date ? event.end_date < today : event.date < today;
    if (isEnded) return false;

    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      event.title?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query)
    );
    const matchesCategory =
      selectedCategory === "ALL" ||
      event.category?.toUpperCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (sortBy === "PRICE_ASC") processedEvents.sort((a, b) => a.price - b.price);
  else if (sortBy === "PRICE_DESC") processedEvents.sort((a, b) => b.price - a.price);
  else if (sortBy === "TRENDING") processedEvents.sort((a, b) => a.totalRemainingStock - b.totalRemainingStock);

  const visibleEvents = processedEvents.slice(0, visibleCount);

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  return (
    <div className={`min-h-screen bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 p-6 sm:p-12 ${poppins_font.className} relative overflow-hidden brutal-grid noise`}>
      {/* HEADER BAR */}
      <nav className="w-full max-w-7xl mx-auto flex items-center justify-between mb-16 relative z-30">
        <button
          onClick={() => router.push("/explore")}
          className="bg-white dark:bg-zinc-900 border-4 border-slate-900 dark:border-zinc-700 px-5 py-3 font-black italic uppercase text-xs md:text-sm shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] flex items-center gap-2 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer rounded-xl"
        >
          <ArrowLeft size={16} strokeWidth={3} /> KEMBALI
        </button>
        <span className="text-2xl font-black italic -skew-x-12 tracking-tighter uppercase dark:text-white">TIKETIN STAGES</span>
      </nav>

      <main className="max-w-7xl mx-auto space-y-12 relative z-30">
        {/* PAGE TITLE */}
        <div className="text-left space-y-3">
          <div className="bg-[var(--primary-color)] text-black border-4 border-slate-900 px-4 py-2 font-black uppercase text-[10px] shadow-[4px_4px_0_0_#000] -rotate-2 inline-flex items-center gap-2 mb-2 italic">
            ⚡ LIVE SHOWS & UPCOMING
          </div>
          <h1 className="text-4xl md:text-7xl font-black -skew-x-12 italic uppercase leading-none tracking-tighter drop-shadow-[5px_5px_0_var(--primary-color)]">
            STAGE YANG <span className="text-[var(--primary-color)] drop-shadow-[4px_4px_0_#000]">SEDANG BERJALAN.</span>
          </h1>
        </div>

        {/* ── BOOSTED BANNER CAROUSEL ── */}
        {boostedEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Label */}
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-[var(--primary-color)] border-4 border-slate-900 px-3 py-1.5 shadow-[3px_3px_0_0_#000] -rotate-1 inline-flex items-center gap-2">
                <Zap size={12} fill="black" strokeWidth={3} />
                <span className="font-black uppercase text-[9px] tracking-widest text-black italic">BOOSTED STAGES</span>
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest">{boostedEvents.length} EVENT UNGGULAN</span>
            </div>

            {/* Wide landscape banner — left: content | right: full image */}
            <div
              className="relative w-full h-[220px] md:h-[260px] border-4 border-slate-900 dark:border-zinc-700 overflow-hidden cursor-pointer shadow-[6px_6px_0_0_var(--primary-color),12px_12px_0_0_#000] group bg-slate-950 flex"
              onClick={() => openDetailModal(boostedEvents[currentBoostedIdx])}
            >
              {/* LEFT: content */}
              <div className="relative z-10 flex flex-col justify-end p-6 md:p-8 w-[58%] md:w-[52%] shrink-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentBoostedIdx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-2"
                  >
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-[var(--primary-color)] text-black border-2 border-slate-900 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] inline-flex items-center gap-1">
                        <Zap size={9} fill="black" strokeWidth={3} /> SPONSORED
                      </span>
                      <span className="bg-zinc-900 text-[var(--primary-color)] border border-[var(--primary-color)]/40 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest">
                        {boostedEvents[currentBoostedIdx]?.category}
                      </span>
                      {boostedEvents[currentBoostedIdx]?.totalRemainingStock > 0 &&
                       boostedEvents[currentBoostedIdx]?.totalRemainingStock <= 20 && (
                        <span className="bg-red-500 text-white text-[8px] font-black uppercase px-2 py-1 border border-slate-900 animate-pulse">
                          🔥 Sisa {boostedEvents[currentBoostedIdx]?.totalRemainingStock}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-lg md:text-2xl font-black italic uppercase text-white tracking-tighter -skew-x-6 drop-shadow-[2px_2px_0_rgba(0,0,0,0.9)] leading-tight line-clamp-2">
                      {boostedEvents[currentBoostedIdx]?.title}
                    </h2>

                    {/* Meta */}
                    <div className="flex flex-col gap-1 text-[10px] font-black uppercase text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={10} strokeWidth={3} className="text-[var(--primary-color)] shrink-0" />
                        {boostedEvents[currentBoostedIdx]?.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={10} strokeWidth={3} className="text-[var(--primary-color)] shrink-0" />
                        <span className="line-clamp-1">{boostedEvents[currentBoostedIdx]?.location}</span>
                      </span>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-base font-black italic text-[var(--primary-color)]">
                        {formatRupiah(boostedEvents[currentBoostedIdx]?.price || 0)}
                      </span>
                      <span className="bg-white text-black border-2 border-slate-900 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest shadow-[3px_3px_0_0_var(--primary-color)] group-hover:bg-[var(--primary-color)] group-hover:shadow-none transition-all">
                        BELI TIKET →
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Dot indicators */}
                {boostedEvents.length > 1 && (
                  <div className="flex items-center gap-2 mt-4">
                    {boostedEvents.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setCurrentBoostedIdx(i); }}
                        className={`transition-all duration-300 border border-white/30 ${
                          i === currentBoostedIdx
                            ? 'w-6 h-2 bg-[var(--primary-color)]'
                            : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: full poster image, not cropped */}
              <div className="relative flex-1 h-full bg-zinc-900 border-l-4 border-[var(--primary-color)]/20 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentBoostedIdx}
                    src={boostedEvents[currentBoostedIdx]?.image_url}
                    alt={boostedEvents[currentBoostedIdx]?.title}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 0.9, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </AnimatePresence>
                {/* Fade left edge to blend with content panel */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent" />
            </div>
          </div>
        </motion.div>
      )}

        {/* SEARCH AND FILTER BAR */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-center justify-between border-t-4 border-slate-900 dark:border-zinc-700 pt-8">
          <div className="relative flex-grow max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-zinc-500 z-10" strokeWidth={3} />
            <input
              placeholder="CARI KONSER AKTIF..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(12);
              }}
              className="h-14 w-full pl-12 pr-12 border-4 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 font-black text-sm uppercase outline-none -skew-x-2 focus:bg-amber-50/50 dark:focus:bg-zinc-800 transition-all rounded-xl shadow-[4px_4px_0_0_var(--primary-color)] focus:shadow-[0_0_30px_-5px_var(--primary-color)]"
            />
          </div>
          
          <div className="flex gap-4 items-center">
            {["ALL", "MUSIK", "TEATER"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 border-4 border-slate-900 dark:border-zinc-700 font-black italic uppercase text-xs md:text-sm rounded-xl transition-all ${
                  selectedCategory === cat
                    ? "bg-[var(--primary-color)] text-slate-900 shadow-[3px_3px_0_0_#000]"
                    : "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 shadow-[3px_3px_0_0_var(--primary-color)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* EVENT GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 py-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[450px] border-4 border-slate-900 rounded-2xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : visibleEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 py-12">
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
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center border-8 border-black shadow-[8px_8px_0_0_#000] bg-white dark:bg-zinc-900 rounded-3xl flex flex-col items-center gap-4">
            <p className="text-4xl font-black italic uppercase text-slate-300">STAGE BELUM DITEMUKAN</p>
          </div>
        )}

        {visibleCount < processedEvents.length && (
          <div className="flex justify-center pt-8">
            <button
              onClick={() => setVisibleCount((prev) => prev + 18)}
              className="bg-white border-4 border-slate-900 px-12 py-6 font-black italic uppercase text-sm shadow-[8px_8px_0_0_var(--primary-color)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all flex items-center gap-3 cursor-pointer"
            >
              <PlusCircle size={20} /> LOAD MORE SHOWS ({processedEvents.length - visibleCount} LAGI)
            </button>
          </div>
        )}

        {/* ── ALTERNATIVE DESIGN EO CTA STRIP ── */}
        <div className="w-full border-6 border-slate-900 bg-white dark:bg-zinc-900 p-8 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color)] flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl mt-32 text-left">
          <div className="space-y-2">
            <span className="bg-[var(--primary-color)] text-black border-2 border-black px-3 py-1 font-black text-[9px] uppercase tracking-wider italic shadow-[2px_2px_0_0_#000]">EO PARTNERSHIP</span>
            <h3 className="text-2xl md:text-3xl font-black italic uppercase text-slate-900 dark:text-zinc-50 -skew-x-3 leading-none">Tertarik untuk menjual tiket konser Anda disini?</h3>
            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Daftar sekarang dan kelola event Anda dengan dashboard modern.</p>
          </div>
          <button
            onClick={() => router.push("/explore/ajukan")}
            className="bg-[var(--primary-color)] text-slate-900 hover:bg-slate-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-slate-900 border-4 border-slate-900 px-8 py-5 font-black uppercase text-xs md:text-sm shadow-[6px_6px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all -skew-x-6 cursor-pointer shrink-0"
          >
            AJUKAN EVENT SEKARANG ⚡
          </button>
        </div>
      </main>

      {/* DETAILED EVENT MODAL RE-USED FROM HOME */}
      <AnimatePresence>
        {selectedEventDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
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
              className="bg-[#FCFAF1] dark:bg-zinc-950 border-8 border-slate-900 dark:border-zinc-700 shadow-[12px_12px_0_0_#000] dark:shadow-[12px_12px_0_0_var(--primary-color)] w-full max-w-5xl relative z-10 overflow-hidden flex flex-col md:flex-row my-4 md:my-8 max-h-[calc(100vh-2rem)] text-slate-900 dark:text-zinc-50 rounded-3xl"
            >
              {/* IMAGE POSTER */}
              <div className="w-full md:w-[38%] relative h-64 md:h-auto md:min-h-[500px] shrink-0 border-b-8 md:border-b-0 md:border-r-8 border-slate-900 dark:border-zinc-700 bg-[#FCFAF1] dark:bg-zinc-950 p-6 flex items-center justify-center">
                <div className="relative w-full h-full border-4 border-slate-900 dark:border-zinc-700 bg-zinc-950 shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_var(--primary-color)] flex items-center justify-center overflow-hidden group/poster rounded-2xl">
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 -rotate-3 bg-[var(--primary-color)] text-black border-2 border-slate-900 px-3.5 py-0.5 text-[8.5px] font-black uppercase tracking-widest z-30 shadow-[2px_2px_0_0_#000] select-none pointer-events-none italic">
                    ★ LIVE STAGE ★
                  </div>
                  <img
                    src={selectedEventDetails.image_url}
                    alt={selectedEventDetails.title}
                    className="w-full h-full object-contain group-hover/poster:scale-105 transition-transform duration-700 opacity-95"
                  />
                </div>
                <div className="absolute top-10 left-10 z-20">
                  <CategoryBadge category={selectedEventDetails.category} />
                </div>
              </div>

              {/* DETAILS */}
              <div className="w-full md:w-[62%] p-8 md:p-10 flex flex-col justify-between overflow-y-auto flex-1 md:max-h-[680px] text-left relative bg-white dark:bg-zinc-900 brutal-scroll">
                <button
                  onClick={() => setSelectedEventDetails(null)}
                  className="absolute top-4 right-4 z-30 h-10 w-10 bg-white dark:bg-zinc-900 hover:bg-red-500 hover:text-white border-4 border-slate-900 dark:border-zinc-700 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_var(--primary-color)] flex items-center justify-center font-black transition-all hover:rotate-90 rounded-lg"
                >
                  <X size={20} className="text-slate-900 dark:text-zinc-50" />
                </button>
                <div className="space-y-6">
                  <h2 className="text-3xl font-black italic uppercase -skew-x-6 tracking-tighter leading-tight break-words mt-4 pr-10">{selectedEventDetails.title}</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#FCFAF1] dark:bg-zinc-800 border-3 border-slate-900 p-4 shadow-[4px_4px_0_0_#FF3B30] rounded-xl flex items-start gap-3">
                      <Calendar size={18} className="text-red-500 shrink-0" />
                      <div>
                        <p className="text-[8px] font-black text-slate-400">TANGGAL</p>
                        <p className="text-[10px] font-black text-slate-900 dark:text-zinc-100">{selectedEventDetails.date}</p>
                      </div>
                    </div>
                    <div className="bg-[#FCFAF1] dark:bg-zinc-800 border-3 border-slate-900 p-4 shadow-[4px_4px_0_0_var(--primary-color)] rounded-xl flex items-start gap-3">
                      <MapPin size={18} className="text-[var(--primary-color)] shrink-0" />
                      <div>
                        <p className="text-[8px] font-black text-slate-400">LOKASI</p>
                        <p className="text-[10px] font-black text-slate-900 dark:text-zinc-100 line-clamp-3">{selectedEventDetails.location}</p>
                      </div>
                    </div>
                    <div className="bg-[#FCFAF1] dark:bg-zinc-800 border-3 border-slate-900 p-4 shadow-[4px_4px_0_0_#FBBF24] rounded-xl flex items-start gap-3">
                      <User size={18} className="text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[8px] font-black text-slate-400">EO</p>
                        <p className="text-[10px] font-black text-slate-900 dark:text-zinc-100 line-clamp-2">{selectedEventDetails.profiles ? (selectedEventDetails.profiles.eo_name || selectedEventDetails.profiles.full_name) : "Organizer"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Deskripsi Event</p>
                    <div className="border-4 border-slate-900 dark:border-zinc-700 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_var(--primary-color)] rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                      {/* macOS console header bar */}
                      <div className="bg-slate-100 dark:bg-zinc-800 border-b-3 border-slate-900 dark:border-zinc-700 px-4 py-2 flex items-center justify-between">
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] border border-slate-900" />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FFCC00] border border-slate-900" />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#4CD964] border border-slate-900" />
                        </div>
                        <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">show_description.txt</span>
                      </div>
                      
                      {/* Description Text Content */}
                      <div className="p-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-zinc-300 max-h-[120px] overflow-y-auto brutal-scroll leading-relaxed whitespace-pre-line text-left bg-slate-50/50 dark:bg-zinc-900/50">
                        {selectedEventDetails.description ? selectedEventDetails.description.replace(/--seating-enabled:\d+x\d+--/g, "").trim() : "Tidak ada deskripsi untuk event ini."}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Kategori Tiket</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[220px] overflow-y-auto brutal-scroll pr-1">
                      {eventTiers.map((tier) => (
                        <div key={tier.id} className="bg-[#FCFAF1] dark:bg-zinc-800 border-3 border-slate-900 p-4 flex flex-col justify-between shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] relative rounded-xl">
                          <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-6 rounded-r-full bg-white dark:bg-zinc-900 border-r-3 border-y-3 border-slate-900 z-10" />
                          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-6 rounded-l-full bg-white dark:bg-zinc-900 border-l-3 border-y-3 border-slate-900 z-10" />
                          <div className="text-left relative z-20">
                            <p className="font-black text-sm uppercase italic text-slate-900 dark:text-zinc-50">{tier.name}</p>
                            <p className="text-[9px] text-slate-400">{tier.description}</p>
                            <p className="text-[9px] text-red-500 font-black uppercase mt-1">Sisa: {tier.stock} Tiket</p>
                          </div>
                          <div className="text-left border-t-2 border-dashed border-slate-300 dark:border-zinc-700 pt-3 mt-3 flex justify-between z-20">
                            <p className="font-black text-base text-[var(--primary-color)] dark:text-white italic">{formatRupiah(tier.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ─── TANYA PROMOTOR / Q&A BOX ─── */}
                  <div className="space-y-4 border-t-4 border-slate-900 dark:border-zinc-700 pt-5">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tanya Promotor / Q&A Box</p>
                    
                    {/* Q&A Feed */}
                    <div className="space-y-3 max-h-[220px] overflow-y-auto brutal-scroll pr-1">
                      {qaList.length > 0 ? (
                        qaList.map((qa) => (
                          <div key={qa.id} className="bg-white dark:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-700 p-3 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_var(--primary-color)] space-y-2 text-xs">
                            <div className="flex justify-between items-center text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                              <span>Tanya: {qa.userName || "User"}</span>
                              <span>{new Date(qa.createdAt).toLocaleDateString("id-ID")}</span>
                            </div>
                            <p className="font-bold text-slate-900 dark:text-zinc-50">Q: {qa.question}</p>
                            {qa.answer ? (
                              <div className="bg-slate-50 dark:bg-zinc-800 border border-dashed border-[var(--primary-color)] p-2 text-slate-700 dark:text-zinc-300 rounded mt-1 relative pl-6">
                                <div className="absolute left-2.5 top-3.5 w-1.5 h-1.5 rounded-full bg-[var(--primary-color)] animate-pulse" />
                                <p className="text-[8px] font-black text-[var(--primary-color)] uppercase tracking-widest mb-1">PROMOTOR REPLY:</p>
                                <p className="font-semibold text-[11px]">{qa.answer}</p>
                              </div>
                            ) : (
                              <div className="text-[9px] italic text-amber-500 font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                                ⏳ Menunggu balasan promotor...
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs font-bold text-slate-400 italic py-2">Belum ada pertanyaan. Tanyakan sesuatu ke promotor!</p>
                      )}
                    </div>

                    {/* Question Input Form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ada pertanyaan untuk EO? (misal: open gate, kursi roda...)"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendQuestion();
                        }}
                        className="flex-grow h-11 px-3 border-3 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 text-xs font-bold outline-none rounded-xl"
                      />
                      <button
                        onClick={handleSendQuestion}
                        className="bg-[var(--primary-color)] text-slate-900 border-3 border-slate-900 dark:border-zinc-700 px-4 h-11 text-xs font-black uppercase shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#fff] hover:translate-y-0.5 hover:shadow-none transition-all rounded-xl shrink-0 cursor-pointer"
                      >
                        KIRIM
                      </button>
                    </div>
                  </div>

                </div>

                <div className="pt-6 border-t-4 border-slate-900 flex justify-between items-center mt-6">
                  <div>
                    <p className="text-[8px] font-black text-slate-400">Harga Mulai Dari</p>
                    <p className="text-3xl font-black text-[var(--primary-color)] italic leading-none">{formatRupiah(selectedEventDetails.price)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEventDetails(null);
                      router.push(`/explore/checkout/${selectedEventDetails.id}`);
                    }}
                    className="py-4 px-8 border-4 border-slate-900 bg-[var(--primary-color)] text-slate-950 font-black uppercase text-xs md:text-sm shadow-[6px_6px_0_0_var(--primary-color)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all rounded-xl"
                  >
                    BELI TIKET
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
