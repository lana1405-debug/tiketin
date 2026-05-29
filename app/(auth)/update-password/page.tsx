"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { ArrowRight, Loader2, Lock, ShieldAlert, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";


const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800", "900"] 
});

const GLOBAL_STYLES = `
  .noise::after {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:999; opacity:.04;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }
`;

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(style);

    let isMounted = true;
    let resolved = false;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const hasRecoveryParams = 
        window.location.hash.includes("type=recovery") || 
        window.location.hash.includes("access_token=") || 
        window.location.search.includes("code=") || 
        window.location.search.includes("type=recovery");

      if (session) {
        resolved = true;
        if (isMounted) setIsReady(true);
      } else if (!hasRecoveryParams) {
        resolved = true;
        if (isMounted) router.push("/forgot-password");
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        resolved = true;
        if (isMounted) setIsReady(true);
      } else if (session) {
        resolved = true;
        if (isMounted) setIsReady(true);
      } else if (event === "SIGNED_OUT") {
        resolved = true;
        if (isMounted) router.push("/forgot-password");
      }
    });

    const fallbackTimeout = setTimeout(async () => {
      if (!resolved && isMounted) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && isMounted) {
          router.push("/forgot-password");
        }
      }
    }, 4000);

    return () => { 
      isMounted = false;
      clearTimeout(fallbackTimeout);
      document.head.removeChild(style);
      subscription.unsubscribe();
    };
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password.length < 6) {
      setErrorMsg("KUNCI MINIMAL 6 KARAKTER, MAN!");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("KUNCI NGGAK COCOK! CEK LAGI.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg("GAGAL UPDATE: " + error.message.toUpperCase());
    } else {
      setSuccessMsg("KUNCI BERHASIL DIGANTI! MENGARAHKAN...");
      setTimeout(() => router.push("/explore"), 1500);
    }

    // Selalu reset loading, baik error maupun sukses
    setIsLoading(false);
  };

  if (!isReady) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 noise ${poppins.className}`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-zinc-900 border-4 sm:border-[6px] border-black dark:border-zinc-700 p-6 sm:p-8 shadow-[6px_6px_0_0_#6D4AFF] sm:shadow-[8px_8px_0_0_#6D4AFF] dark:shadow-[6px_6px_0_0_var(--primary-color)] dark:shadow-[8px_8px_0_0_var(--primary-color)] flex flex-col items-center gap-4 text-center max-w-xs w-full"
        >
          <Loader2 className="animate-spin text-black dark:text-zinc-50" size={40} />
          <h2 className="text-lg sm:text-xl font-black uppercase italic -skew-x-6">VERIFIKASI LINK...</h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 noise ${poppins.className}`}>
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
        className="relative w-full max-w-md"
      >
        <div className="absolute inset-0 bg-black dark:bg-zinc-950 translate-x-2 translate-y-2 sm:translate-x-3 sm:translate-y-3" />
        
        <form onSubmit={handleUpdate} className="relative bg-white dark:bg-zinc-900 border-4 sm:border-[6px] border-black dark:border-zinc-700 p-6 sm:p-8 lg:p-10 shadow-[6px_6px_0_0_#6D4AFF] sm:shadow-[8px_8px_0_0_#6D4AFF] dark:shadow-[6px_6px_0_0_var(--primary-color)] dark:shadow-[8px_8px_0_0_var(--primary-color)] space-y-6">
          
          <div className="space-y-2">
            <motion.div 
              initial={{ rotate: 10, scale: 0.9 }}
              animate={{ rotate: -3, scale: 1 }}
              whileHover={{ rotate: 3, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="bg-[#6D4AFF] p-3 w-max mb-4 border-4 border-black dark:border-zinc-700 cursor-pointer"
            >
              <Lock size={32} className="text-white" strokeWidth={3} />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-black italic uppercase -skew-x-6 tracking-tighter text-slate-900 dark:text-zinc-50">PASSWORD BARU</h2>
            <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Masukkan kata sandi baru Anda agar dapat menjelajahi tiket kembali.</p>
          </div>

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500 dark:bg-red-950/20 p-4 border-4 border-black dark:border-red-500/50 flex items-center gap-3 text-white dark:text-red-400"
            >
              <ShieldAlert size={24} className="shrink-0" />
              <p className="font-black text-xs sm:text-sm uppercase">{errorMsg}</p>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500 dark:bg-emerald-950/20 p-4 border-4 border-black dark:border-emerald-500/50 flex items-center gap-3 text-white dark:text-emerald-400"
            >
              <CheckCircle size={24} className="shrink-0" />
              <p className="font-black text-xs sm:text-sm uppercase">{successMsg}</p>
            </motion.div>
          )}

          <div className="space-y-4">
            <input 
              type="password" 
              required 
              value={password}
              placeholder="PASSWORD BARU..."
              className="w-full p-3 sm:p-4 border-4 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-black uppercase text-sm sm:text-base outline-none focus:bg-amber-100 dark:focus:bg-zinc-700 transition-colors"
              onChange={(e) => setPassword(e.target.value)}
            />
            <input 
              type="password" 
              required 
              value={confirmPassword}
              placeholder="ULANGI PASSWORD..."
              className="w-full p-3 sm:p-4 border-4 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-black uppercase text-sm sm:text-base outline-none focus:bg-amber-100 dark:focus:bg-zinc-700 transition-colors"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || !!successMsg}
            className="w-full bg-black dark:bg-zinc-800 border-4 border-black dark:border-zinc-700 text-white p-4 sm:p-5 font-black uppercase text-lg sm:text-xl italic hover:bg-[#6D4AFF] dark:hover:bg-[#6D4AFF] transition-all active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin"/> : <>UPDATE KUNCI <ArrowRight /></>}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

