"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { 
  Zap, Trophy, Loader2, ArrowLeft, 
  Clock, CheckCircle2, XCircle, AlertCircle, HelpCircle,
  HelpCircle as QuestionIcon, Award, RotateCcw, Volume2, VolumeX,
  ShieldCheck, Ticket, MessageSquare, Receipt, LogOut, User, BookOpen
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast-brutal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "@/components/NotificationBell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizConfig {
  activeTopic: "MUSIK" | "TEATER" | "BANDUNG";
  rewardPoints: number;
  questions: Question[];
}

const DEFAULT_QUESTIONS: Record<string, Question[]> = {
  MUSIK: [
    {
      question: "Siapakah penyanyi legendaris Indonesia yang memopulerkan lagu 'Kemesraan'?",
      options: ["Iwan Fals", "Chrisye", "Ebiet G. Ade", "Gombloh"],
      correctIndex: 0
    },
    {
      question: "Band asal Bandung yang terkenal dengan lagu 'Peterpan' sebelum berubah nama adalah...",
      options: ["Peterpan", "Sheila on 7", "Padi", "Dewa 19"],
      correctIndex: 0
    },
    {
      question: "Lagu daerah Jawa Barat yang bercerita tentang makanan tradisional dari singkong adalah...",
      options: ["Manuk Dadali", "Es Lilin", "Peuyeum Bandung", "Bubuy Bulan"],
      correctIndex: 2
    }
  ],
  TEATER: [
    {
      question: "Naskah drama terkenal 'Mega-Mega' ditulis oleh sastrawan Indonesia yaitu...",
      options: ["W.S. Rendra", "Arifin C. Noer", "Putu Wijaya", "Pramoedya Ananta Toer"],
      correctIndex: 1
    },
    {
      question: "Teater modern Indonesia yang didirikan oleh W.S. Rendra di Yogyakarta bernama...",
      options: ["Teater Koma", "Teater Populer", "Bengkel Teater", "Teater Kecil"],
      correctIndex: 2
    },
    {
      question: "Gedung kesenian bersejarah di Bandung yang sering digunakan untuk pertunjukan teater adalah...",
      options: ["Gedung Sate", "Gedung Merdeka", "Gedung Kesenian Rumentang Siang", "Gedung Landmark"],
      correctIndex: 2
    }
  ],
  BANDUNG: [
    {
      question: "Siapakah Walikota Bandung yang merancang Jalan Braga menjadi ikon wisata kreatif modern?",
      options: ["Ridwan Kamil", "Oded M. Danial", "Dada Rosada", "R.A.A. Wiranatakusumah"],
      correctIndex: 0
    },
    {
      question: "Julukan kota Bandung yang terkenal karena keindahan alam dan modenya adalah...",
      options: ["Kota Pahlawan", "Paris van Java", "Kota Satria", "Kota Khatulistiwa"],
      correctIndex: 1
    },
    {
      question: "Nama sungai terpanjang di Jawa Barat yang mengalir melalui wilayah Bandung Raya adalah...",
      options: ["Sungai Cikapundung", "Sungai Citarum", "Sungai Cisadane", "Sungai Cimanuk"],
      correctIndex: 1
    }
  ]
};

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

