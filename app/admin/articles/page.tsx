"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import {
  BookOpen, CheckCircle2, XCircle, Eye, Loader2, Clock,
  User, Calendar, MapPin, Music, Theater, RefreshCcw, AlertTriangle,
  FileText, Filter, Search, X
} from "lucide-react";
import { useToast } from "@/components/ui/toast-brutal";
import { motion, AnimatePresence } from "framer-motion";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

type ArticleStatus = "pending" | "approved" | "rejected";
type ArticleCategory = "BANDUNG" | "MUSIK" | "TEATER";

interface Article {
  id: string;
  title: string;
  content: string;
  category: ArticleCategory;
  author_id: string;
  status: ArticleStatus;
  created_at: string;
  updated_at: string;
  excerpt?: string | null;
  rejection_reason?: string | null;
  profiles?: {
    full_name: string;
    email?: string | null;
  } | null;
}

const CATEGORY_CONFIG: Record<ArticleCategory, { label: string; bg: string; icon: React.ElementType }> = {
  BANDUNG: { label: "Bandung", bg: "bg-amber-400 text-slate-900", icon: MapPin },
  MUSIK: { label: "Musik", bg: "bg-[#6D4AFF] text-white", icon: Music },
  TEATER: { label: "Teater", bg: "bg-emerald-400 text-slate-900", icon: Theater },
};

const STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Menunggu", color: "text-amber-600 bg-amber-100 border-amber-400", icon: Clock },
  approved: { label: "Disetujui", color: "text-emerald-600 bg-emerald-100 border-emerald-400", icon: CheckCircle2 },
  rejected: { label: "Ditolak", color: "text-red-600 bg-red-100 border-red-400", icon: XCircle },
};

function CategoryBadge({ category }: { category: ArticleCategory }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase italic border-2 border-black ${cfg.bg}`}>
      <cfg.icon size={10} strokeWidth={3} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: ArticleStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase border-2 border-current ${cfg.color}`}>
      <cfg.icon size={10} strokeWidth={3} />
      {cfg.label}
    </span>
  );
}

