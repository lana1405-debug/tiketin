"use client";

import { useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

// Komponen utama yang dibungkus Suspense dengan fallback bertema premium
export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAF1] p-4">
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#6D4AFF] flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-black" size={40} />
          <h2 className="text-lg font-black uppercase italic -skew-x-6">LOADING...</h2>
        </div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}

// Logika halaman yang pake useSearchParams
function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email"); 
  
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email: email || "",
      token: otp,
      type: "recovery",
    });

    if (error) {
      alert("Kode salah atau kadaluwarsa, Man! Coba cek lagi.");
      setIsLoading(false);
    } else {
      router.push("/update-password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#FCFAF1]">
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
        className="w-full max-w-md bg-white border-4 sm:border-8 border-black p-6 sm:p-10 shadow-[6px_6px_0_0_#6D4AFF] sm:shadow-[10px_10px_0_0_#6D4AFF]"
      >
        <form onSubmit={handleVerify} className="space-y-6">
          <motion.div 
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 5, scale: 1 }}
            whileHover={{ rotate: -5, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="bg-amber-400 p-3 w-max border-4 border-black cursor-pointer"
          >
            <ShieldCheck size={32} />
          </motion.div>
          
          <h2 className="text-2xl sm:text-3xl font-black italic uppercase -skew-x-6">MASUKKIN KODE</h2>
          
          <p className="text-xs font-bold text-slate-500 uppercase">
            Kita udah kirim kode 6 digit ke <span className="text-black font-black break-all">{email}</span>
          </p>
          
          <div className="relative">
            <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
            <input 
              type="text" 
              placeholder="000000" 
              maxLength={6}
              required
              className="relative w-full p-3 sm:p-4 border-4 border-black font-black text-center text-2xl sm:text-4xl tracking-[0.3em] sm:tracking-[0.5em] uppercase outline-none focus:bg-amber-100 transition-colors bg-white"
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-black text-white p-4 font-black uppercase flex items-center justify-center gap-2 hover:bg-[#6D4AFF] active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <>VERIFIKASI <ArrowRight /></>}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}