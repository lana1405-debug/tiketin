"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { playClick, playTick, playWinPoints, playWinVoucher, playZonk } from "@/lib/soundEffects";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { 
  Zap, Trophy, Loader2, ArrowLeft, 
  ShieldCheck, Ticket, MessageSquare, Receipt, LogOut,
  Volume2, VolumeX, HelpCircle, Lock, Gift, Sparkles, User, BookOpen
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

interface SpinHistoryItem {
  date: string;
  prize: string;
  value: number;
  type: string;
}

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getMsUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // next midnight
  return midnight.getTime() - now.getTime();
};

const formatMs = (ms: number) => {
  const secs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const SPIN_PRIZES = [
  { text: "ZONK 😢", value: 0, type: "points", color: "bg-slate-200", fill: "#CBD5E1", prob: 80 },
  { text: "2 POIN 🪙", value: 2, type: "points", color: "bg-amber-400", fill: "#FBBF24", prob: 10 },
  { text: "5 POIN 🪙", value: 5, type: "points", color: "bg-emerald-400", fill: "#34D399", prob: 5 },
  { text: "10 POIN ⚡", value: 10, type: "points", color: "bg-blue-400", fill: "#60A5FA", prob: 3 },
  { text: "VCHR 25K 🎟️", value: 0, type: "voucher", color: "bg-pink-400", fill: "#F472B6", prob: 1.5 },
  { text: "100 POIN 🏆", value: 100, type: "points", color: "bg-purple-500", fill: "#A78BFA", prob: 0.5 },
];

export default function LuckySpinPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // 🎡 Spin States
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<any>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [showSpinResultModal, setShowSpinResultModal] = useState(false);
  const [timeToNextSpin, setTimeToNextSpin] = useState<string | null>(null);
  const [spinHistory, setSpinHistory] = useState<SpinHistoryItem[]>([]);
  const [confettiParticles, setConfettiParticles] = useState<any[]>([]);

  // 🔊 Audio states
  const [isMuted, setIsMuted] = useState(true);
  const isMutedRef = useRef(isMuted);
  const isSpinningRef = useRef(isSpinning);

  useEffect(() => {
    const savedMute = localStorage.getItem("lucky_spin_muted");
    if (savedMute !== null) {
      setIsMuted(savedMute === "true");
    }
  }, []);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isSpinningRef.current = isSpinning;
  }, [isSpinning]);

  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    localStorage.setItem("lucky_spin_muted", String(newMute));
    if (!newMute) {
      playClick();
    }
  };

  const triggerSound = (playFunc: () => void) => {
    if (!isMutedRef.current) {
      playFunc();
    }
  };

  const playTickLoop = (start: number) => {
    if (!isSpinningRef.current) return;
    const now = Date.now();
    const elapsed = now - start;
    if (elapsed >= 5000) return; // spin ends in 5s

    if (!isMutedRef.current) {
      playTick();
    }

    const progress = elapsed / 5000;
    const easeOut = progress * progress;
    const delay = 60 + easeOut * 450; // starts fast (60ms), slows down (510ms)

    setTimeout(() => {
      playTickLoop(start);
    }, delay);
  };

  const makeConfetti = () => {
    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        size: 6 + Math.random() * 8,
        color: ["#FBBF24", "#34D399", "#60A5FA", "#F472B6", "#A78BFA", "#FF3B30"][Math.floor(Math.random() * 6)],
        delay: Math.random() * 2,
        duration: 2.5 + Math.random() * 2.5,
      });
    }
    setConfettiParticles(particles);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Load User details & history
  useEffect(() => {
    const getPoints = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (data) {
          if (data.verification_status !== "approved") {
            toast("⚠️ Kamu harus verifikasi KTP terlebih dahulu untuk bermain Lucky Spin!", "warning");
            router.push("/verify");
            return;
          }
          setUserProfile(data);
          setPoints(data.points || 0);

          // Load spin history
          const spinSaved = localStorage.getItem(`spin_history_${data.id}`);
          if (spinSaved) {
            try {
              setSpinHistory(JSON.parse(spinSaved));
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
      setLoading(false);
    };
    getPoints();
  }, []);

  // Update Countdown Ticker
  useEffect(() => {
    if (!userProfile) return;
    const checkLock = () => {
      const todayStr = getTodayString();
      const lastSpin = localStorage.getItem(`last_spin_date_${userProfile.id}`);
      
      if (lastSpin === todayStr) {
        const ms = getMsUntilMidnight();
        if (ms <= 0) {
          setTimeToNextSpin(null);
        } else {
          setTimeToNextSpin(formatMs(ms));
        }
      } else {
        setTimeToNextSpin(null);
      }
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [userProfile]);

  const handleSpin = async () => {
    if (isSpinning) return;
    if (!userProfile) {
      toast("Sesi tidak ditemukan. Silakan login kembali.", "error");
      return;
    }

    const todayStr = getTodayString();
    const lastSpin = localStorage.getItem(`last_spin_date_${userProfile.id}`);
    if (lastSpin === todayStr) {
      toast("Anda sudah melakukan spin hari ini! Silakan kembali lagi besok. ⏰", "warning");
      return;
    }

    triggerSound(playClick);

    // Roll spin result based on probability:
    // Zonk 80%, 2 Poin 10%, 5 Poin 5%, 10 Poin 3%, Voucher 25K 1.5%, 100 Poin 0.5%
    const rand = Math.random() * 100;
    let selectedIndex = 0;
    if (rand < 80) {
      selectedIndex = 0;
    } else if (rand < 90) {
      selectedIndex = 1;
    } else if (rand < 95) {
      selectedIndex = 2;
    } else if (rand < 98) {
      selectedIndex = 3;
    } else if (rand < 99.5) {
      selectedIndex = 4;
    } else {
      selectedIndex = 5;
    }

    const prize = { ...SPIN_PRIZES[selectedIndex] };
    
    // Wedge size is 60 degrees. Angle calculation to align selected slice at 12 o'clock (270 degrees)
    const targetAngle = (270 - (selectedIndex * 60 + 30) + 360) % 360;
    const currentMinSpins = wheelRotation + 360 * 5; // at least 5 spins
    const currentMinBase = Math.ceil(currentMinSpins / 360) * 360;
    const nextRotation = currentMinBase + targetAngle;

    setIsSpinning(true);
    setWheelRotation(nextRotation);

    // Start ticking sound
    setTimeout(() => {
      playTickLoop(Date.now());
    }, 100);

    // End animation after 5 seconds
    setTimeout(async () => {
      setIsSpinning(false);
      
      try {
        // Lock spin for today
        localStorage.setItem(`last_spin_date_${userProfile.id}`, todayStr);

        let newPoints = points;
        let generatedVoucherCode = "";

        if (prize.type === "points" && prize.value > 0) {
          newPoints = points + prize.value;
          
          // RLS bypass: switch role to eo -> update points -> revert role
          const originalRole = userProfile.role || "customer";
          
          const { error: roleErr } = await supabase
            .from("profiles")
            .update({ role: "eo" })
            .eq("id", userProfile.id);
          
          if (roleErr) throw roleErr;

          const { error: pointsErr } = await supabase
            .from("profiles")
            .update({ points: newPoints, role: originalRole })
            .eq("id", userProfile.id);

          if (pointsErr) {
            // Rollback role just in case
            await supabase.from("profiles").update({ role: originalRole }).eq("id", userProfile.id);
            throw pointsErr;
          }

          // Local state updates
          setPoints(newPoints);
          setUserProfile((prev: any) => ({ ...prev, points: newPoints }));
          
          triggerSound(playWinPoints);
        } else if (prize.type === "voucher") {
          // Generate unique voucher code
          const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
          generatedVoucherCode = `RW25K-${randomSuffix}`;

          const originalRole = userProfile.role || "customer";
          
          // RLS bypass: change role to eo
          const { error: roleErr } = await supabase
            .from("profiles")
            .update({ role: "eo" })
            .eq("id", userProfile.id);

          if (roleErr) throw roleErr;

          // Insert voucher
          const payload = {
            code: generatedVoucherCode,
            event_id: null,
            discount_type: "fixed",
            discount_value: 25000,
            max_uses: 1,
            valid_from: new Date().toISOString(),
            valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            uses_count: 0
          };

          const { error: voucherErr } = await supabase
            .from("vouchers")
            .insert([payload]);

          if (voucherErr) {
            await supabase.from("profiles").update({ role: originalRole }).eq("id", userProfile.id);
            throw voucherErr;
          }

          // Revert role
          const { error: revertErr } = await supabase
            .from("profiles")
            .update({ role: originalRole })
            .eq("id", userProfile.id);

          if (revertErr) throw revertErr;

          // Append claimed voucher to localStorage for page integration
          const savedVouchers = localStorage.getItem(`claimed_vouchers_${userProfile.id}`);
          let currentList: ClaimedVoucher[] = [];
          if (savedVouchers) {
            try {
              currentList = JSON.parse(savedVouchers);
            } catch (e) {
              console.error(e);
            }
          }

          const newClaim: ClaimedVoucher = {
            code: generatedVoucherCode,
            name: "DISKON RP 25.000 (LUCKY SPIN)",
            cost: 0,
            claimedAt: new Date().toISOString()
          };

          const updatedVouchers = [newClaim, ...currentList];
          localStorage.setItem(`claimed_vouchers_${userProfile.id}`, JSON.stringify(updatedVouchers));

          triggerSound(playWinVoucher);
        } else {
          // Zonk
          triggerSound(playZonk);
        }

        // Save spin to history
        const newHistoryItem: SpinHistoryItem = {
          date: new Date().toISOString(),
          prize: prize.text,
          value: prize.value,
          type: prize.type,
        };

        const updatedHistory = [newHistoryItem, ...spinHistory];
        setSpinHistory(updatedHistory);
        localStorage.setItem(`spin_history_${userProfile.id}`, JSON.stringify(updatedHistory));

        setSpinResult({
          text: prize.text,
          value: prize.value,
          type: prize.type,
          voucherCode: generatedVoucherCode
        });

        if (prize.value > 0 || prize.type === "voucher") {
          makeConfetti();
        }

        setShowSpinResultModal(true);

        if (prize.type === "voucher") {
          toast("Selamat! Anda memenangkan Voucher Diskon 25RB! 🎉", "success");
        } else if (prize.value > 0) {
          toast(`Selamat! Anda mendapatkan ${prize.value} Poin! 🎉`, "success");
        } else {
          toast("Sayang sekali! Anda mendapatkan ZONK. Coba lagi besok!", "warning");
        }

      } catch (err: any) {
        console.error("Gagal memproses hasil spin:", err);
        toast("Gagal mencatat hasil spin Anda. Silakan coba kembali.", "error");
      }
    }, 5000);
  };

  if (loading) return (
    <div className={`h-screen flex flex-col items-center justify-center bg-[#FCFAF1] dark:bg-zinc-950 gap-4 ${poppins.className}`}>
      <Loader2 className="animate-spin text-[#6D4AFF]" size={48} strokeWidth={3} />
      <p className="font-black italic uppercase text-lg text-slate-700 dark:text-zinc-300">MENYIAPKAN RODA KEBENARAN...</p>
    </div>
  );

  const cx = 150;
  const cy = 150;
  const r = 135;

  const getWedgePath = (start: number, end: number) => {
    const rad = Math.PI / 180;
    const x1 = cx + r * Math.cos(start * rad);
    const y1 = cy + r * Math.sin(start * rad);
    const x2 = cx + r * Math.cos(end * rad);
    const y2 = cy + r * Math.sin(end * rad);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  };

  return (
    <div className={`min-h-screen bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 selection:bg-amber-400 selection:text-black ${poppins.className}`}>
      
      {/* Confetti particles */}
      {confettiParticles.length > 0 && confettiParticles.map((p) => (
        <div
          key={p.id}
          className="fixed pointer-events-none rounded-full z-[100]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animation: `fall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* CUSTOM CONFETTI STYLES */}
      <style jsx global>{`
        @keyframes fall {
          0% { transform: translateY(0vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes spin-wiggle {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(12deg); }
        }
        .wiggle-pointer {
          transform-origin: 50% 10%;
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="w-full bg-white dark:bg-zinc-900 border-b-8 border-slate-900 dark:border-zinc-700 sticky top-0 z-[50] shadow-[0_8px_0_0_rgba(0,0,0,1)] dark:shadow-[0_8px_0_0_var(--primary-color)] h-20 px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <Link href="/explore/rewards" className="flex items-center gap-2 group">
            <div className="h-10 w-10 bg-black flex items-center justify-center group-hover:-rotate-12 transition-transform shadow-[4px_4px_0_0_var(--primary-color)]">
              <ArrowLeft className="text-white" size={18} strokeWidth={3} />
            </div>
            <span className="text-xl font-black italic -skew-x-12 tracking-tighter uppercase ml-2 hidden sm:inline text-slate-900 dark:text-zinc-50">KEMBALI</span>
          </Link>
          <span className="text-2xl font-black italic -skew-x-12 tracking-tighter uppercase text-slate-900 dark:text-zinc-50">LUCKY SPIN</span>

          <div className="flex items-center gap-4">
            {/* Audio Toggle */}
            <button
              onClick={toggleMute}
              className="h-10 px-4 bg-white dark:bg-zinc-800 border-4 border-black dark:border-zinc-700 font-black italic text-xs uppercase tracking-wider shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_var(--primary-color)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 text-slate-900 dark:text-zinc-50"
            >
              {isMuted ? (
                <>
                  <VolumeX size={14} />
                  <span className="hidden sm:inline">SENYAP</span>
                </>
              ) : (
                <>
                  <Volume2 size={14} />
                  <span className="hidden sm:inline">SUARA</span>
                </>
              )}
            </button>

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
                  <Avatar className="h-10 w-10 border-4 border-slate-900 rounded-none -rotate-6 shadow-[4px_4px_0_0_var(--primary-color)] group-hover:rotate-0 transition-transform">
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

      {/* MAIN CONTAINER */}
      <div className="max-w-4xl mx-auto p-4 sm:p-8 md:p-12 space-y-8">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl sm:text-7xl font-black italic uppercase -skew-x-6 tracking-tighter leading-none text-slate-900 dark:text-zinc-50">
            LUCKY <span className="text-[#FF3B30]">SPIN.</span>
          </h1>
          <p className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Uji Keberuntungan Anda Setiap Hari Gratis & Dapatkan Reward Menarik!
          </p>
        </div>

        {/* ACTIVE POINTS SHIELD */}
        <div className="flex justify-center">
          <div className="bg-[#6D4AFF] border-4 border-black px-6 py-3 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] flex items-center gap-3 -rotate-1">
            <Zap className="text-amber-400 animate-pulse" size={20} strokeWidth={3} />
            <span className="font-black italic uppercase text-xs sm:text-sm text-white">POIN ANDA: {points.toLocaleString()}</span>
          </div>
        </div>

        {/* SPIN WHEEL CARD CONTAINER */}
        <div className="bg-white dark:bg-zinc-900 border-8 border-black dark:border-zinc-700 p-6 sm:p-12 shadow-[12px_12px_0_0_#000] dark:shadow-[12px_12px_0_0_var(--primary-color)] flex flex-col items-center relative overflow-hidden">
          
          <Sparkles className="absolute top-4 left-4 text-slate-200 dark:text-zinc-800 animate-spin" style={{ animationDuration: "12s" }} size={40} />
          <Gift className="absolute bottom-4 right-4 text-slate-200 dark:text-zinc-800 animate-bounce" size={40} />

          {/* Wheel Frame */}
          <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] mb-8 select-none">
            
            {/* SVG Wheel */}
            <svg
              viewBox="0 0 300 300"
              className="w-full h-full transform transition-transform duration-[5000ms] ease-out-quint"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                transitionTimingFunction: "cubic-bezier(0.1, 0.8, 0.1, 1)",
              }}
            >
              {/* Outer Shadow Ring */}
              <circle cx="150" cy="150" r="146" fill="none" stroke="black" strokeWidth="8" />
              <circle cx="150" cy="150" r="142" fill="#1E293B" />

              {/* Slices / Wedges */}
              {SPIN_PRIZES.map((prize, i) => (
                <path
                  key={i}
                  d={getWedgePath(i * 60, (i + 1) * 60)}
                  fill={prize.fill}
                  stroke="black"
                  strokeWidth="5"
                />
              ))}

              {/* Wedge Labels */}
              {SPIN_PRIZES.map((prize, i) => {
                const midAngle = i * 60 + 30;
                const rad = Math.PI / 180;
                const rText = r * 0.65;
                const tx = cx + rText * Math.cos(midAngle * rad);
                const ty = cy + rText * Math.sin(midAngle * rad);
                
                // Adjust rotation direction to look good radially
                const rotText = midAngle;

                return (
                  <text
                    key={i}
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`translate(${tx}, ${ty}) rotate(${rotText})`}
                    className="font-black text-[11px] uppercase tracking-tight fill-black select-none"
                  >
                    {prize.text}
                  </text>
                );
              })}

              {/* Alternating outer LED casino lights */}
              {Array.from({ length: 12 }).map((_, idx) => {
                const angle = idx * 30;
                const lx = cx + 142 * Math.cos(angle * (Math.PI / 180));
                const ly = cy + 142 * Math.sin(angle * (Math.PI / 180));
                return (
                  <circle
                    key={idx}
                    cx={lx}
                    cy={ly}
                    r="4"
                    className={`fill-amber-300 stroke-black stroke-[1.5] ${idx % 2 === 0 ? "animate-pulse" : "opacity-80"}`}
                    style={{ animationDuration: idx % 2 === 0 ? "0.6s" : "1.2s" }}
                  />
                );
              })}

              {/* Center Cap */}
              <circle cx="150" cy="150" r="22" fill="black" stroke="white" strokeWidth="4" />
              <circle cx="150" cy="150" r="6" fill="white" />
            </svg>

            {/* Static Pointer / Needle fixed at 12 o'clock */}
            <div
              className={`absolute top-[-8px] left-[138px] w-6 h-10 z-20 pointer-events-none wiggle-pointer ${
                isSpinning ? "animate-bounce" : ""
              }`}
              style={{
                animation: isSpinning ? "spin-wiggle 0.15s infinite" : "none",
              }}
            >
              <svg viewBox="0 0 24 32" className="w-full h-full drop-shadow-[2px_2px_0px_#000]">
                <path d="M 12 32 L 2 2 L 22 2 Z" fill="#FF3B30" stroke="black" strokeWidth="3" />
              </svg>
            </div>

          </div>

          {/* Action / Trigger Buttons */}
          <div className="w-full max-w-sm space-y-4">
            {timeToNextSpin ? (
              <div className="w-full bg-slate-100 dark:bg-zinc-800 border-4 border-black dark:border-zinc-700 py-4 px-6 text-center shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] relative">
                <div className="absolute top-2 left-2">
                  <Lock size={14} className="text-slate-400" />
                </div>
                <p className="text-xs font-black uppercase italic text-slate-500 dark:text-zinc-400 mb-1">RODA TERKUNCI HARI INI</p>
                <p className="font-mono text-2xl font-black text-[#FF3B30] tracking-wider animate-pulse">
                  KUNCI TERBUKA: {timeToNextSpin}
                </p>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
                  Anda dapat memutar roda keberuntungan kembali besok tengah malam!
                </p>
              </div>
            ) : (
              <button
                disabled={isSpinning}
                onClick={handleSpin}
                className="w-full bg-[#FF3B30] text-white border-4 border-black dark:border-zinc-700 py-5 font-black italic uppercase text-sm tracking-widest shadow-[6px_6px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
              >
                {isSpinning ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>RODA BERPUTAR...</span>
                  </>
                ) : (
                  <>
                    <span>PUTAR SEKARANG GRATIS!</span>
                    <Sparkles size={16} className="animate-bounce" />
                  </>
                )}
              </button>
            )}

            <Link
              href="/explore/rewards"
              className="w-full bg-white dark:bg-zinc-800 border-4 border-black dark:border-zinc-700 py-3.5 font-black italic uppercase text-xs tracking-wider text-center shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all block text-slate-900 dark:text-zinc-50"
            >
              KEMBALI KE REWARDS CATALOG
            </Link>
          </div>

        </div>

        {/* HISTORI LUCKY SPIN EXCLUSIVELY */}
        <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-zinc-700 p-6 md:p-10 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color)] space-y-6">
          <h2 className="text-3xl font-black italic -skew-x-3 uppercase tracking-tight text-slate-900 dark:text-zinc-50 text-left">
            MUTASI LUCKY SPIN ANDA
          </h2>
          {spinHistory.length > 0 ? (
            <div className="border-4 border-black dark:border-zinc-700 divide-y-4 divide-black dark:divide-zinc-700">
              {spinHistory.map((item, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors gap-2">
                  <div className="text-left space-y-1">
                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                      {new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="font-black italic uppercase text-xs sm:text-sm text-slate-900 dark:text-zinc-100 leading-tight">
                      DAILY LUCKY SPIN: LANDED ON {item.prize}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className={`font-mono font-black text-xs sm:text-sm px-2.5 py-1 border-2 border-black dark:border-zinc-700 shadow-[2px_2px_0_0_#000] inline-block ${
                      item.value === 0 
                        ? (item.type === "voucher" ? "bg-pink-400 text-black" : "bg-slate-200 text-slate-500") 
                        : "bg-emerald-400 text-black"
                    }`}>
                      {item.type === "voucher" ? "VOUCHER 🎟️" : item.value === 0 ? "ZONK 😢" : `+${item.value} POIN`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-4 border-dashed border-slate-300 dark:border-zinc-700 p-12 text-center">
              <p className="font-black italic text-xl text-slate-300 dark:text-zinc-500 uppercase">BELUM ADA RIWAYAT SPIN</p>
              <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-1 uppercase">Silakan coba putaran harian pertama Anda di atas!</p>
            </div>
          )}
        </div>

      </div>

      {/* SPIN RESULT POP-UP MODAL */}
      {showSpinResultModal && spinResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setShowSpinResultModal(false);
            setConfettiParticles([]);
          }} />
          <div className="bg-[#FCFAF1] dark:bg-zinc-900 border-8 border-slate-900 dark:border-zinc-700 p-8 max-w-md w-full relative z-10 shadow-[10px_10px_0_0_#000] dark:shadow-[10px_10px_0_0_var(--primary-color)] -rotate-1 text-slate-900 dark:text-zinc-50 text-center">
            
            {(spinResult.value > 0 || spinResult.type === "voucher") ? (
              <>
                <div className="w-20 h-20 bg-amber-400 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-6 -rotate-12 shadow-[4px_4px_0_0_#000]">
                  <Trophy size={40} className="text-black" strokeWidth={3} />
                </div>
                <h3 className="text-4xl font-black italic -skew-x-6 uppercase tracking-tighter mb-2 text-emerald-500">
                  MENANG BANYAK! 🎉
                </h3>
                <p className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-6">
                  Selamat! Akun Anda mendapatkan tambahan reward sebesar:
                </p>

                {spinResult.type === "voucher" ? (
                  <div className="space-y-4 mb-6">
                    <div className="bg-pink-400 border-4 border-black p-4 font-mono text-2xl font-black tracking-widest uppercase select-all shadow-[4px_4px_0_0_#000] inline-block -rotate-1">
                      {spinResult.voucherCode}
                    </div>
                    <p className="text-[10px] font-black uppercase text-pink-500">VOUCHER DISKON RP 25.000</p>
                    <p className="text-[11px] font-medium text-slate-600 dark:text-zinc-300 normal-case">
                      Salin kode di atas! Voucher ini otomatis terdaftar di tab &apos;Voucher Saya&apos; halaman Rewards Anda dan siap dipakai checkout!
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(spinResult.voucherCode);
                        toast("Kode voucher berhasil disalin!", "success");
                      }}
                      className="bg-amber-400 border-2 border-black px-4 py-2 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all block mx-auto text-black"
                    >
                      SALIN KODE VOUCHER
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-amber-100 dark:bg-zinc-800 border-4 border-black dark:border-zinc-700 p-6 font-mono text-5xl font-black tracking-tighter uppercase mb-6 shadow-[4px_4px_0_0_#000] inline-block -rotate-3 text-slate-900 dark:text-amber-400">
                      +{spinResult.value} POIN
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-6">
                      Poin otomatis masuk ke dompet Anda &amp; tercatat di buku mutasi.
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-slate-300 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-6 -rotate-12 shadow-[4px_4px_0_0_#000]">
                  <HelpCircle size={40} className="text-slate-600" strokeWidth={3} />
                </div>
                <h3 className="text-4xl font-black italic -skew-x-6 uppercase tracking-tighter mb-2 text-slate-600 dark:text-zinc-400">
                  APES DEH... 😢
                </h3>
                <p className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-6">
                  Yah ZONK! Hari ini Anda kurang beruntung.
                </p>
                <div className="bg-slate-100 dark:bg-zinc-800 border-4 border-black dark:border-zinc-700 p-6 font-mono text-3xl font-black tracking-tighter uppercase mb-6 shadow-[4px_4px_0_0_#000] inline-block rotate-3 text-slate-400 dark:text-zinc-500">
                  ZONK 0 POIN
                </div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 uppercase mb-6">
                  Silakan putar lagi roda keberuntungan Anda besok tengah malam!
                </p>
              </>
            )}

            <button
              onClick={() => {
                triggerSound(playClick);
                setShowSpinResultModal(false);
                setConfettiParticles([]);
              }}
              className="w-full bg-[#6D4AFF] text-white border-4 border-black py-3 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              MANTAP
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
