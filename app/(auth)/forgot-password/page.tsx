"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import { Mail, ArrowRight, Loader2, Key, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const trimmedEmail = email.trim();

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSubmitted(true);
    }

    setIsLoading(false);
  };

  const handleTryAgain = () => {
    setSubmitted(false);
    setEmail("");
    setErrorMsg("");
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 noise ${poppins.className}`}>
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
        className="relative w-full max-w-md"
      >
        <div className="absolute inset-0 bg-black dark:bg-zinc-950 translate-x-2 translate-y-2 sm:translate-x-3 sm:translate-y-3" />
        
        <div className="relative bg-white dark:bg-zinc-900 border-4 sm:border-[6px] border-black dark:border-zinc-700 p-6 sm:p-10 lg:p-12 shadow-[6px_6px_0_0_#6D4AFF] sm:shadow-[8px_8px_0_0_#6D4AFF] dark:shadow-[6px_6px_0_0_var(--primary-color)] dark:shadow-[8px_8px_0_0_var(--primary-color)]">
          {!submitted ? (
            <form onSubmit={handleReset} className="space-y-6 sm:space-y-8">
              <div className="space-y-2">
                <motion.div 
                   initial={{ rotate: -10, scale: 0.9 }}
                   animate={{ rotate: 3, scale: 1 }}
                   whileHover={{ rotate: -5, scale: 1.05 }}
                   transition={{ type: "spring", stiffness: 300, damping: 15 }}
                   className="bg-[#6D4AFF] p-3 w-max mb-4 border-4 border-black dark:border-zinc-700 cursor-pointer"
                >
                  <Key size={32} className="text-white" strokeWidth={3} />
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-black italic uppercase -skew-x-6 tracking-tighter text-slate-900 dark:text-zinc-50">LUPA KUNCI?</h2>
                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Tenang, bakal kita kirim link reset ke email</p>
              </div>
 
              <div className="space-y-2">
                <input 
                  type="email" 
                  placeholder="EMAIL@GMAIL.COM" 
                  required
                  value={email}
                  className="w-full p-4 sm:p-5 border-4 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-black uppercase text-base sm:text-lg outline-none focus:bg-amber-100 dark:focus:bg-zinc-750 transition-colors"
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errorMsg && (
                  <p className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wide border-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-950/20 p-3">
                    ⚠ {errorMsg}
                  </p>
                )}
              </div>
 
              <div className="space-y-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black dark:bg-zinc-800 text-white p-4 sm:p-5 border-4 border-black dark:border-zinc-700 font-black uppercase text-lg sm:text-xl italic hover:bg-[#6D4AFF] dark:hover:bg-[#6D4AFF] transition-all active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <>KIRIM RESET <ArrowRight /></>}
                </motion.button>
 
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link 
                    href="/login"
                    className="w-full border-4 border-black dark:border-zinc-700 p-4 font-black uppercase text-xs sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={16} />
                    BALIK KE LOGIN
                  </Link>
                </motion.div>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-6 py-4 sm:py-6">
              <motion.div 
                initial={{ rotate: -15, scale: 0.8 }}
                animate={{ rotate: 3, scale: 1 }}
                whileHover={{ rotate: -3, scale: 1.1 }}
                className="h-16 w-16 sm:h-20 sm:w-20 bg-emerald-500 mx-auto border-4 border-black dark:border-zinc-700 flex items-center justify-center"
              >
                <Mail size={32} className="text-white sm:hidden" />
                <Mail size={40} className="text-white hidden sm:block" />
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-black italic uppercase text-emerald-600 dark:text-emerald-400 -skew-x-6">CEK EMAIL!</h2>
              <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-600 dark:text-zinc-400">
                Link reset udah meluncur ke kotak masuk
              </p>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">
                Dikirim ke: {email.trim()}
              </p>
 
              <div className="space-y-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTryAgain}
                  className="w-full border-4 border-black dark:border-zinc-700 p-4 font-black uppercase text-xs sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  SALAH EMAIL? COBA LAGI
                </motion.button>
 
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link 
                    href="/login"
                    className="w-full bg-black dark:bg-zinc-800 text-white p-4 border-4 border-black dark:border-zinc-700 font-black uppercase text-xs sm:text-sm hover:bg-[#6D4AFF] dark:hover:bg-[#6D4AFF] transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={16} />
                    BALIK KE LOGIN
                  </Link>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

}