export default function DailyQuizPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [points, setPoints] = useState(0);

  // Quiz Configurations
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [timeToNextQuiz, setTimeToNextQuiz] = useState<string | null>(null);
  const [quizPlayedToday, setQuizPlayedToday] = useState(false);

  // Gameplay States
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  // Summary list for showing final answers status
  const [answersLog, setAnswersLog] = useState<{ question: string; isCorrect: boolean }[]>([]);

  // Sound toggle (Senyap/Suara)
  const [isMuted, setIsMuted] = useState(true);

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial profile & quiz settings
  useEffect(() => {
    const initPage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Load Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        if (profile.verification_status !== "approved") {
          toast("⚠️ Kamu harus verifikasi KTP terlebih dahulu untuk bermain Kuis Harian!", "warning");
          router.push("/verify");
          return;
        }

        setUserProfile(profile);
        setPoints(profile.points || 0);

        // Check if played today
        const todayStr = getTodayString();
        const lastPlay = localStorage.getItem(`last_quiz_date_${profile.id}`);
        if (lastPlay === todayStr) {
          setQuizPlayedToday(true);
        }
      }

      // Load Quiz Configuration
      try {
        const { data: setting, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "daily_quiz")
          .single();

        if (setting && setting.value) {
          setQuizConfig(setting.value as QuizConfig);
        } else {
          // Fallback to BANDUNG topic
          setQuizConfig({
            activeTopic: "BANDUNG",
            rewardPoints: 2,
            questions: DEFAULT_QUESTIONS["BANDUNG"]
          });
        }
      } catch (err) {
        console.warn("Failed to load quiz config, using local fallback");
        setQuizConfig({
          activeTopic: "BANDUNG",
          rewardPoints: 2,
          questions: DEFAULT_QUESTIONS["BANDUNG"]
        });
      }
      setLoading(false);
    };

    initPage();
  }, [router]);

  // Countdown timer for next quiz reset
  useEffect(() => {
    if (!quizPlayedToday) return;

    const interval = setInterval(() => {
      const ms = getMsUntilMidnight();
      if (ms <= 0) {
        setQuizPlayedToday(false);
        setTimeToNextQuiz(null);
        clearInterval(interval);
      } else {
        setTimeToNextQuiz(formatMs(ms));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quizPlayedToday]);

  // Gameplay Timer loop
  useEffect(() => {
    if (gameState !== "playing" || isAnswering) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up! Force wrong answer outside of render phase.
          setTimeout(() => {
            handleTimeout();
          }, 0);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentIdx, isAnswering]);

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnswering(true);
    toast("⏰ WAKTU HABIS!", "error");

    const activeQuestion = quizConfig?.questions[currentIdx];
    const newLogItem = {
      question: activeQuestion?.question || "",
      isCorrect: false
    };

    setAnswersLog((prev) => [...prev, newLogItem]);

    // Move to next question after a brief delay
    setTimeout(() => {
      advanceQuestion();
    }, 1200);
  };

  const handleSelectOption = (optIdx: number) => {
    if (isAnswering || gameState !== "playing") return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnswering(true);
    setSelectedOpt(optIdx);

    const activeQuestion = quizConfig?.questions[currentIdx];
    const isCorrect = activeQuestion?.correctIndex === optIdx;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      toast("✓ BENAR! Mantap.", "success");
    } else {
      toast("✗ SALAH! Kurang beruntung.", "error");
    }

    const newLogItem = {
      question: activeQuestion?.question || "",
      isCorrect
    };

    setAnswersLog((prev) => [...prev, newLogItem]);

    setTimeout(() => {
      advanceQuestion();
    }, 1500);
  };

  const advanceQuestion = () => {
    const totalQuestions = quizConfig?.questions.length || 0;
    if (currentIdx + 1 < totalQuestions) {
      setCurrentIdx((prev) => prev + 1);
      setTimeLeft(10);
      setSelectedOpt(null);
      setIsAnswering(false);
    } else {
      // Quiz finished
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setGameState("finished");
    setQuizPlayedToday(true);

    const todayStr = getTodayString();
    localStorage.setItem(`last_quiz_date_${userProfile.id}`, todayStr);

    const totalQuestions = quizConfig?.questions.length || 0;
    const finalScore = score;
    const perfectScore = finalScore === totalQuestions;

    const rewardPointsVal = quizConfig?.rewardPoints ?? 2;
    const pointsGained = perfectScore ? rewardPointsVal : 0;

    // Save quiz to history in localStorage
    try {
      const quizSaved = localStorage.getItem(`quiz_history_${userProfile.id}`);
      let quizHistory = [];
      if (quizSaved) {
        quizHistory = JSON.parse(quizSaved);
      }
      const newHistoryItem = {
        date: new Date().toISOString(),
        topic: quizConfig?.activeTopic || "TRIVIA",
        score: finalScore,
        totalQuestions: totalQuestions,
        pointsGained: pointsGained,
      };
      quizHistory = [newHistoryItem, ...quizHistory];
      localStorage.setItem(`quiz_history_${userProfile.id}`, JSON.stringify(quizHistory));
    } catch (e) {
      console.error("Gagal menyimpan riwayat kuis:", e);
    }

    if (perfectScore) {
      const newPointsVal = points + rewardPointsVal;
      try {
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({ points: newPointsVal })
          .eq("id", userProfile.id);

        if (updateErr) throw updateErr;

        setPoints(newPointsVal);
        setUserProfile((prev: any) => ({ ...prev, points: newPointsVal }));

        toast(`🎉 SELAMAT! Semua benar. +${rewardPointsVal} Poin telah ditambahkan ke profil!`, "success");
      } catch (err: any) {
        console.error("Gagal menambahkan poin kuis:", err);
        toast("Kuis selesai dengan poin sempurna, tapi gagal menyimpan ke server.", "warning");
      }
    } else {
      toast("Kuis selesai! Sayang sekali beberapa jawaban salah.", "warning");
    }
  };

  const startQuiz = () => {
    setGameState("playing");
    setCurrentIdx(0);
    setScore(0);
    setTimeLeft(10);
    setSelectedOpt(null);
    setIsAnswering(false);
    setAnswersLog([]);
  };

  if (loading) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center bg-[#FCFAF1] dark:bg-zinc-950 gap-4 ${poppins.className}`}>
        <Loader2 className="animate-spin text-[#6D4AFF]" size={48} strokeWidth={3} />
        <p className="font-black italic uppercase text-lg text-slate-700 dark:text-zinc-300">MENYIAPKAN SOAL KUIS...</p>
      </div>
    );
  }

  const activeQuestion = quizConfig?.questions[currentIdx];
  const totalQuestions = quizConfig?.questions.length || 0;

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
          <span className="text-2xl font-black italic -skew-x-12 tracking-tighter uppercase text-slate-900 dark:text-zinc-50">DAILY QUIZ</span>
          
          <div className="flex items-center gap-4">
            <div className="bg-[#6D4AFF] border-4 border-black px-4 py-1.5 shadow-[2px_2px_0_0_#000] text-white text-xs font-black uppercase italic -skew-x-6">
              Poin: {points}
            </div>
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
                    <p className="text-xs font-black italic -skew-x-6 uppercase text-slate-900 dark:text-zinc-50">{userProfile?.full_name?.split(" ")[0] || "LEGEND"}</p>
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

      <div className="max-w-3xl mx-auto p-4 sm:p-8 md:p-12 space-y-8">
        
        {/* HEADER SECTION */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase -skew-x-6 tracking-tighter leading-none text-slate-900 dark:text-zinc-50">
            TRIVIA <span className="text-[#6D4AFF]">CHALLENGE.</span>
          </h1>
          <p className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Jawab {totalQuestions} Soal dengan Cepat dalam 10 Detik untuk Menangkan 2 Poin!
          </p>
        </div>

        {/* 🎡 STAGE 1: DAILY LOCK (ALREADY PLAYED TODAY) */}
        {quizPlayedToday && gameState !== "finished" && (
          <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 border-8 border-black dark:border-zinc-700 p-8 shadow-[12px_12px_0_0_#000] dark:shadow-[12px_12px_0_0_var(--primary-color)] text-center space-y-6">
            <div className="w-20 h-20 bg-[#FF3B30] border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4 rotate-12 shadow-[4px_4px_0_0_#000]">
              <Clock size={40} className="text-white" strokeWidth={3} />
            </div>
            <h3 className="text-3xl font-black italic -skew-x-6 uppercase text-[#FF3B30] drop-shadow-[1px_1px_0_#000]">
              KUIS TERKUNCI! ⏳
            </h3>
            <p className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 leading-relaxed">
              Anda telah mengerjakan kuis harian untuk hari ini. Kesempatan kuis trivia akan di-reset kembali dalam:
            </p>
            {timeToNextQuiz && (
              <div className="font-mono text-3xl font-black text-slate-900 dark:text-amber-400 bg-slate-100 dark:bg-zinc-800 border-4 border-black dark:border-zinc-700 px-6 py-4 shadow-[4px_4px_0_0_#000] inline-block -rotate-1 select-all">
                {timeToNextQuiz}
              </div>
            )}
            <div className="pt-4">
              <Link 
                href="/explore"
                className="w-full bg-black text-white hover:bg-slate-800 border-4 border-black py-4 font-black italic uppercase text-xs tracking-wider shadow-[4px_4px_0_0_#6D4AFF] block transition-all"
              >
                KEMBALI KE EXPLORE
              </Link>
            </div>
          </div>
        )}

        {/* 🎡 STAGE 2: IDLE START SCREEN */}
        {gameState === "idle" && !quizPlayedToday && quizConfig && (
          <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 border-8 border-black dark:border-zinc-700 p-8 shadow-[12px_12px_0_0_#000] dark:shadow-[12px_12px_0_0_var(--primary-color)] text-center space-y-6">
            <div className="w-24 h-24 bg-amber-400 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 -rotate-12 shadow-[4px_4px_0_0_#000]">
              <Trophy size={48} className="text-slate-950" strokeWidth={3} />
            </div>

            <div className="inline-flex items-center gap-1.5 bg-[#6D4AFF] text-white border-2 border-black px-3.5 py-1.5 text-xs font-black uppercase tracking-widest -rotate-2 italic shadow-[2.5px_2.5px_0_0_#000]">
              Topik Hari Ini: {quizConfig.activeTopic}
            </div>

            <div className="space-y-2 text-left bg-slate-50 dark:bg-zinc-800 p-6 border-4 border-black dark:border-zinc-700">
              <h4 className="font-black italic uppercase text-sm border-b-2 border-black dark:border-zinc-700 pb-2 mb-3">ATURAN TRIVIA:</h4>
              <ul className="text-xs font-bold space-y-2 uppercase text-slate-600 dark:text-zinc-300">
                <li>⏱️ Jawab kuis secepat mungkin (Hanya 10 detik per soal).</li>
                <li>🎯 Harus menjawab {totalQuestions} pertanyaan dengan benar secara berurutan.</li>
                <li>🏆 Hadiah: +{quizConfig.rewardPoints} Poin jika skor Anda sempurna 100%!</li>
                <li>⚠️ Hanya diberi 1 kali kesempatan bermain per hari.</li>
              </ul>
            </div>

            <button
              onClick={startQuiz}
              className="w-full bg-[#6D4AFF] text-white border-4 border-black py-5 font-black italic uppercase text-sm tracking-widest shadow-[6px_6px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
            >
              MULAI KUIS SEKARANG! ⚡
            </button>
          </div>
        )}

        {/* 🎡 STAGE 3: GAMEPLAY SCREEN */}
        {gameState === "playing" && activeQuestion && (
          <div className="bg-white dark:bg-zinc-900 border-8 border-black dark:border-zinc-700 p-6 sm:p-10 shadow-[15px_15px_0_0_rgba(109,74,255,1)] relative text-left space-y-8">
            
            {/* Progress & Countdown Header */}
            <div className="flex justify-between items-center border-b-4 border-black dark:border-zinc-700 pb-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">PROGRESS PERTANYAAN</p>
                <p className="text-xl font-black italic -skew-x-3 text-[#6D4AFF]">{currentIdx + 1} / {totalQuestions}</p>
              </div>

              {/* Timer Box */}
              <div className={`border-4 border-black p-3 px-5 shadow-[3px_3px_0_0_#000] font-black uppercase text-xs tracking-wider flex items-center gap-2 ${
                timeLeft <= 3 ? "bg-red-500 text-white animate-pulse" : "bg-amber-400 text-black"
              }`}>
                <Clock size={16} strokeWidth={3} />
                <span>WAKTU: <span className="font-mono text-sm">{timeLeft}s</span></span>
              </div>
            </div>

            {/* Visual Timer Progress Bar */}
            <div className="w-full h-4 bg-slate-100 dark:bg-zinc-800 border-3 border-black dark:border-zinc-700 relative overflow-hidden">
              <div 
                className={`h-full border-r-3 border-black transition-all duration-1000 ease-linear ${
                  timeLeft <= 3 ? "bg-red-500" : "bg-emerald-400"
                }`}
                style={{ width: `${(timeLeft / 10) * 100}%` }}
              />
            </div>

            {/* Question Text Box */}
            <div className="bg-slate-50 dark:bg-zinc-800 border-4 border-black dark:border-zinc-700 p-6 shadow-[4px_4px_0_0_#000]">
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">PERTANYAAN TRIVIA</label>
              <h3 className="text-xl sm:text-2xl font-black italic uppercase -skew-x-2 tracking-tight leading-snug">
                {activeQuestion.question}
              </h3>
            </div>

            {/* Multiple Choice Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {activeQuestion.options.map((option, oIdx) => {
                const isSelected = selectedOpt === oIdx;
                const isCorrect = activeQuestion.correctIndex === oIdx;
                
                let optClass = "border-4 border-black p-4 font-black uppercase text-xs sm:text-sm shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-between text-left rounded-xl ";
                
                if (isAnswering) {
                  if (isCorrect) {
                    optClass += "bg-emerald-400 text-black border-black cursor-not-allowed";
                  } else if (isSelected && !isCorrect) {
                    optClass += "bg-red-500 text-white border-black cursor-not-allowed shadow-none translate-x-1 translate-y-1";
                  } else {
                    optClass += "bg-white dark:bg-zinc-900 text-slate-400 border-slate-300 dark:border-zinc-800 cursor-not-allowed shadow-none translate-x-1 translate-y-1";
                  }
                } else {
                  optClass += "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 hover:bg-slate-50";
                }

                return (
                  <button
                    key={oIdx}
                    disabled={isAnswering}
                    onClick={() => handleSelectOption(oIdx)}
                    className={optClass}
                  >
                    <span>{String.fromCharCode(65 + oIdx)}. {option}</span>
                    {isAnswering && isCorrect && <CheckCircle2 size={16} strokeWidth={3} className="shrink-0 text-slate-950" />}
                    {isAnswering && isSelected && !isCorrect && <XCircle size={16} strokeWidth={3} className="shrink-0 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 🎡 STAGE 4: FINISHED / SUMMARY SCREEN */}
        {gameState === "finished" && (
          <div className="bg-white dark:bg-zinc-900 border-8 border-black dark:border-zinc-700 p-8 shadow-[15px_15px_0_0_#000] text-center space-y-8">
            
            {score === totalQuestions ? (
              <>
                <div className="w-24 h-24 bg-emerald-400 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4 rotate-12 shadow-[4px_4px_0_0_#000] animate-bounce">
                  <Award size={48} className="text-black" strokeWidth={3} />
                </div>
                <h3 className="text-4xl font-black italic -skew-x-6 uppercase text-emerald-500 drop-shadow-[1.5px_1.5px_0_#000]">
                  JAWABAN SEMPURNA! 🎉
                </h3>
                <p className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                  Selamat! Anda menjawab semua kuis harian dengan benar. Anda berhasil mendapatkan tambahan poin:
                </p>
                <div className="bg-[#6D4AFF] border-4 border-black p-6 font-mono text-3xl font-black text-white shadow-[4px_4px_0_0_#000] inline-block -rotate-2">
                  +{quizConfig?.rewardPoints ?? 2} POIN REWARD
                </div>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-red-500 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4 -rotate-12 shadow-[4px_4px_0_0_#000]">
                  <RotateCcw size={48} className="text-white" strokeWidth={3} />
                </div>
                <h3 className="text-4xl font-black italic -skew-x-6 uppercase text-red-500 drop-shadow-[1.5px_1.5px_0_#000]">
                  KUIS SELESAI! 🛋️
                </h3>
                <p className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                  Skor akhir Anda: <span className="font-black text-slate-900 dark:text-white underline decoration-2">{score} benar</span> dari {totalQuestions} soal. Anda harus menjawab semua dengan benar untuk mendapatkan poin.
                </p>
              </>
            )}

            {/* Answer logs summary list */}
            <div className="border-4 border-black dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 p-6 text-left max-w-xl mx-auto space-y-4 shadow-[4px_4px_0_0_#000]">
              <h4 className="font-black italic uppercase text-xs border-b-2 border-black dark:border-zinc-700 pb-2">RINCIAN JAWABAN ANDA:</h4>
              <div className="space-y-3">
                {answersLog.map((log, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs border-b border-black/10 dark:border-zinc-700 pb-1.5">
                    <span className="font-bold truncate max-w-[200px] sm:max-w-md uppercase">{idx + 1}. {log.question}</span>
                    <span className={`px-2 py-0.5 border border-black font-black uppercase text-[8px] tracking-wider ${
                      log.isCorrect ? "bg-emerald-400 text-black" : "bg-red-500 text-white"
                    }`}>
                      {log.isCorrect ? "BENAR" : "SALAH / HABIS"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 max-w-xl mx-auto flex flex-col sm:flex-row gap-4">
              <Link 
                href="/explore/rewards"
                className="flex-1 bg-white hover:bg-slate-50 text-slate-900 border-4 border-black py-4 font-black italic uppercase text-xs tracking-wider shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none block transition-all"
              >
                LIHAT REWARDS SAYA
              </Link>
              <Link 
                href="/explore"
                className="flex-1 bg-black text-white hover:bg-slate-800 border-4 border-black py-4 font-black italic uppercase text-xs tracking-wider shadow-[4px_4px_0_0_#6D4AFF] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none block transition-all"
              >
                KEMBALI KE EXPLORE
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