function ArticleDetailModal({
  article,
  onClose,
  onApprove,
  onReject,
}: {
  article: Article;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("Spam / Promosi Berlebihan");
  const [processing, setProcessing] = useState(false);

  const PRESET_REASONS = [
    "Spam / Promosi Berlebihan",
    "Konten SARA / Kebencian",
    "Plagiarisme / Copy-paste",
    "Kategori Artikel Tidak Sesuai",
    "Lainnya"
  ];

  const handleApprove = async () => {
    setProcessing(true);
    await onApprove(article.id);
    setProcessing(false);
    onClose();
  };

  const handleReject = async () => {
    const finalReason = selectedPreset === "Lainnya" ? rejectReason.trim() : selectedPreset;
    if (!finalReason) return;
    setProcessing(true);
    await onReject(article.id, finalReason);
    setProcessing(false);
    onClose();
  };

  const date = new Date(article.created_at).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });

  const isRejectButtonDisabled = processing || (selectedPreset === "Lainnya" && !rejectReason.trim());

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-zinc-900 border-4 border-black shadow-[12px_12px_0_0_#6D4AFF] max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-[#6D4AFF] p-6 border-b-4 border-black flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CategoryBadge category={article.category} />
                <StatusBadge status={article.status} />
              </div>
              <h2 className="text-xl font-black italic uppercase text-white leading-tight">{article.title}</h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-white/70 text-[10px] font-bold flex items-center gap-1">
                  <User size={10} strokeWidth={3} />
                  {article.profiles?.full_name || "Anonim"}
                </span>
                <span className="text-white/70 text-[10px] font-bold flex items-center gap-1">
                  <Calendar size={10} strokeWidth={3} />
                  {date}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors shrink-0">
              <XCircle size={24} strokeWidth={3} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {article.excerpt && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 mb-4">
                <p className="text-xs font-black italic uppercase text-amber-600 dark:text-amber-400 mb-1">Ringkasan</p>
                <p className="text-sm text-slate-700 dark:text-zinc-300">{article.excerpt}</p>
              </div>
            )}
            <div className="prose prose-sm max-w-none text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm border-4 border-slate-100 dark:border-zinc-700 p-4 max-h-60 overflow-y-auto">
              {article.content}
            </div>
          </div>

          {/* Actions - only if pending or approved */}
          {(article.status === "pending" || article.status === "approved") && (
            <div className="p-6 border-t-4 border-slate-100 dark:border-zinc-700 space-y-4">
              {rejecting ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-black italic uppercase text-slate-500 block">
                    {article.status === "approved" ? "Pilih Alasan Takedown *" : "Pilih Alasan Penolakan *"}
                  </label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="w-full border-4 border-black bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 p-3 text-sm font-bold focus:outline-none"
                  >
                    {PRESET_REASONS.map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>

                  {selectedPreset === "Lainnya" && (
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      placeholder={
                        article.status === "approved"
                          ? "Jelaskan alasan takedown artikel ini..."
                          : "Jelaskan alasan penolakan artikel ini..."
                      }
                      className="w-full border-4 border-red-400 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 p-3 text-sm font-medium focus:outline-none resize-none mt-2"
                    />
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRejecting(false)}
                      className="flex-1 py-3 border-4 border-black font-black italic uppercase text-xs bg-white dark:bg-zinc-800 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isRejectButtonDisabled}
                      className="flex-1 py-3 border-4 border-black font-black italic uppercase text-xs bg-red-500 text-white shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {processing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} strokeWidth={3} />}
                      {article.status === "approved" ? "Takedown Artikel" : "Tolak Artikel"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  {article.status === "approved" ? (
                    <button
                      onClick={() => setRejecting(true)}
                      disabled={processing}
                      className="w-full py-3 border-4 border-black font-black italic uppercase text-xs bg-red-500 text-white shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <XCircle size={14} strokeWidth={3} /> Takedown Artikel
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setRejecting(true)}
                        disabled={processing}
                        className="flex-1 py-3 border-4 border-black font-black italic uppercase text-xs bg-red-500 text-white shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        <XCircle size={14} strokeWidth={3} /> Tolak
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={processing}
                        className="flex-1 py-3 border-4 border-black font-black italic uppercase text-xs bg-emerald-500 text-white shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {processing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} strokeWidth={3} />}
                        Setujui
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Rejection reason if already rejected */}
          {article.status === "rejected" && article.rejection_reason && (
            <div className="p-6 border-t-4 border-red-100 bg-red-50 dark:bg-red-900/10">
              <p className="text-[10px] font-black italic uppercase text-red-500 mb-1">Alasan Penolakan</p>
              <p className="text-sm text-red-700 dark:text-red-400">{article.rejection_reason}</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AdminLogsModal({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/admin/logs");
        const json = await res.json();
        if (json.success) {
          setLogs(json.data);
        }
      } catch (err) {
        console.error("Gagal load logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-zinc-900 border-4 border-black shadow-[12px_12px_0_0_#FBBF24] max-w-2xl w-full max-h-[85vh] flex flex-col"
        >
          <div className="bg-amber-400 p-6 border-b-4 border-black flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={20} strokeWidth={3} className="text-slate-900" />
              <h2 className="text-xl font-black italic uppercase text-slate-900 tracking-tight">Log Aktivitas Admin</h2>
            </div>
            <button onClick={onClose} className="text-slate-900 hover:text-black transition-colors shrink-0">
              <XCircle size={24} strokeWidth={3} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3">
                <Loader2 className="animate-spin text-amber-500" size={32} strokeWidth={3} />
                <span className="font-black italic uppercase text-xs text-slate-400">Memuat log...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 font-black italic uppercase text-slate-400">Belum ada aktivitas admin tercatat.</div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const date = new Date(log.timestamp).toLocaleString("id-ID", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                  });
                  return (
                    <div key={log.id} className="border-2 border-black p-3 bg-slate-50 dark:bg-zinc-800 text-left space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase border-2 border-black ${
                          log.action === "APPROVE_ARTICLE" ? "bg-emerald-400 text-slate-900" : "bg-red-400 text-white"
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">{date}</span>
                      </div>
                      <p className="text-xs font-black uppercase text-slate-900 dark:text-zinc-100">
                        Oleh: {log.admin_name} <span className="text-[9px] text-slate-400 font-bold">({log.admin_id.substring(0, 8)})</span>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed">
                        {log.details}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function AdminArticlesPage() {
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ArticleStatus | "ALL">("pending");
  const [filterCategory, setFilterCategory] = useState<ArticleCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select(`
        id, title, content, category, author_id, status, created_at, updated_at,
        profiles ( full_name )
      `)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setArticles(data as unknown as Article[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("articles")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast("Gagal menyetujui artikel: " + error.message, "error");
    } else {
      toast("✅ Artikel berhasil disetujui dan dipublikasikan!", "success");
      
      // Feature 1 & 3: Notifikasi & Audit Logs
      const article = articles.find((a) => a.id === id);
      if (article) {
        try {
          // Insert notification
          await supabase.from("notifications").insert({
            user_id: article.author_id,
            title: "Artikel Disetujui 🚀",
            message: `Artikel Anda "${article.title}" telah disetujui dan dipublikasikan.`,
            type: "success",
            is_read: false
          });

          // Fetch current admin info and log action
          const { data: { user } } = await supabase.auth.getUser();
          const adminId = user?.id || 'unknown';
          const adminName = user?.user_metadata?.full_name || user?.email || 'Admin';
          
          await fetch('/api/admin/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: "APPROVE_ARTICLE",
              admin_id: adminId,
              admin_name: adminName,
              details: `Menyetujui artikel "${article.title}" (ID: ${id})`
            })
          });
        } catch (err) {
          console.error("Gagal mengirim notifikasi/log:", err);
        }
      }

      fetchArticles();
    }
  };

  const handleReject = async (id: string, reason: string) => {
    const { error } = await supabase
      .from("articles")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast("Gagal menolak artikel: " + error.message, "error");
    } else {
      toast("❌ Artikel telah ditolak.", "info");
      
      // Feature 1 & 3: Notifikasi & Audit Logs
      const article = articles.find((a) => a.id === id);
      if (article) {
        try {
          const isTakedown = article.status === "approved";
          
          // Insert notification
          await supabase.from("notifications").insert({
            user_id: article.author_id,
            title: isTakedown ? "Artikel Ditakedown ⚠️" : "Artikel Ditolak ❌",
            message: `Artikel Anda "${article.title}" telah ${isTakedown ? "ditakedown oleh admin" : "ditolak"}. Alasan: ${reason}`,
            type: "warning",
            is_read: false
          });

          // Fetch current admin info and log action
          const { data: { user } } = await supabase.auth.getUser();
          const adminId = user?.id || 'unknown';
          const adminName = user?.user_metadata?.full_name || user?.email || 'Admin';
          
          await fetch('/api/admin/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: isTakedown ? "TAKEDOWN_ARTICLE" : "REJECT_ARTICLE",
              admin_id: adminId,
              admin_name: adminName,
              details: `${isTakedown ? 'Takedown' : 'Menolak'} artikel "${article.title}" (ID: ${id}) dengan alasan: ${reason}`
            })
          });
        } catch (err) {
          console.error("Gagal mengirim notifikasi/log:", err);
        }
      }

      fetchArticles();
    }
  };

  const counts = {
    ALL: articles.length,
    pending: articles.filter((a) => a.status === "pending").length,
    approved: articles.filter((a) => a.status === "approved").length,
    rejected: articles.filter((a) => a.status === "rejected").length,
  };

  const filtered = articles.filter((a) => {
    const matchStatus = filterStatus === "ALL" || a.status === filterStatus;
    const matchCategory = filterCategory === "ALL" || a.category === filterCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || a.title.toLowerCase().includes(q) || (a.profiles?.full_name || "").toLowerCase().includes(q);
    return matchStatus && matchCategory && matchSearch;
  });

  return (
    <div className={`space-y-8 ${poppins.className}`}>
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-[#6D4AFF] p-2 border-4 border-black shadow-[4px_4px_0_0_#000]">
              <BookOpen size={20} className="text-amber-400" strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Moderasi Artikel</h1>
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase italic ml-1">
            Review & moderasi artikel dari user terverifikasi
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLogs(true)}
            className="flex items-center gap-2 px-4 py-3 border-4 border-black font-black italic uppercase text-xs bg-amber-400 text-slate-900 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer font-bold"
          >
            <FileText size={14} strokeWidth={3} /> Log Aktivitas
          </button>
          <button
            onClick={fetchArticles}
            className="flex items-center gap-2 px-4 py-3 border-4 border-black font-black italic uppercase text-xs bg-white dark:bg-zinc-900 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer font-bold"
          >
            <RefreshCcw size={14} strokeWidth={3} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { key: "ALL", label: "Total", color: "bg-slate-900 text-white", count: counts.ALL },
          { key: "pending", label: "Pending", color: "bg-amber-400 text-slate-900", count: counts.pending },
          { key: "approved", label: "Disetujui", color: "bg-emerald-400 text-slate-900", count: counts.approved },
          { key: "rejected", label: "Ditolak", color: "bg-red-500 text-white", count: counts.rejected },
        ] as const).map((stat) => (
          <button
            key={stat.key}
            onClick={() => setFilterStatus(stat.key as ArticleStatus | "ALL")}
            className={`p-5 border-4 border-black font-black italic uppercase text-left transition-all ${filterStatus === stat.key
                ? `${stat.color} shadow-none translate-x-0.5 translate-y-0.5`
                : "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
              }`}
          >
            <div className="text-3xl font-black">{stat.count}</div>
            <div className="text-[10px] tracking-widest mt-1">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Pending alert */}
      {counts.pending > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border-4 border-amber-400 p-4 flex items-center gap-3"
        >
          <AlertTriangle size={20} className="text-amber-600 shrink-0" strokeWidth={3} />
          <p className="font-black italic uppercase text-xs text-amber-700 dark:text-amber-400">
            {counts.pending} artikel menunggu review kamu!
          </p>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border-4 border-black p-4 flex flex-wrap gap-3 items-center shadow-[4px_4px_0_0_#000]">
        <Filter size={14} strokeWidth={3} className="text-slate-400 shrink-0" />
        <div className="flex flex-wrap gap-2">
          {(["ALL", "BANDUNG", "MUSIK", "TEATER"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 border-4 border-black font-black italic uppercase text-[10px] transition-all ${filterCategory === cat
                  ? "bg-[#6D4AFF] text-white shadow-none"
                  : "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                }`}
            >
              {cat === "ALL" ? "Semua Kategori" : cat}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={3} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul / penulis..."
            className="pl-7 pr-7 py-2 border-4 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-bold text-[11px] focus:outline-none focus:border-[#6D4AFF] w-48"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
              <X size={12} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* Article Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <Loader2 className="animate-spin text-[#6D4AFF]" size={32} strokeWidth={3} />
          <span className="font-black italic uppercase text-xs text-slate-400">Memuat artikel...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="h-20 w-20 bg-slate-100 dark:bg-zinc-800 border-4 border-black flex items-center justify-center shadow-[6px_6px_0_0_#000]">
            <FileText size={32} className="text-slate-300 dark:text-zinc-600" strokeWidth={2} />
          </div>
          <p className="font-black italic uppercase text-slate-400 dark:text-zinc-500">Tidak ada artikel ditemukan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article, idx) => {
            const date = new Date(article.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white dark:bg-zinc-900 border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <div className="p-4 flex flex-wrap items-center gap-4">
                  {/* Status accent */}
                  <div className={`w-2 h-16 shrink-0 border-r-2 border-black ${article.status === "pending" ? "bg-amber-400" :
                      article.status === "approved" ? "bg-emerald-400" : "bg-red-400"
                    }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <CategoryBadge category={article.category} />
                      <StatusBadge status={article.status} />
                    </div>
                    <h3 className="font-black italic uppercase text-sm text-slate-900 dark:text-zinc-100 line-clamp-1">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <User size={9} strokeWidth={3} />
                        {article.profiles?.full_name || "Anonim"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Calendar size={9} strokeWidth={3} />
                        {date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {article.status === "pending" && (
                      <>
                        <button
                          onClick={async () => { await handleApprove(article.id); }}
                          className="px-3 py-2 border-4 border-black bg-emerald-400 text-slate-900 font-black italic uppercase text-[10px] shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} strokeWidth={3} /> Setujui
                        </button>
                        <button
                          onClick={() => setSelectedArticle(article)}
                          className="px-3 py-2 border-4 border-black bg-red-400 text-white font-black italic uppercase text-[10px] shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1"
                        >
                          <XCircle size={12} strokeWidth={3} /> Tolak
                        </button>
                      </>
                    )}
                    {article.status === "approved" && (
                      <button
                        onClick={() => setSelectedArticle(article)}
                        className="px-3 py-2 border-4 border-black bg-red-500 text-white font-black italic uppercase text-[10px] shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1"
                      >
                        <XCircle size={12} strokeWidth={3} /> Takedown
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedArticle(article)}
                      className="px-3 py-2 border-4 border-black bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-black italic uppercase text-[10px] shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1"
                    >
                      <Eye size={12} strokeWidth={3} /> Lihat
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Logs Modal */}
      {showLogs && (
        <AdminLogsModal onClose={() => setShowLogs(false)} />
      )}
    </div>
  );
}
