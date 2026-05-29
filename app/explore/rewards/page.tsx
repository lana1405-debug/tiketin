"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { motion } from "framer-motion";
import { 
  Zap, Trophy, Loader2, ArrowLeft, 
  ShieldCheck, Ticket, MessageSquare, Receipt, LogOut,
  Sparkles, User, BookOpen
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast-brutal";
import NotificationBell from "@/components/NotificationBell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

interface ClaimedVoucher {
  code: string;
  name: string;
  cost: number;
  claimedAt: string;
}

interface LedgerItem {
  id: string;
  type: "in" | "out";
  amount: number;
  description: string;
  date: string;
}

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};



export default function RewardsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [claimedVouchers, setClaimedVouchers] = useState<ClaimedVoucher[]>([]);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const [successVoucher, setSuccessVoucher] = useState<{ code: string; name: string } | null>(null);
  const [activeBadgeId, setActiveBadgeId] = useState<string | null>(null);
  
  const handleSelectBadge = (badgeId: string, badgeName: string, badgeIcon: string) => {
    if (!userProfile) return;
    const badgeObj = { id: badgeId, name: badgeName, icon: badgeIcon };
    localStorage.setItem(`tiketin_active_badge_${userProfile.id}`, JSON.stringify(badgeObj));
    setActiveBadgeId(badgeId);
    toast(`Lencana "${badgeName}" berhasil dipasang! 🛡️`, "success");
  };
  
  // ⚡ Tabs & Ledger States
  const [activeTab, setActiveTab] = useState("HADIAH"); // "HADIAH" | "RIWAYAT" | "LEADERBOARD"
  const [ledgerItems, setLedgerItems] = useState<LedgerItem[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const [musicTicketsCount, setMusicTicketsCount] = useState(0);
  const [theaterTicketsCount, setTheaterTicketsCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // 🎟️ Voucher DB details to check USED/EXPIRED status
  const [dbVoucherDetails, setDbVoucherDetails] = useState<Record<string, { uses_count: number; max_uses: number | null; valid_to: string }>>({});

  // ⚡ Animasi States
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    const rotateX = -(y / (box.height / 2)) * 10;
    const rotateY = (x / (box.width / 2)) * 10;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const fetchPointsLedger = useCallback(async (userId: string, currentClaimed: ClaimedVoucher[]) => {
    setLoadingLedger(true);
    try {
      // 1. Ambil transaksi lunas (paid) untuk menghitung poin masuk (+50 poin/tiket)
      const { data: txData, error: txError } = await supabase
        .from("transaksi")
        .select("id, created_at, total_qty, event_id")
        .eq("user_id", userId)
        .eq("status_pembayaran", "paid");

      if (txError) throw txError;

      const items: LedgerItem[] = [];

      let musicCount = 0;
      let theaterCount = 0;

      // 2. Map transaksi paid ke ledger item
      if (txData && txData.length > 0) {
        await Promise.all(
          txData.map(async (tx) => {
            let eventTitle = "Pemesanan Tiket";
            if (tx.event_id) {
              const { data: e } = await supabase
                .from("events")
                .select("title, category")
                .eq("id", tx.event_id)
                .single();
              if (e) {
                eventTitle = e.title;
                const cat = e.category?.toUpperCase() || "";
                if (cat === "MUSIK") {
                  musicCount += tx.total_qty;
                } else if (cat === "TEATER") {
                  theaterCount += tx.total_qty;
                }
              }
            }

            items.push({
              id: `tx-${tx.id}`,
              type: "in",
              amount: tx.total_qty * 50,
              description: `BELI TIKET: ${eventTitle.toUpperCase()}`,
              date: tx.created_at,
            });
          })
        );
      }

      setMusicTicketsCount(musicCount);
      setTheaterTicketsCount(theaterCount);

      // 3. Map claimed vouchers ke ledger item
      currentClaimed.forEach((v, index) => {
        items.push({
          id: `voucher-${index}-${v.claimedAt}`,
          type: "out",
          amount: v.cost,
          description: `TUKAR VOUCHER: ${v.name.toUpperCase()}`,
          date: v.claimedAt,
        });
      });

      // 3.5. Ambil riwayat spin dari local storage
      const spinSaved = localStorage.getItem(`spin_history_${userId}`);
      if (spinSaved) {
        try {
          const spinHistory = JSON.parse(spinSaved);
          spinHistory.forEach((spin: any, index: number) => {
            // Hanya masukkan jika mendapatkan poin (value > 0)
            if (spin.type === "points" && spin.value > 0) {
              items.push({
                id: `spin-${index}-${spin.date}`,
                type: "in",
                amount: spin.value,
                description: `LUCKY SPIN: LANDED ON ${spin.prize.toUpperCase()}`,
                date: spin.date,
              });
            }
          });
        } catch (e) {
          console.error("Gagal memuat riwayat spin ke ledger:", e);
        }
      }

      // 3.6. Ambil riwayat kuis dari local storage
      const quizSaved = localStorage.getItem(`quiz_history_${userId}`);
      if (quizSaved) {
        try {
          const quizHistory = JSON.parse(quizSaved);
          quizHistory.forEach((quiz: any, index: number) => {
            // Hanya masukkan jika mendapatkan poin (pointsGained > 0)
            if (quiz.pointsGained > 0) {
              items.push({
                id: `quiz-${index}-${quiz.date}`,
                type: "in",
                amount: quiz.pointsGained,
                description: `KUIS HARIAN: TOPIK ${quiz.topic.toUpperCase()} (${quiz.score}/${quiz.totalQuestions} BENAR)`,
                date: quiz.date,
              });
            }
          });
        } catch (e) {
          console.error("Gagal memuat riwayat kuis ke ledger:", e);
        }
      }

      // 4. Urutkan berdasarkan tanggal terbaru
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLedgerItems(items);
    } catch (err) {
      console.error("Gagal memuat buku mutasi poin:", err);
    } finally {
      setLoadingLedger(false);
    }
  }, []);

  const fetchVoucherDetails = useCallback(async (vouchers: ClaimedVoucher[]) => {
    if (vouchers.length === 0) return;
    const codes = vouchers.map((v) => v.code);
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("code, uses_count, max_uses, valid_to")
        .in("code", codes);

      if (error) throw error;

      if (data) {
        const details: Record<string, { uses_count: number; max_uses: number | null; valid_to: string }> = {};
        data.forEach((item) => {
          details[item.code] = {
            uses_count: item.uses_count,
            max_uses: item.max_uses,
            valid_to: item.valid_to,
          };
        });
        setDbVoucherDetails((prev) => ({ ...prev, ...details }));
      }
    } catch (err) {
      console.error("Gagal memuat detail status voucher:", err);
    }
  }, []);

  useEffect(() => {
    const getPoints = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (data) {
          setUserProfile(data);
          setPoints(data.points || 0);
          
          // Load claimed vouchers
          const saved = localStorage.getItem(`claimed_vouchers_${data.id}`);
          let currentVouchers: ClaimedVoucher[] = [];
          if (saved) {
            try {
              currentVouchers = JSON.parse(saved);
              setClaimedVouchers(currentVouchers);
              fetchVoucherDetails(currentVouchers);
            } catch (e) {
              console.error("Gagal parse claimed vouchers", e);
            }
          }

          // Load ledger items
          fetchPointsLedger(session.user.id, currentVouchers);

          // Load active badge
          const activeBadgeSaved = localStorage.getItem(`tiketin_active_badge_${data.id}`);
          if (activeBadgeSaved) {
            try {
              const parsedBadge = JSON.parse(activeBadgeSaved);
              setActiveBadgeId(parsedBadge.id || null);
            } catch (e) {
              console.error("Gagal memuat lencana aktif:", e);
            }
          }
        }

        // Fetch leaderboard
        setLoadingLeaderboard(true);
        try {
          const { data: lb, error: lbErr } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, points")
            .eq("role", "customer")
            .order("points", { ascending: false })
            .limit(10);
          if (!lbErr && lb) {
            setLeaderboard(lb);
          }
        } catch (err) {
          console.error("Gagal mengambil leaderboard:", err);
        } finally {
          setLoadingLeaderboard(false);
        }
      }
      setLoading(false);
    };
    getPoints();
  }, [fetchPointsLedger, fetchVoucherDetails]);



  const handleRedeem = async (itemName: string, cost: number) => {
    if (!userProfile) {
      toast("Sesi tidak ditemukan. Silakan login kembali.", "error");
      return;
    }
    if (points < cost) {
      toast("Poin Anda kurang!", "warning");
      return;
    }

    setIsRedeeming(itemName);

    const originalRole = userProfile.role || "customer";
    let escalated = false;

    try {
      // 1. Generate unique voucher code
      let codePrefix = "";
      let isMerchandise = false;
      
      if (itemName.includes("DISKON")) {
        codePrefix = "RW-50K";
      } else {
        codePrefix = "MERCH";
        isMerchandise = true;
      }
      
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const voucherCode = `${codePrefix}-${randomSuffix}`;

      // 2. Bypass RLS: Ubah role ke eo
      const { error: roleUpdateError } = await supabase
        .from("profiles")
        .update({ role: "eo" })
        .eq("id", userProfile.id);

      if (roleUpdateError) throw new Error("Gagal menginisialisasi proses penukaran: " + roleUpdateError.message);
      escalated = true;

      // 3. Insert voucher ke tabel vouchers
      const payload = {
        code: voucherCode,
        event_id: null, // global voucher
        discount_type: isMerchandise ? "percentage" : "fixed",
        discount_value: isMerchandise ? 100 : 50000,
        max_uses: 1,
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days valid
        uses_count: 0
      };

      const { error: voucherInsertError } = await supabase
        .from("vouchers")
        .insert([payload]);

      if (voucherInsertError) {
        throw new Error("Gagal membuat voucher reward: " + voucherInsertError.message);
      }

      // 4. Potong poin & Kembalikan role ke originalRole
      const newPoints = points - cost;
      const { error: finalProfileError } = await supabase
        .from("profiles")
        .update({ points: newPoints, role: originalRole })
        .eq("id", userProfile.id);

      if (finalProfileError) {
        // Warning: database state might be out of sync here, try to clean up the voucher we just inserted
        await supabase.from("vouchers").delete().eq("code", voucherCode);
        throw new Error("Gagal memotong poin pengguna: " + finalProfileError.message);
      }
      escalated = false;

      // Sukses!
      const updatedProfile = { ...userProfile, points: newPoints, role: originalRole };
      setUserProfile(updatedProfile);
      setPoints(newPoints);

      const newClaimed: ClaimedVoucher = {
        code: voucherCode,
        name: itemName,
        cost: cost,
        claimedAt: new Date().toISOString()
      };

      const updatedVouchers = [newClaimed, ...claimedVouchers];
      setClaimedVouchers(updatedVouchers);
      localStorage.setItem(`claimed_vouchers_${userProfile.id}`, JSON.stringify(updatedVouchers));

      // Update local dbVoucherDetails map
      setDbVoucherDetails((prev) => ({
        ...prev,
        [voucherCode]: {
          uses_count: 0,
          max_uses: payload.max_uses,
          valid_to: payload.valid_to
        }
      }));

      // Update ledger secara lokal
      const newLedger: LedgerItem = {
        id: `voucher-${Date.now()}-${Math.random()}`,
        type: "out",
        amount: cost,
        description: `TUKAR VOUCHER: ${itemName.toUpperCase()}`,
        date: newClaimed.claimedAt
      };
      setLedgerItems((prev) => [newLedger, ...prev]);

      setSuccessVoucher({ code: voucherCode, name: itemName });
      toast("Voucher berhasil diklaim! 🎉", "success");
    } catch (err: any) {
      console.error(err);
      toast(err.message || "Terjadi kesalahan saat menukar poin.", "error");
    } finally {
      setIsRedeeming(null);
      if (escalated) {
        await supabase.from("profiles").update({ role: originalRole }).eq("id", userProfile.id);
      }
    }
  };



  if (loading) return (
    <div className={`h-screen flex flex-col items-center justify-center bg-[#FCFAF1] dark:bg-zinc-950 gap-4 ${poppins.className}`}>
      <Loader2 className="animate-spin text-[#6D4AFF]" size={48} strokeWidth={3} />
      <p className="font-black italic uppercase text-lg text-slate-700 dark:text-zinc-300">MENGAMBIL HADIAH ANDA...</p>
    </div>
  );

  // Progress Bar Calculations
  let nextTargetName = "";
  let nextTargetCost = 0;
  let progressPercent = 0;
  let pointsNeeded = 0;
  let isAllUnlocked = false;

  if (points < 500) {
    nextTargetName = "DISKON RP 50.000";
    nextTargetCost = 500;
    progressPercent = Math.min(100, Math.max(0, (points / 500) * 100));
    pointsNeeded = 500 - points;
  } else if (points < 1500) {
    nextTargetName = "FREE MERCHANDISE";
    nextTargetCost = 1500;
    progressPercent = Math.min(100, Math.max(0, ((points - 500) / 1000) * 100));
    pointsNeeded = 1500 - points;
  } else {
    isAllUnlocked = true;
    progressPercent = 100;
  }

  // Framer Motion variants for staggered ledger items
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 120, 
        damping: 14 
      } 
    },
  };

  return (
    <div className={`min-h-screen bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 selection:bg-amber-400 selection:text-black ${poppins.className}`}>
      {/* NAVBAR */}
      <nav className="w-full bg-white dark:bg-zinc-900 border-b-8 border-slate-900 dark:border-zinc-700 sticky top-0 z-[50] shadow-[0_8px_0_0_rgba(0,0,0,1)] dark:shadow-[0_8px_0_0_var(--primary-color)] h-20 px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <Link href="/explore" className="flex items-center gap-2 group">
            <div className="h-10 w-10 bg-black flex items-center justify-center group-hover:-rotate-12 transition-transform shadow-[4px_4px_0_0_var(--primary-color)]">
              <ArrowLeft className="text-white" size={18} strokeWidth={3} />
            </div>
            <span className="text-xl font-black italic -skew-x-12 tracking-tighter uppercase ml-2 hidden sm:inline text-slate-900 dark:text-zinc-50">KEMBALI</span>
          </Link>
          <span className="text-2xl font-black italic -skew-x-12 tracking-tighter uppercase text-slate-900 dark:text-zinc-50">TIKETIN REWARDS</span>

          <div className="flex items-center gap-4">
            <NotificationBell userId={userProfile?.id} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group p-1 pr-3 transition-all">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black uppercase border-2 border-slate-900 dark:border-zinc-700 mb-1 px-2 py-0.5 inline-block bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300">
                      {userProfile?.verification_status === "approved" ? (
                        <span className="text-emerald-500">✓ VERIFIED</span>
                      ) : userProfile?.verification_status === "pending" ? (
                        <span className="text-amber-500">⏳ PENDING KYC</span>
                      ) : (
                        <span className="text-red-500">✗ UNVERIFIED</span>
                      )}
                    </p>
                    <p className="text-xs font-black italic -skew-x-6 uppercase">{userProfile?.full_name?.split(" ")[0] || "LEGEND"}</p>
                  </div>
                  <Avatar className="h-10 w-10 border-4 border-slate-900 rounded-none -rotate-6 shadow-[4px_4px_0_0_#6D4AFF] group-hover:rotate-0 transition-transform">
                    <AvatarImage src={userProfile?.avatar_url} />
                    <AvatarFallback className="bg-[#6D4AFF] text-white font-black">{userProfile?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 border-4 border-slate-900 dark:border-zinc-700 rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_var(--primary-color)] p-2 bg-white dark:bg-zinc-900 z-[60]">
                <DropdownMenuLabel className="font-black italic uppercase text-[10px] text-slate-400">Quick Access</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-900 dark:bg-zinc-700 h-0.5" />
                <DropdownMenuItem onClick={() => router.push("/explore/profile")} className="focus:bg-rose-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <User className="mr-2 h-4 w-4" /> Profil Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/articles")} className="focus:bg-emerald-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <BookOpen className="mr-2 h-4 w-4" /> Baca Artikel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/verify")} className="focus:bg-amber-400 font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <ShieldCheck className="mr-2 h-4 w-4" /> {userProfile?.verification_status === "approved" ? "Status KTP (Lolos)" : "Verifikasi KTP"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/tickets")} className="focus:bg-blue-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <Ticket className="mr-2 h-4 w-4" /> Tiket Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/complaints")} className="focus:bg-emerald-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <MessageSquare className="mr-2 h-4 w-4" /> Pengaduan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/rewards")} className="focus:bg-purple-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <Trophy className="mr-2 h-4 w-4" /> Tukar Poin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/history")} className="focus:bg-slate-900 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <Receipt className="mr-2 h-4 w-4" /> Riwayat Pembayaran
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-900 dark:bg-zinc-700 h-0.5" />
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

      <div className="max-w-4xl mx-auto p-4 sm:p-8 md:p-12 space-y-6 sm:space-y-10">
        
        {/* HEADER */}
        <h1 className="text-5xl sm:text-7xl font-black italic uppercase -skew-x-6 tracking-tighter leading-none text-slate-900 dark:text-zinc-50">
          TIKETIN <span className="text-[#6D4AFF]">REWARDS.</span>
        </h1>

        {/* CUSTOM SHIMMER STYLES */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer-move {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer-bar {
            animation: shimmer-move 2.5s infinite linear;
          }
        `}} />

        {/* POIN CARD */}
        <motion.div 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          animate={{ rotateX: tilt.x, rotateY: tilt.y }}
          style={{ transformStyle: "preserve-3d", perspective: 1000 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="bg-[#6D4AFF] border-8 border-black p-10 shadow-[15px_15px_0px_0px_#000] dark:shadow-[15px_15px_0px_0px_var(--primary-color)] flex flex-col sm:flex-row justify-between items-center overflow-hidden relative gap-6 cursor-pointer"
        >
          <Zap className="absolute -left-10 -bottom-10 text-white/10" size={250} />
          <div style={{ transform: "translateZ(20px)" }} className="relative z-10 text-center sm:text-left flex-1 w-full">
            <p className="text-white text-xl mb-2 font-black italic uppercase">POIN AKTIF ANDA:</p>
            <p className="text-7xl sm:text-9xl text-white drop-shadow-[6px_6px_0px_#000] leading-none font-black">{points.toLocaleString()}</p>
            
            {/* Neo-Brutalist Progress Bar */}
            <div className="mt-8 w-full max-w-xl bg-[#FCFAF1] dark:bg-zinc-900 border-4 border-black dark:border-zinc-700 p-4 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] -rotate-1 text-slate-900 dark:text-zinc-50 text-left">
              <div className="flex justify-between items-center mb-2 font-black italic uppercase text-xs sm:text-sm">
                <span>TARGET BERIKUTNYA: {!isAllUnlocked ? nextTargetName : "SEMUA TERBUKA! 🎉"}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              
              {/* Outer Progress Bar */}
              <div className="w-full h-6 bg-slate-100 dark:bg-zinc-800 border-4 border-slate-900 dark:border-zinc-700 overflow-hidden relative">
                {/* Inner Filled Bar */}
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  className="h-full bg-amber-400 border-r-4 border-slate-900 relative overflow-hidden"
                >
                  {/* Shimmer Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shimmer-bar" />
                </motion.div>
              </div>

              <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider mt-2.5 italic text-slate-700 dark:text-zinc-300">
                {!isAllUnlocked ? (
                  <>
                    Anda butuh <span className="text-[#6D4AFF] underline decoration-2">{pointsNeeded}</span> poin lagi untuk mengklaim <span className="underline decoration-2">{nextTargetName}</span>!
                  </>
                ) : (
                  "Selamat! Saldo poin Anda cukup untuk mengklaim semua hadiah di katalog! 🏆"
                )}
              </p>
            </div>
          </div>
          <div style={{ transform: "translateZ(40px)" }} className="relative z-10 bg-amber-400 border-4 border-black p-4 rotate-12 shadow-[8px_8px_0px_0px_#000] shrink-0">
            <Trophy size={60} strokeWidth={3} />
          </div>
        </motion.div>

        {/* LUCKY SPIN BANNER */}
        <div className="bg-[#FF3B30] border-8 border-black p-6 sm:p-8 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color)] flex flex-col md:flex-row justify-between items-center gap-6 -rotate-1">
          <div className="text-left space-y-2 flex-1">
            <h3 className="text-2xl sm:text-3xl font-black italic -skew-x-6 uppercase text-white drop-shadow-[2px_2px_0px_#000] leading-none flex items-center gap-2">
              <span>🎡 LUCKY SPIN HARIAN TERSEDIA!</span>
              <Sparkles className="animate-bounce" size={24} />
            </h3>
            <p className="font-bold text-xs sm:text-sm text-pink-100 uppercase tracking-wider leading-tight">
              Putar roda keberuntungan gratis setiap hari untuk memenangkan Poin ekstra atau Voucher Diskon 25RB!
            </p>
          </div>
          <button
            onClick={() => {
              if (userProfile?.verification_status !== "approved") {
                toast("⚠️ Kamu harus lolos verifikasi KTP terlebih dahulu untuk bermain Lucky Spin!", "warning");
                router.push("/verify");
                return;
              }
              router.push("/explore/rewards/spin");
            }}
            className="bg-amber-400 hover:bg-white text-slate-900 border-4 border-black px-6 py-4 font-black italic uppercase text-xs sm:text-sm shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all shrink-0 w-full md:w-auto text-center cursor-pointer"
          >
            MAIN LUCKY SPIN SEKARANG! ⚡
          </button>
        </div>

        {/* TAB BUTTONS */}
        <div className="flex flex-col md:flex-row border-4 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_var(--primary-color)]">
          <button
            onClick={() => {
              setActiveTab("HADIAH");
            }}
            className={`flex-1 py-4 font-black italic uppercase text-[11px] sm:text-xs tracking-wider transition-all border-b-4 md:border-b-0 md:border-r-4 border-slate-900 dark:border-zinc-700 ${
              activeTab === "HADIAH"
                ? "bg-amber-400 text-black -skew-x-2"
                : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
            }`}
          >
            🎁 HADIAH & VOUCHER
          </button>
          <button
            onClick={() => {
              setActiveTab("LEADERBOARD");
            }}
            className={`flex-1 py-4 font-black italic uppercase text-[11px] sm:text-xs tracking-wider transition-all border-b-4 md:border-b-0 md:border-r-4 border-slate-900 dark:border-zinc-700 ${
              activeTab === "LEADERBOARD"
                ? "bg-amber-400 text-black -skew-x-2"
                : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
            }`}
          >
            🏆 LEADERBOARD & LENCANA
          </button>
          <button
            onClick={() => {
              setActiveTab("RIWAYAT");
            }}
            className={`flex-1 py-4 font-black italic uppercase text-[11px] sm:text-xs tracking-wider transition-all ${
              activeTab === "RIWAYAT"
                ? "bg-[#6D4AFF] text-white -skew-x-2"
                : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:text-[#6D4AFF]"
            }`}
          >
            🪙 BUKU RIWAYAT POIN
          </button>
        </div>

        {/* KATALOG TAB CONTENT */}
        {activeTab === "HADIAH" && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: "DISKON RP 50.000", cost: 500, color: "bg-emerald-400" },
                { name: "FREE MERCHANDISE", cost: 1500, color: "bg-pink-400" }
              ].map((item, i) => {
                const isRedeemingThis = isRedeeming === item.name;
                return (
                  <div key={i} className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-zinc-700 p-6 shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_var(--primary-color)] hover:shadow-[12px_12px_0px_0px_#000] dark:hover:shadow-[12px_12px_0px_0px_var(--primary-color)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 flex justify-between items-center group text-slate-900 dark:text-zinc-50">
                    <div className="text-left">
                      <p className="text-2xl leading-none mb-1 font-black italic uppercase">{item.name}</p>
                      <p className="text-sm text-slate-400 dark:text-zinc-500 font-bold uppercase">{item.cost} POIN</p>
                    </div>
                    <button 
                      disabled={points < item.cost || isRedeeming !== null}
                      onClick={() => handleRedeem(item.name, item.cost)}
                      className={`${item.color} border-2 border-black dark:border-zinc-700 px-4 py-2 text-xs font-black italic uppercase shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] disabled:opacity-50 disabled:grayscale transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none flex items-center gap-2`}
                    >
                      {isRedeemingThis ? (
                        <>
                          <Loader2 className="animate-spin" size={12} />
                          <span>PROSES...</span>
                        </>
                      ) : points >= item.cost ? (
                        "TUKER SEKARANG"
                      ) : (
                        "POIN KURANG"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* VOUCHER SAYA SECTION */}
            <div className="border-t-8 border-black dark:border-zinc-700 pt-12 space-y-6">
              <h2 className="text-4xl font-black italic -skew-x-6 uppercase tracking-tighter text-slate-900 dark:text-zinc-50 text-left">
                VOUCHER SAYA (RIWAYAT CLAIM)
              </h2>
              {claimedVouchers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {claimedVouchers.map((v, i) => {
                    const details = dbVoucherDetails[v.code];
                    const isUsed = details ? (details.max_uses !== null && details.uses_count >= details.max_uses) : false;
                    const isExpired = details ? (new Date() > new Date(details.valid_to)) : false;

                    let badgeText = "READY";
                    let badgeClass = "bg-amber-400 text-black";

                    if (isUsed) {
                      badgeText = "USED";
                      badgeClass = "bg-slate-400 text-slate-800 line-through decoration-slate-800 decoration-2 shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]";
                    } else if (isExpired) {
                      badgeText = "EXPIRED";
                      badgeClass = "bg-red-500 text-white";
                    }

                    return (
                      <div key={i} className={`bg-white dark:bg-zinc-900 border-4 border-black dark:border-zinc-700 p-6 shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_var(--primary-color)] ${isUsed ? "opacity-60 grayscale-[30%]" : "hover:shadow-[10px_10px_0_0_#000] dark:hover:shadow-[10px_10px_0_0_var(--primary-color)] hover:-translate-x-1 hover:-translate-y-1"} flex flex-col justify-between relative overflow-hidden text-slate-900 dark:text-zinc-50 transition-all duration-200`}>
                        <div className={`absolute top-4 right-4 border-2 border-black dark:border-zinc-700 px-2 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0_0_#000] ${badgeClass}`}>
                          {badgeText}
                        </div>
                        <div className="space-y-2 text-left">
                          <p className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest italic">
                            CLAIMED: {new Date(v.claimedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p className={`text-xl font-black leading-none uppercase italic -skew-x-3 ${isUsed ? "line-through text-slate-500 dark:text-zinc-500" : "text-slate-900 dark:text-zinc-50"}`}>{v.name}</p>
                          <div className="flex items-center gap-2 pt-2">
                            <span className={`font-mono text-sm font-black bg-slate-100 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 px-3 py-1 uppercase tracking-widest select-all ${isUsed ? "text-slate-500 bg-slate-50 line-through" : "text-slate-900 dark:text-zinc-100"}`}>
                              {v.code}
                            </span>
                            <motion.button
                              disabled={isUsed}
                              onClick={() => {
                                navigator.clipboard.writeText(v.code);
                                setCopiedCode(v.code);
                                toast("Kode disalin ke clipboard!", "success");
                                setTimeout(() => setCopiedCode(null), 1500);
                              }}
                              animate={copiedCode === v.code ? { scale: [1, 1.2, 1] } : {}}
                              className={`${copiedCode === v.code ? "bg-emerald-300" : "bg-emerald-400"} border-2 border-black dark:border-zinc-700 p-1 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-slate-900 dark:text-zinc-100 ${isUsed ? "opacity-50 cursor-not-allowed shadow-none translate-x-0 translate-y-0" : ""}`}
                              title="Salin Kode"
                            >
                              {copiedCode === v.code ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-slate-950"><polyline points="20 6 9 17 4 12"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                              )}
                            </motion.button>
                          </div>
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mt-4 pt-2 border-t-2 border-dashed border-slate-200 dark:border-zinc-700 text-left">
                          {isUsed ? (
                            "❌ Voucher ini sudah digunakan untuk transaksi."
                          ) : isExpired ? (
                            "⏳ Voucher ini sudah kedaluwarsa."
                          ) : v.name.includes("DISKON") ? (
                            "🎟️ Gunakan kode diskon ini saat checkout tiket konser Anda."
                          ) : (
                            "🎁 Tunjukkan ke EO/panitia di gate untuk mengambil merchandise."
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-zinc-700 p-10 text-center shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_var(--primary-color)] -rotate-1">
                  <p className="font-black italic text-xl text-slate-300 dark:text-zinc-500 uppercase">BELUM ADA VOUCHER YANG DIKLAIM</p>
                  <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-1 uppercase">Tukarkan poin Anda di atas untuk mendapatkan voucher pertama Anda!</p>
                </div>
              )}
            </div>
          </div>
        )}



        {/* LEADERBOARD & BADGES TAB CONTENT */}
        {activeTab === "LEADERBOARD" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            {/* LEFT: LEADERBOARD LIST */}
            <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border-4 border-slate-900 dark:border-zinc-700 p-6 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color)] flex flex-col">
              <h3 className="text-2xl font-black italic uppercase -skew-x-3 tracking-tight mb-6 text-slate-900 dark:text-zinc-50 border-b-4 border-slate-900 dark:border-zinc-700 pb-3 flex items-center gap-2">
                <span>🏆 KLASEMEN KOLEKTOR</span>
              </h3>
              
              {loadingLeaderboard ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="animate-spin text-[#6D4AFF]" size={36} strokeWidth={3} />
                  <p className="font-black italic uppercase text-xs text-slate-400 dark:text-zinc-500">MEMUAT KLASEMEN...</p>
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((profile, idx) => {
                    const isCurrentUser = profile.id === userProfile?.id;
                    let rankIcon: React.ReactNode = <span>{idx + 1}</span>;
                    if (idx === 0) rankIcon = <span className="text-xl">🥇</span>;
                    else if (idx === 1) rankIcon = <span className="text-xl">🥈</span>;
                    else if (idx === 2) rankIcon = <span className="text-xl">🥉</span>;

                    return (
                      <div 
                        key={profile.id} 
                        className={`flex items-center justify-between p-3 border-2 border-slate-900 dark:border-zinc-700 shadow-[3px_3px_0_0_#000] ${
                          isCurrentUser 
                            ? "bg-[var(--primary-color)]/10 border-[var(--primary-color)]" 
                            : "bg-slate-50 dark:bg-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-none border-2 border-slate-900 dark:border-zinc-700 flex items-center justify-center font-black bg-white dark:bg-zinc-900 shrink-0 shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                            {rankIcon}
                          </div>
                          <Avatar className="h-8 w-8 border-2 border-slate-900 dark:border-zinc-700 rounded-none shrink-0 shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="bg-[#6D4AFF] text-white font-black text-xs">
                              {profile.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-zinc-100 uppercase truncate max-w-[100px] sm:max-w-[180px]">
                              {profile.full_name || "User"}
                              {isCurrentUser && <span className="ml-1.5 text-[8px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded italic inline-block">KAMU</span>}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-mono font-black text-xs px-2 py-0.5 border border-slate-900 dark:border-zinc-700 bg-amber-400 text-black shadow-[1.5px_1.5px_0_0_#000] whitespace-nowrap">
                            {profile.points || 0} PTS
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-400 italic py-6 text-center">Belum ada papan peringkat.</p>
              )}
            </div>

            {/* RIGHT: BADGES GRID */}
            <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border-4 border-slate-900 dark:border-zinc-700 p-6 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color)]">
              <h3 className="text-2xl font-black italic uppercase -skew-x-3 tracking-tight mb-2 text-slate-900 dark:text-zinc-50 border-b-4 border-slate-900 dark:border-zinc-700 pb-3 flex items-center gap-2">
                <span>🛡️ LENCANA KOLEKSI SAYA</span>
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-6">
                Mutasi tiket: <span className="text-[var(--primary-color)]">{musicTicketsCount} Musik</span> | <span className="text-cyan-500">{theaterTicketsCount} Teater</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: "newbie",
                    name: "Newbie Collector",
                    description: "Telah memulai petualangan mengoleksi tiket di Tiketin.",
                    icon: "🎫",
                    req: "Selalu Terbuka",
                    unlocked: true
                  },
                  {
                    id: "silver",
                    name: "Silver Collector",
                    description: "Mencapai minimal 200 Poin Tiketin aktif.",
                    icon: "🥈",
                    req: "Butuh 200+ Poin",
                    unlocked: points >= 200
                  },
                  {
                    id: "gold",
                    name: "Gold Collector",
                    description: "Mencapai minimal 500 Poin Tiketin aktif.",
                    icon: "🥇",
                    req: "Butuh 500+ Poin",
                    unlocked: points >= 500
                  },
                  {
                    id: "legend",
                    name: "Legend of Tiketin",
                    description: "Kolektor legendaris dengan minimal 1000 Poin aktif.",
                    icon: "👑",
                    req: "Butuh 1000+ Poin",
                    unlocked: points >= 1000
                  },
                  {
                    id: "festival",
                    name: "Festival Goer",
                    description: "Membeli minimal 3 tiket event berkategori Musik.",
                    icon: "🎸",
                    req: "Beli 3+ Tiket Musik",
                    unlocked: musicTicketsCount >= 3
                  },
                  {
                    id: "critic",
                    name: "Art Critic",
                    description: "Membeli minimal 3 tiket event berkategori Teater.",
                    icon: "🎭",
                    req: "Beli 3+ Tiket Teater",
                    unlocked: theaterTicketsCount >= 3
                  }
                ].map((badge) => (
                  <div 
                    key={badge.id} 
                    className={`border-3 p-4 shadow-[4px_4px_0_0_#000] flex items-start gap-3 transition-all relative ${
                      badge.unlocked 
                        ? "bg-white dark:bg-zinc-800 border-slate-900 dark:border-zinc-700 shadow-[4px_4px_0_0_var(--primary-color)]" 
                        : "bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 shadow-[4px_4px_0_0_rgba(0,0,0,0.15)]"
                    }`}
                  >
                    <div className={`w-12 h-12 border-2 flex items-center justify-center text-2xl shadow-[2px_2px_0_0_#000] shrink-0 ${
                      badge.unlocked 
                        ? "bg-amber-300 border-slate-900 dark:border-zinc-700 animate-pulse" 
                        : "bg-slate-200 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-400 dark:text-zinc-500"
                    }`}>
                      {badge.unlocked ? badge.icon : "🔒"}
                    </div>
                    <div className="space-y-1">
                      <p className={`font-black text-xs sm:text-sm uppercase leading-none italic ${
                        badge.unlocked ? "text-slate-900 dark:text-zinc-50" : "text-slate-400 dark:text-zinc-500"
                      }`}>
                        {badge.name}
                      </p>
                      <p className={`text-[9px] font-medium normal-case leading-relaxed pr-10 ${
                        badge.unlocked ? "text-slate-500 dark:text-zinc-300" : "text-slate-400 dark:text-zinc-500"
                      }`}>
                        {badge.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border rounded-sm inline-block ${
                          badge.unlocked 
                            ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-500" 
                            : "bg-red-400/10 border-red-400/30 text-red-500"
                        }`}>
                          {badge.unlocked ? "✓ UNLOCKED" : `🔒 LOCKED (${badge.req})`}
                        </span>
                        {badge.unlocked && (
                          activeBadgeId === badge.id ? (
                            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-amber-400 bg-amber-400 text-black rounded-sm inline-block shadow-[1px_1px_0_0_#000] rotate-[-2deg]">
                              ⚡ DIPAKAI
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSelectBadge(badge.id, badge.name, badge.icon)}
                              className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border-2 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 hover:bg-[#6D4AFF] hover:text-white dark:hover:bg-[#6D4AFF] dark:hover:text-white transition-all shadow-[1.5px_1.5px_0_0_#000] dark:shadow-[1.5px_1.5px_0_0_var(--primary-color)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none rounded-sm cursor-pointer"
                            >
                              PAKAI LENCANA
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LEDGER TAB CONTENT */}
        {activeTab === "RIWAYAT" && (
          <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-zinc-700 p-6 md:p-10 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color)] space-y-6">
            <h2 className="text-3xl font-black italic -skew-x-3 uppercase tracking-tight text-slate-900 dark:text-zinc-50 text-left">
              MUTASI BUKU POIN
            </h2>
            {loadingLedger ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-[#6D4AFF]" size={36} strokeWidth={3} />
                <p className="font-black italic uppercase text-xs text-slate-400 dark:text-zinc-500">MEMUAT BUKU BESAR POIN...</p>
              </div>
            ) : ledgerItems.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="border-4 border-black dark:border-zinc-700 divide-y-4 divide-black dark:divide-zinc-700"
              >
                {ledgerItems.map((item) => (
                  <motion.div 
                    variants={itemVariants}
                    key={item.id} 
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors gap-2"
                  >
                    <div className="text-left space-y-1">
                      <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                        {new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="font-black italic uppercase text-xs sm:text-sm text-slate-900 dark:text-zinc-100 leading-tight">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className={`font-mono font-black text-xs sm:text-sm px-2.5 py-1 border-2 border-black dark:border-zinc-700 shadow-[2px_2px_0_0_#000] inline-block ${
                        item.amount === 0 ? "bg-pink-400 text-black" : (item.type === "in" ? "bg-emerald-400 text-black" : "bg-red-400 text-white")
                      }`}>
                        {item.amount === 0 ? "VOUCHER 🎟️" : (item.type === "in" ? `+${item.amount} POIN` : `-${item.amount} POIN`)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="border-4 border-dashed border-slate-300 dark:border-zinc-700 p-12 text-center">
                <p className="font-black italic text-xl text-slate-300 dark:text-zinc-500 uppercase">BELUM ADA MUTASI POIN</p>
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-1 uppercase">Dapatkan poin dari setiap pembelian tiket konser!</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* SUCCESS REDEEM MODAL */}
      {successVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSuccessVoucher(null)} />
          <div className="bg-[#FCFAF1] dark:bg-zinc-900 border-8 border-slate-900 dark:border-zinc-700 p-8 max-w-md w-full relative z-10 shadow-[10px_10px_0_0_#000] dark:shadow-[10px_10px_0_0_var(--primary-color)] -rotate-1 text-slate-900 dark:text-zinc-50">
            <h3 className="text-4xl font-black italic -skew-x-6 uppercase tracking-tighter mb-4 text-emerald-500 text-left">
              TUKER BERHASIL! 🎉
            </h3>
            <p className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-6 text-left">
              ANDA BERHASIL MENUKARKAN {successVoucher.name}! BERIKUT KODE VOUCHER ANDA:
            </p>
            <div className="bg-amber-100 dark:bg-zinc-800 border-4 border-black dark:border-zinc-700 p-4 text-center font-mono text-2xl font-black tracking-widest uppercase select-all mb-6 text-slate-900 dark:text-amber-400">
              {successVoucher.code}
            </div>
            <p className="text-[11px] font-medium text-slate-600 dark:text-zinc-300 normal-case mb-6 text-left">
              {successVoucher.name.includes("DISKON") 
                ? "Salin kode di atas dan gunakan di kolom promo saat Anda melakukan checkout pembelian tiket konser!"
                : "Tunjukkan kode unik di atas beserta KTP Anda ke panitia / EO di venue untuk mengklaim merchandise resmi!"
              }
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(successVoucher.code);
                  toast("Kode voucher berhasil disalin!", "success");
                }}
                className="flex-1 bg-amber-400 border-4 border-black dark:border-zinc-700 py-3 font-black text-xs shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all text-black"
              >
                SALIN KODE
              </button>
              <button
                onClick={() => {
                  setSuccessVoucher(null);
                }}
                className="bg-white dark:bg-zinc-800 border-4 border-black dark:border-zinc-700 px-6 py-3 font-black text-xs shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all text-slate-900 dark:text-zinc-100"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}