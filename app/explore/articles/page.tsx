"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import {
  BookOpen, PenLine, ArrowLeft, Loader2, MapPin, Music, Theater,
  Search, X, ChevronRight, User, AlertCircle, Send, XCircle,
  Calendar, Bookmark, BookmarkCheck, Ticket, Sparkles, Camera,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useToast } from "@/components/ui/toast-brutal";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// ─── MARQUEE STYLES ──────────────────────────────────────────────────────────
const ARTICLE_MARQUEE_STYLE = `
  @keyframes article-marquee {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-50%); }
  }
  .animate-article-marquee {
    display: flex;
    animation: article-marquee 22s linear infinite;
  }
  .animate-article-marquee:hover {
    animation-play-state: paused;
  }
`;

type ArticleCategory = "BANDUNG" | "MUSIK" | "TEATER";

interface Article {
  id: string;
  title: string;
  content: string;
  category: ArticleCategory;
  author_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  thumbnail_url?: string | null;
  excerpt?: string | null;
  linked_event_ids?: string[] | null;  // array of event UUIDs
  profiles?: {
    full_name: string;
    avatar_url?: string | null;
  } | null;
}

interface MatchedEvent {
  id: string;
  title: string;
  date: string;
  end_date?: string | null;
  location: string;
  price: number;
  image_url: string;
}

// ─── REACTION TYPES ──────────────────────────────────────────────────────────
type ReactionType = "PANAS" | "APRESIASI" | "MANTAP";

const REACTION_CONFIG: Record<ReactionType, { emoji: string; label: string; color: string; bg: string }> = {
  PANAS:     { emoji: "🔥", label: "PANAS",     color: "text-orange-600", bg: "bg-orange-400" },
  APRESIASI: { emoji: "🎭", label: "APRESIASI", color: "text-pink-600",   bg: "bg-pink-400" },
  MANTAP:    { emoji: "⚡", label: "MANTAP",    color: "text-yellow-600", bg: "bg-yellow-400" },
};

const REACTION_TYPES: ReactionType[] = ["PANAS", "APRESIASI", "MANTAP"];

const CATEGORY_CONFIG: Record<ArticleCategory, { label: string; color: string; bg: string; icon: React.ElementType; desc: string; decal: string }> = {
  BANDUNG: {
    label: "Bandung",
    color: "text-amber-600",
    bg: "bg-amber-400",
    icon: MapPin,
    desc: "Cerita, wisata, kuliner & budaya Kota Kembang",
    decal: "🏛️",
  },
  MUSIK: {
    label: "Musik",
    color: "text-[#6D4AFF]",
    bg: "bg-[#6D4AFF]",
    icon: Music,
    desc: "Band, lagu, artis & scene musik Indonesia",
    decal: "🎸",
  },
  TEATER: {
    label: "Teater",
    color: "text-emerald-600",
    bg: "bg-emerald-400",
    icon: Theater,
    desc: "Pertunjukan, naskah & dunia panggung Indonesia",
    decal: "🎭",
  },
};

const CATEGORIES: ArticleCategory[] = ["BANDUNG", "MUSIK", "TEATER"];

// ─── LOCAL STORAGE HELPERS ───────────────────────────────────────────────────
function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("tiketin_bookmarks") || "[]");
  } catch { return []; }
}
function setBookmarks(ids: string[]) {
  localStorage.setItem("tiketin_bookmarks", JSON.stringify(ids));
}
function getReactions(): Record<string, ReactionType[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("tiketin_reactions") || "{}");
  } catch { return {}; }
}
function setReactionsStore(data: Record<string, ReactionType[]>) {
  localStorage.setItem("tiketin_reactions", JSON.stringify(data));
}

export function parseArticleContent(content: string) {
  const match = content.match(/^\[COVER_IMAGE\]:\s*([^\n]+)/);
  if (match) {
    const coverImageUrl = match[1].trim();
    const cleanContent = content.replace(/^\[COVER_IMAGE\]:[^\n]*\n*/, '').trim();
    return { coverImageUrl, cleanContent };
  }
  return { coverImageUrl: null, cleanContent: content };
}

// ─── CATEGORY BADGE ──────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: ArticleCategory }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase italic border-2 border-black ${cfg.bg} text-white`}>
      <cfg.icon size={10} strokeWidth={3} />
      {cfg.label}
    </span>
  );
}

// ─── MARQUEE TICKER ──────────────────────────────────────────────────────────
function ArticleMarquee() {
  const items = [
    "✍️ TULIS ARTIKELMU SEKARANG",
    "⚡ DAPATKAN POIN REWARD",
    "🌟 BACA SPEKTAKULER BANDUNG, MUSIK & TEATER",
    "🔥 ARTIKEL TERPOPULER MINGGU INI",
    "🎫 CEK EVENT TERBARU DI TIKETIN",
    "🎭 CERITA PANGGUNG DARI KOMUNITAS",
  ];
  const repeated = [...items, ...items];
  return (
    <div className="w-full bg-[#6D4AFF] border-b-4 border-black overflow-hidden h-9 flex items-center relative z-10">
      <div className="animate-article-marquee gap-12 whitespace-nowrap">
        {repeated.map((item, i) => (
          <span key={i} className="font-black uppercase italic text-[10px] tracking-widest text-white shrink-0">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── PARTICLE SPLASH ─────────────────────────────────────────────────────────
function ParticleSplash({ emoji, onDone }: { emoji: string; onDone: () => void }) {
  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const distance = 40 + Math.random() * 30;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      rotate: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.8,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-50 flex items-center justify-center">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: p.scale, rotate: p.rotate }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          onAnimationComplete={p.id === 0 ? onDone : undefined}
          className="absolute text-lg"
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ─── 3D TILT ARTICLE CARD ────────────────────────────────────────────────────
function ArticleCard({
  article,
  onClick,
  isBookmarked,
  onToggleBookmark,
}: {
  article: Article;
  onClick: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}) {
  const cfg = CATEGORY_CONFIG[article.category];
  const date = new Date(article.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const { coverImageUrl, cleanContent } = parseArticleContent(article.content);
  const preview = cleanContent.slice(0, 180).replace(/\n/g, " ") + "…";

  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });
  const shadowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [10, 2]), { stiffness: 300, damping: 30 });
  const shadowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, 2]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.article
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-zinc-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)] cursor-pointer transition-colors group overflow-visible relative"
    >
      {/* Retro Decal - appears on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 12 }}
            exit={{ opacity: 0, scale: 0, rotate: -30 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="absolute -top-4 -right-4 z-20 text-4xl select-none pointer-events-none"
            style={{ filter: "drop-shadow(2px 2px 0 #000)" }}
          >
            {cfg.decal}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bookmark Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleBookmark(article.id); }}
        className={`absolute top-3 right-3 z-10 p-1.5 border-2 border-black transition-all ${
          isBookmarked
            ? "bg-amber-400 text-black shadow-[2px_2px_0_0_#000]"
            : "bg-white dark:bg-zinc-800 text-slate-400 shadow-[2px_2px_0_0_#000] hover:bg-amber-100"
        }`}
      >
        {isBookmarked ? <BookmarkCheck size={14} strokeWidth={3} /> : <Bookmark size={14} strokeWidth={3} />}
      </button>

      {/* Cover Image or Accent */}
      {coverImageUrl ? (
        <div className="h-40 w-full border-b-4 border-black overflow-hidden relative" onClick={onClick}>
          <img src={coverImageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute top-2 left-2">
            <CategoryBadge category={article.category} />
          </div>
        </div>
      ) : (
        <>
          <div className={`h-2 w-full ${cfg.bg}`} />
          <div className="px-6 pt-4" onClick={onClick}>
            <CategoryBadge category={article.category} />
          </div>
        </>
      )}
      <div className="p-6" onClick={onClick}>
        {coverImageUrl && <div className="h-2" />}
        <h2 className="text-lg font-black italic uppercase leading-tight text-slate-900 dark:text-zinc-50 group-hover:text-[#6D4AFF] transition-colors line-clamp-2">
          {article.title}
        </h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-3">
          {preview}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-[#6D4AFF] border-2 border-black flex items-center justify-center">
              <User size={12} className="text-white" strokeWidth={3} />
            </div>
            <span className="text-[10px] font-black italic uppercase text-slate-500 dark:text-zinc-400">
              {article.profiles?.full_name || "Anonim"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
            <Calendar size={10} />
            {date}
          </div>
        </div>
      </div>
      <div className="px-6 pb-4 flex justify-end" onClick={onClick}>
        <span className="text-[10px] font-black italic uppercase text-[#6D4AFF] flex items-center gap-1 group-hover:underline">
          Baca Selengkapnya <ChevronRight size={12} strokeWidth={3} />
        </span>
      </div>
    </motion.article>
  );
}

// ─── SMART EVENT LINK WIDGET ─────────────────────────────────────────────────
function EventLinkWidget({ events }: { events: MatchedEvent[] }) {
  if (events.length === 0) return null;
  const today = new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0") + "-" + String(new Date().getDate()).padStart(2, "0");

  return (
    <div className="mt-8 border-t-4 border-dashed border-[#6D4AFF]/40 pt-6">
      <div className="inline-flex items-center gap-2 bg-[#6D4AFF] text-white px-3 py-1 text-[9px] font-black uppercase italic tracking-widest border-2 border-black mb-4">
        <Ticket size={12} strokeWidth={3} /> Event Terkait di Tiketin
      </div>
      <div className="grid gap-3">
        {events.map((ev) => {
          const isEnded = ev.end_date ? ev.end_date < today : ev.date < today;
          return (
            <Link
              key={ev.id}
              href={`/explore/checkout/${ev.id}`}
              className="flex items-center gap-4 bg-amber-50 dark:bg-zinc-800 border-4 border-black p-4 shadow-[4px_4px_0_0_#6D4AFF] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all group/ev"
            >
              {ev.image_url && (
                <div className="w-16 h-16 border-2 border-black overflow-hidden shrink-0">
                  <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black italic uppercase text-slate-900 dark:text-zinc-50 truncate group-hover/ev:text-[#6D4AFF] transition-colors">
                  {ev.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(ev.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                    <MapPin size={10} />
                    {ev.location}
                  </span>
                </div>
              </div>
              <div className={`shrink-0 text-white px-3 py-2 border-2 border-black font-black italic uppercase text-[10px] flex items-center gap-1 ${
                isEnded ? "bg-red-500" : "bg-[#6D4AFF]"
              }`}>
                {isEnded ? "Event Selesai ❌" : "Beli Tiket 🎫"}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── REACTION BAR ────────────────────────────────────────────────────────────
function ReactionBar({ articleId }: { articleId: string }) {
  const [userReactions, setUserReactions] = useState<ReactionType[]>([]);
  const [splashReaction, setSplashReaction] = useState<ReactionType | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [reactionsCount, setReactionsCount] = useState<Record<ReactionType, number>>({
    PANAS: 0,
    APRESIASI: 0,
    MANTAP: 0
  });

  useEffect(() => {
    const fetchUserAndReactions = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id || null;
        setUserId(currentUserId);

        const url = `/api/articles/reactions?article_id=${articleId}` + (currentUserId ? `&user_id=${currentUserId}` : "");
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
          setReactionsCount(json.reactions);
          if (currentUserId) {
            setUserReactions(json.user_reactions);
          }
        }
      } catch (err) {
        console.error("Gagal memuat reaksi dari server:", err);
      }
    };

    fetchUserAndReactions();
  }, [articleId]);

  const toggle = async (type: ReactionType) => {
    if (!userId) {
      alert("Silakan login terlebih dahulu untuk memberikan reaksi pada artikel.");
      return;
    }

    if (!userReactions.includes(type)) {
      setSplashReaction(type);
    }

    try {
      const res = await fetch('/api/articles/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: articleId,
          user_id: userId,
          reaction_type: type
        })
      });
      const json = await res.json();
      if (json.success) {
        setReactionsCount(json.reactions);
        setUserReactions(json.user_reactions);
      }
    } catch (err) {
      console.error("Gagal menyimpan reaksi ke server:", err);
    }
  };

  return (
    <div className="mt-6 pt-4 border-t-2 border-slate-200 dark:border-zinc-700">
      <p className="text-[10px] font-black italic uppercase text-slate-400 dark:text-zinc-500 mb-3">
        Reaksi Kamu
      </p>
      <div className="flex gap-2 flex-wrap">
        {REACTION_TYPES.map((type) => {
          const cfg = REACTION_CONFIG[type];
          const active = userReactions.includes(type);
          return (
            <div key={type} className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => toggle(type)}
                className={`px-4 py-2 border-4 border-black font-black italic uppercase text-[11px] transition-all flex items-center gap-2 ${
                  active
                    ? `${cfg.bg} text-black shadow-none translate-x-0.5 translate-y-0.5`
                    : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                }`}
              >
                <span className="text-base">{cfg.emoji}</span>
                {cfg.label} ({reactionsCount[type] || 0})
              </motion.button>
              <AnimatePresence>
                {splashReaction === type && (
                  <ParticleSplash
                    emoji={cfg.emoji}
                    onDone={() => setSplashReaction(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MODAL BACA ARTIKEL ──────────────────────────────────────────────────────
function ArticleModal({
  article,
  onClose,
  matchedEvents,
  isBookmarked,
  onToggleBookmark,
}: {
  article: Article;
  onClose: () => void;
  matchedEvents: MatchedEvent[];
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}) {
  const { toast } = useToast();
  const cfg = CATEGORY_CONFIG[article.category];
  const date = new Date(article.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const { coverImageUrl, cleanContent } = parseArticleContent(article.content);

  // Feature 4: Report states
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("Spam / Promosi Berlebihan");
  const [customReason, setCustomReason] = useState("");
  const [reporting, setReporting] = useState(false);

  // Increment view count on mount
  useEffect(() => {
    if (!article.id) return;
    const recordView = async () => {
      try {
        await fetch("/api/articles/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article_id: article.id })
        });
      } catch (err) {
        console.error("Gagal mencatat kunjungan:", err);
      }
    };
    recordView();
  }, [article.id]);

  const handleReport = async () => {
    setReporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast("Silakan login terlebih dahulu untuk melaporkan artikel.", "error");
        return;
      }

      const finalReason = reportReason === "Lainnya" ? customReason.trim() : reportReason;
      if (!finalReason) {
        toast("Alasan pelaporan wajib diisi.", "warning");
        return;
      }

      // Insert report into complaints table
      const { error } = await supabase.from("complaints").insert({
        user_id: session.user.id,
        title: `[LAPORAN ARTIKEL] ${article.title}`,
        message: `ID Artikel: ${article.id}\nPenulis: ${article.profiles?.full_name || 'Anonim'}\nAlasan Pelaporan: ${finalReason}`,
        status: "pending",
      });

      if (error) throw error;

      toast("🚨 Laporan Anda berhasil dikirim ke admin untuk ditinjau.", "success");
      setShowReportForm(false);
      setCustomReason("");
    } catch (err: any) {
      toast("Gagal mengirim laporan: " + err.message, "error");
    } finally {
      setReporting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-zinc-700 shadow-[12px_12px_0_0_#6D4AFF] max-w-3xl w-full max-h-[90vh] overflow-y-auto relative"
        >
          {/* Report Form Overlay */}
          {showReportForm && (
            <div className="absolute inset-0 bg-white/95 dark:bg-zinc-900/95 z-[110] p-8 flex flex-col justify-center text-left">
              <div className="max-w-md mx-auto w-full space-y-4">
                <div className="flex items-center gap-2 text-red-500">
                  <ShieldAlert size={24} strokeWidth={3} />
                  <h3 className="text-lg font-black uppercase italic">Laporkan Artikel</h3>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                  Mengapa Anda melaporkan artikel ini? Laporan Anda akan ditinjau oleh admin Tiketin.
                </p>

                <div className="space-y-3">
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full border-4 border-black bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 p-3 text-sm font-bold focus:outline-none"
                  >
                    <option value="Spam / Promosi Berlebihan">Spam / Promosi Berlebihan</option>
                    <option value="SARA / Kebencian / Kebohongan">SARA / Kebencian / Kebohongan</option>
                    <option value="Plagiarisme / Konten Curian">Plagiarisme / Konten Curian</option>
                    <option value="Kategori Tidak Sesuai">Kategori Tidak Sesuai</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>

                  {reportReason === "Lainnya" && (
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      rows={3}
                      placeholder="Jelaskan alasan pelaporan secara rinci..."
                      className="w-full border-4 border-red-400 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 p-3 text-sm font-medium focus:outline-none resize-none"
                      required
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="flex-1 py-3 border-4 border-black font-black italic uppercase text-xs bg-white dark:bg-zinc-800 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleReport}
                    disabled={reporting || (reportReason === "Lainnya" && !customReason.trim())}
                    className="flex-1 py-3 border-4 border-black font-black italic uppercase text-xs bg-red-500 text-white shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer font-bold"
                  >
                    {reporting ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} strokeWidth={3} />}
                    Kirim Laporan
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className={`h-3 w-full ${cfg.bg}`} />
          <div className="p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <CategoryBadge category={article.category} />
              <div className="flex items-center gap-2">
                {/* Laporkan Artikel */}
                <button
                  onClick={() => setShowReportForm(true)}
                  className="p-1.5 border-2 border-black bg-white dark:bg-zinc-800 text-red-500 shadow-[2px_2px_0_0_#EF4444] hover:bg-red-50 transition-all cursor-pointer"
                  title="Laporkan Artikel"
                >
                  <ShieldAlert size={16} strokeWidth={3} />
                </button>
                {/* Bookmark in modal */}
                <button
                  onClick={() => onToggleBookmark(article.id)}
                  className={`p-1.5 border-2 border-black transition-all ${
                    isBookmarked
                      ? "bg-amber-400 text-black shadow-[2px_2px_0_0_#000]"
                      : "bg-white dark:bg-zinc-800 text-slate-400 shadow-[2px_2px_0_0_#000] hover:bg-amber-100"
                  }`}
                  title={isBookmarked ? "Hapus dari Simpanan" : "Simpan Artikel"}
                >
                  {isBookmarked ? <BookmarkCheck size={16} strokeWidth={3} /> : <Bookmark size={16} strokeWidth={3} />}
                </button>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-zinc-50 transition-colors">
                  <XCircle size={24} strokeWidth={3} />
                </button>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black italic uppercase leading-tight text-slate-900 dark:text-zinc-50 mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-slate-200 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#6D4AFF] border-2 border-black flex items-center justify-center">
                  <User size={14} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-xs font-black italic uppercase text-slate-600 dark:text-zinc-400">
                  {article.profiles?.full_name || "Anonim"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 font-bold">
                <Calendar size={12} />
                {date}
              </div>
            </div>
            {coverImageUrl && (
              <div className="w-full h-64 border-4 border-black shadow-[4px_4px_0_0_#000] overflow-hidden mb-6">
                <img src={coverImageUrl} alt={article.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="prose prose-sm max-w-none text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {cleanContent}
            </div>

            {/* ── Reaction Bar ──────────────────────────────────────────────── */}
            <ReactionBar articleId={article.id} />

            {/* ── Smart Event Link Widget ───────────────────────────────────── */}
            <EventLinkWidget events={matchedEvents} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── FORM TULIS ARTIKEL ──────────────────────────────────────────────────────
function WriteArticleModal({ onClose, authorId, authorName, onSuccess, activeEvents }: { onClose: () => void; authorId: string; authorName: string; onSuccess: () => void; activeEvents: MatchedEvent[] }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ArticleCategory>("BANDUNG");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── State untuk multi-select event picker ───────────────────────────────────
  const [linkedEventIds, setLinkedEventIds] = useState<string[]>([]);
  const [eventSearch, setEventSearch] = useState("");
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  const filteredEvents = activeEvents
    .filter((ev) => ev.title.toLowerCase().includes(eventSearch.toLowerCase()))
    .slice(0, 8);

  const selectedEvents = activeEvents.filter((ev) => linkedEventIds.includes(ev.id));

  const toggleEvent = (ev: MatchedEvent) => {
    setLinkedEventIds((prev) =>
      prev.includes(ev.id) ? prev.filter((id) => id !== ev.id) : [...prev, ev.id]
    );
  };

  const removeEvent = (id: string) => {
    setLinkedEventIds((prev) => prev.filter((eid) => eid !== id));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("File harus berupa gambar!", "error"); return; }
    if (file.size > 2 * 1024 * 1024) { toast("Ukuran gambar maksimal 2MB!", "error"); return; }
    setCoverImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { toast("Judul dan isi artikel wajib diisi!", "error"); return; }
    if (content.trim().length < 100) { toast("Konten artikel minimal 100 karakter.", "warning"); return; }
    setSubmitting(true);
    try {
      let uploadedImageUrl = "";
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `article-cover-${authorId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, coverImage);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
        uploadedImageUrl = publicUrl;
      }

      let finalContent = excerpt.trim()
        ? `**Ringkasan:** ${excerpt.trim()}\n\n${content.trim()}`
        : content.trim();
      if (uploadedImageUrl) finalContent = `[COVER_IMAGE]: ${uploadedImageUrl}\n\n${finalContent}`;

      const { error } = await supabase.from("articles").insert({
        title: title.trim(),
        category,
        content: finalContent,
        author_id: authorId,
        author_name: authorName,
        status: "pending",
        ...(linkedEventIds.length > 0 ? { linked_event_ids: linkedEventIds } : {}),
      });
      if (error) throw error;
      toast("🎉 Artikel berhasil dikirim! Menunggu review admin.", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast(err?.message || "Gagal mengirim artikel.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-zinc-700 shadow-[12px_12px_0_0_#6D4AFF] max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="bg-[#6D4AFF] p-6 border-b-4 border-black">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PenLine size={24} className="text-amber-400" strokeWidth={3} />
                <h2 className="text-xl font-black italic uppercase text-white tracking-tight">Tulis Artikel</h2>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                <XCircle size={24} strokeWidth={3} />
              </button>
            </div>
            <p className="text-white/70 text-xs font-bold mt-2 uppercase tracking-wider">Artikel kamu akan direview oleh admin sebelum dipublikasikan</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Kategori */}
            <div>
              <label className="text-[10px] font-black uppercase italic text-slate-500 dark:text-zinc-400 block mb-2">Kategori *</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  return (
                    <button type="button" key={cat} onClick={() => setCategory(cat)}
                      className={`flex flex-col items-center gap-1 p-3 border-4 border-black font-black italic uppercase text-xs transition-all ${
                        category === cat
                          ? `${cfg.bg} text-white shadow-none translate-x-0.5 translate-y-0.5`
                          : "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                      }`}
                    >
                      <cfg.icon size={18} strokeWidth={3} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Judul */}
            <div>
              <label className="text-[10px] font-black uppercase italic text-slate-500 dark:text-zinc-400 block mb-2">Judul Artikel *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                maxLength={200} placeholder="Tulis judul yang menarik..."
                className="w-full border-4 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-bold p-3 text-sm focus:outline-none focus:border-[#6D4AFF] transition-colors"
                required
              />
              <p className="text-right text-[9px] text-slate-400 mt-1">{title.length}/200</p>
            </div>

            {/* ── Multi-select Event Terkait ───────────────────────────────────── */}
            <div>
              <label className="text-[10px] font-black uppercase italic text-slate-500 dark:text-zinc-400 block mb-2">
                <span className="flex items-center gap-1">
                  <Ticket size={10} strokeWidth={3} />
                  Event Terkait (Opsional) {linkedEventIds.length > 0 && <span className="bg-[#6D4AFF] text-white px-1.5 py-0.5 text-[8px] font-black">{linkedEventIds.length}</span>}
                </span>
              </label>

              {/* Search input (selalu tampil) */}
              <div className="relative">
                <div className="flex items-center border-4 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <Search size={14} className="ml-3 text-slate-400 shrink-0" strokeWidth={3} />
                  <input
                    type="text"
                    value={eventSearch}
                    onChange={(e) => { setEventSearch(e.target.value); setShowEventDropdown(true); }}
                    onFocus={() => setShowEventDropdown(true)}
                    placeholder="Cari dan pilih event yang dibahas..."
                    className="flex-1 p-3 text-sm font-medium bg-transparent text-slate-900 dark:text-zinc-100 focus:outline-none"
                  />
                  {eventSearch && (
                    <button type="button" onClick={() => { setEventSearch(""); setShowEventDropdown(false); }} className="mr-2 text-slate-400 hover:text-slate-700">
                      <X size={14} strokeWidth={3} />
                    </button>
                  )}
                </div>

                {/* Dropdown */}
                {showEventDropdown && eventSearch && (
                  <div className="absolute z-50 top-full left-0 right-0 border-4 border-black dark:border-zinc-700 border-t-0 bg-white dark:bg-zinc-900 shadow-[4px_4px_0_0_#6D4AFF] max-h-52 overflow-y-auto">
                    {filteredEvents.length === 0 ? (
                      <div className="p-3 text-xs font-bold text-slate-400 italic uppercase text-center">Event tidak ditemukan</div>
                    ) : (
                      filteredEvents.map((ev) => {
                        const isSelected = linkedEventIds.includes(ev.id);
                        const isPast = new Date(ev.date) < new Date();
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => toggleEvent(ev)}
                            className={`w-full flex items-center gap-3 p-3 transition-colors text-left border-b-2 border-slate-100 dark:border-zinc-800 last:border-0 ${
                              isSelected
                                ? "bg-[#6D4AFF]/10 dark:bg-[#6D4AFF]/20"
                                : "hover:bg-slate-50 dark:hover:bg-zinc-800"
                            }`}
                          >
                            {/* Checkbox visual */}
                            <div className={`shrink-0 w-5 h-5 border-2 border-black flex items-center justify-center transition-colors ${
                              isSelected ? "bg-[#6D4AFF]" : "bg-white dark:bg-zinc-800"
                            }`}>
                              {isSelected && <span className="text-white text-[10px] font-black">✓</span>}
                            </div>

                            {ev.image_url && (
                              <div className="w-9 h-9 border-2 border-black overflow-hidden shrink-0">
                                <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-black uppercase italic text-slate-900 dark:text-zinc-50 truncate">{ev.title}</p>
                                {isPast && (
                                  <span className="shrink-0 text-[8px] font-black uppercase bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400 px-1.5 py-0.5 border border-slate-300 dark:border-zinc-600">SELESAI</span>
                                )}
                              </div>
                              <p className="text-[9px] text-slate-400 dark:text-zinc-500">
                                {new Date(ev.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} · {ev.location}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Selected event chips */}
              {selectedEvents.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-1.5 bg-[#6D4AFF]/10 dark:bg-[#6D4AFF]/20 border-2 border-[#6D4AFF] px-2 py-1.5 max-w-full">
                      {ev.image_url && (
                        <div className="w-5 h-5 border border-black overflow-hidden shrink-0">
                          <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span className="text-[10px] font-black uppercase italic text-[#6D4AFF] truncate max-w-[160px]">{ev.title}</span>
                      <button
                        type="button"
                        onClick={() => removeEvent(ev.id)}
                        className="shrink-0 text-[#6D4AFF] hover:text-red-500 transition-colors"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-2 italic">
                Pilih satu atau lebih event yang dibahas. Artikel akan menampilkan link ke event tersebut.
              </p>
            </div>

            {/* Ringkasan */}
            <div>
              <label className="text-[10px] font-black uppercase italic text-slate-500 dark:text-zinc-400 block mb-2">Ringkasan (Opsional)</label>
              <input
                type="text"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                maxLength={250}
                placeholder="Ringkasan singkat artikel (tampil di kartu)..."
                className="w-full border-4 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-bold p-3 text-sm focus:outline-none focus:border-[#6D4AFF] transition-colors"
              />
            </div>

            {/* Foto Cover */}
            <div>
              <label className="text-[10px] font-black uppercase italic text-slate-500 dark:text-zinc-400 block mb-2">Foto Cover Artikel (Opsional)</label>
              <div 
                className="border-4 border-dashed border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors relative" 
                onClick={() => imageInputRef.current?.click()}
              >
                {previewUrl ? (
                  <div className="relative inline-block w-full h-40 border-2 border-black overflow-hidden bg-slate-100">
                    <img src={previewUrl} alt="Preview Cover" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoverImage(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="py-4 space-y-2">
                    <Camera className="mx-auto text-[#6D4AFF] dark:text-[#8b6eff]" size={28} strokeWidth={3} />
                    <p className="text-xs font-black uppercase italic text-slate-700 dark:text-zinc-300">Pilih Foto Utama</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-normal max-w-sm mx-auto">
                      Format: JPG, PNG (Maks. 2MB). Rekomendasi: Lanskap 16:9, min. 800x450 piksel untuk tampilan optimal.
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* Konten */}
            <div>
              <label className="text-[10px] font-black uppercase italic text-slate-500 dark:text-zinc-400 block mb-2">Isi Artikel * (min. 100 karakter)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder="Tulis konten artikelmu di sini..."
                className="w-full border-4 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-medium p-3 text-sm focus:outline-none focus:border-[#6D4AFF] transition-colors resize-none leading-relaxed"
                required
              />
              <p className="text-right text-[9px] text-slate-400 mt-1">{content.length} karakter</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border-4 border-black font-black italic uppercase text-xs bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 border-4 border-black font-black italic uppercase text-xs bg-[#6D4AFF] text-white shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={3} />}
                {submitting ? "Mengirim..." : "Kirim Artikel"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ArticlesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | "ALL" | "SAVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  // Bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Active events for Smart Event-Link widget (hanya event mendatang)
  const [activeEvents, setActiveEvents] = useState<MatchedEvent[]>([]);
  // All events untuk article picker (semua event termasuk yang sudah selesai)
  const [allEvents, setAllEvents] = useState<MatchedEvent[]>([]);

  useEffect(() => {
    setMounted(true);
    setBookmarkedIds(getBookmarks());
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setBookmarks(next);
      return next;
    });
  }, []);

  const fetchUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data: profile } = await supabase
      .from("profiles")
      .select("verification_status, full_name")
      .eq("id", user.id)
      .single();
    if (profile) {
      setVerificationStatus(profile.verification_status);
      setAuthorName(profile.full_name || "Anonim");
    }
  }, []);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select(`
        id, title, content, category, author_id, status, created_at, updated_at, linked_event_ids,
        profiles ( full_name, avatar_url )
      `)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setArticles(data as unknown as Article[]);
    }
    setLoading(false);
  }, []);

  const fetchActiveEvents = useCallback(async () => {
    // Fetch semua event (termasuk yang sudah selesai) untuk article picker
    const { data: allData } = await supabase
      .from("events")
      .select("id, title, date, end_date, location, price, image_url")
      .eq("status", "approved")
      .order("date", { ascending: false })
      .limit(200);
    if (allData) {
      setAllEvents(allData as MatchedEvent[]);
    }

    // Fetch hanya event mendatang untuk widget beli tiket
    const { data: upcomingData } = await supabase
      .from("events")
      .select("id, title, date, end_date, location, price, image_url")
      .eq("status", "approved")
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true })
      .limit(50);
    if (upcomingData) {
      setActiveEvents(upcomingData as MatchedEvent[]);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchArticles();
    fetchActiveEvents();
  }, [fetchUser, fetchArticles, fetchActiveEvents]);

  // Smart Event-Link matching: prioritize explicit linked_event_ids array, then fall back to text matching
  const getMatchedEvents = useCallback((article: Article): MatchedEvent[] => {
    // 1. Prioritas: linked_event_ids eksplisit yang dipilih penulis (bisa banyak)
    if (article.linked_event_ids && article.linked_event_ids.length > 0) {
      // Ambil dari allEvents (termasuk event yang sudah selesai)
      const linked = allEvents.filter((ev) => article.linked_event_ids!.includes(ev.id));
      if (linked.length > 0) return linked;
    }

    // 2. Fallback: text matching hanya pada event mendatang (relevan untuk beli tiket)
    if (activeEvents.length === 0) return [];
    const text = (article.title + " " + article.content).toLowerCase();
    return activeEvents.filter((ev) => {
      // Match if at least 2 consecutive words from event title appear in article
      const words = ev.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      if (words.length === 0) return false;
      // Check if any 2-word subsequence exists in the text
      if (words.length === 1) return text.includes(words[0]);
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = words[i] + " " + words[i + 1];
        if (text.includes(bigram)) return true;
      }
      // Fallback: check if the full event title substring is in the text
      return text.includes(ev.title.toLowerCase());
    }).slice(0, 3);
  }, [activeEvents, allEvents]);

  // Filtering logic
  const filtered = articles.filter((a) => {
    if (selectedCategory === "SAVED") {
      const isSaved = bookmarkedIds.includes(a.id);
      if (!isSaved) return false;
    } else if (selectedCategory !== "ALL") {
      if (a.category !== selectedCategory) return false;
    }
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
    return matchSearch;
  });

  const isVerified = verificationStatus === "approved";

  if (!mounted) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-[#FCFAF1] dark:bg-zinc-950 ${poppins.className}`}>
        <Loader2 className="animate-spin text-[#6D4AFF]" size={48} strokeWidth={3} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 ${poppins.className}`}>
      {/* Inject marquee styles */}
      <style dangerouslySetInnerHTML={{ __html: ARTICLE_MARQUEE_STYLE }} />

      {/* ─── BACK NAV ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border-b-4 border-black dark:border-zinc-700 px-6 py-3 flex items-center gap-3">
        <Link
          href="/explore"
          className="flex items-center gap-2 text-xs font-black italic uppercase text-slate-500 hover:text-[#6D4AFF] transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={3} /> Kembali ke Explore
        </Link>
      </div>

      {/* ─── MINI MARQUEE ───────────────────────────────────────────────── */}
      <ArticleMarquee />

      {/* ─── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b-4 border-black dark:border-zinc-700">
        {/* Grid BG */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6D4AFF]/10 via-amber-100/40 to-emerald-100/30 dark:from-[#6D4AFF]/20 dark:via-zinc-950 dark:to-emerald-900/20" />

        <div className="relative max-w-5xl mx-auto px-6 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Text */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 bg-black text-amber-400 px-3 py-1 text-[9px] font-black uppercase italic tracking-widest border-2 border-amber-400 mb-4">
                  <BookOpen size={12} strokeWidth={3} /> Artikel Tiketin
                </div>
                <h1 className="text-3xl md:text-4xl font-black italic uppercase leading-tight text-slate-900 dark:text-zinc-50 tracking-tighter">
                  Mau Tau Soal<br />
                  <span className="text-[#6D4AFF]">Bandung</span>,{" "}
                  <span className="text-amber-500">Musik</span> &{" "}
                  <span className="text-emerald-500">Teater</span>?
                </h1>
                <p className="mt-3 text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-md font-medium">
                  Kumpulan artikel dari komunitas Tiketin — cerita seru, review pertunjukan, dan inspirasi dari kota kreatif Bandung.
                </p>
                <div className="flex flex-wrap gap-3 mt-5">
                  {CATEGORIES.map((cat) => {
                    const cfg = CATEGORY_CONFIG[cat];
                    return (
                      <div key={cat} className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black ${cfg.bg} text-white text-[10px] font-black uppercase italic`}>
                        <cfg.icon size={12} strokeWidth={3} />
                        {cfg.label}: {cfg.desc}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="shrink-0"
            >
              <div className="bg-white dark:bg-zinc-900 border-4 border-black shadow-[8px_8px_0_0_#6D4AFF] p-6 text-center max-w-xs">
                <PenLine size={32} className="text-[#6D4AFF] mx-auto mb-3" strokeWidth={3} />
                <p className="font-black italic uppercase text-sm mb-1">Punya Cerita?</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
                  User terverifikasi KTP bisa menulis & membagikan artikel.
                </p>
                {isVerified ? (
                  <button
                    onClick={() => setShowWriteModal(true)}
                    className="w-full py-3 bg-[#6D4AFF] text-white border-4 border-black font-black italic uppercase text-xs shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <PenLine size={14} strokeWidth={3} /> Tulis Artikel
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      toast("⚠️ Kamu harus verifikasi KTP dulu untuk menulis artikel!", "warning");
                      router.push("/verify");
                    }}
                    className="w-full py-3 bg-amber-400 text-black border-4 border-black font-black italic uppercase text-xs shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={14} strokeWidth={3} /> Verifikasi KTP Dulu
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FILTER & SEARCH ─────────────────────────────────────────────── */}
      <section className="border-b-4 border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3">
          {/* Category tabs + SAVED */}
          <div className="flex gap-2 flex-wrap">
            {(["ALL", ...CATEGORIES, "SAVED"] as const).map((cat) => {
              const isActive = selectedCategory === cat;
              let label = "";
              if (cat === "ALL") label = "Semua";
              else if (cat === "SAVED") label = `📌 Disimpan (${bookmarkedIds.length})`;
              else label = CATEGORY_CONFIG[cat].label;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 border-4 border-black font-black italic uppercase text-[10px] transition-all ${
                    isActive
                      ? cat === "SAVED"
                        ? "bg-amber-400 text-black shadow-none translate-x-0.5 translate-y-0.5"
                        : "bg-[#6D4AFF] text-white shadow-none translate-x-0.5 translate-y-0.5"
                      : "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {/* Search */}
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={3} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari artikel..."
              className="pl-8 pr-8 py-2 border-4 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-bold text-xs focus:outline-none focus:border-[#6D4AFF] w-52 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900">
                <X size={14} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── ARTICLE GRID ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-[#6D4AFF]" size={48} strokeWidth={3} />
            <p className="text-xs font-black italic uppercase text-slate-400">Memuat artikel...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="h-24 w-24 bg-slate-100 dark:bg-zinc-800 border-4 border-black flex items-center justify-center shadow-[6px_6px_0_0_#000]">
              {selectedCategory === "SAVED" ? (
                <Bookmark size={40} className="text-slate-300 dark:text-zinc-600" strokeWidth={2} />
              ) : (
                <BookOpen size={40} className="text-slate-300 dark:text-zinc-600" strokeWidth={2} />
              )}
            </div>
            <p className="text-lg font-black italic uppercase text-slate-400 dark:text-zinc-500">
              {selectedCategory === "SAVED" ? "Belum ada artikel tersimpan" : "Belum ada artikel"}
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-600">
              {selectedCategory === "SAVED"
                ? "Simpan artikel favoritmu dengan tombol 📌 di kartu artikel!"
                : searchQuery
                ? "Coba kata kunci lain"
                : "Jadilah yang pertama menulis!"}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-black italic uppercase text-slate-400">
                {filtered.length} Artikel {selectedCategory === "SAVED" ? "tersimpan" : "ditemukan"}
              </p>
            </div>
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filtered.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={() => setSelectedArticle(article)}
                    isBookmarked={bookmarkedIds.includes(article.id)}
                    onToggleBookmark={toggleBookmark}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </section>

      {/* ─── MODALS ──────────────────────────────────────────────────────── */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          matchedEvents={getMatchedEvents(selectedArticle)}
          isBookmarked={bookmarkedIds.includes(selectedArticle.id)}
          onToggleBookmark={toggleBookmark}
        />
      )}
      {showWriteModal && userId && (
        <WriteArticleModal
          authorId={userId}
          authorName={authorName}
          onClose={() => setShowWriteModal(false)}
          onSuccess={fetchArticles}
          activeEvents={allEvents}
        />
      )}
    </div>
  );
}
