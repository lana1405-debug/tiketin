"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { ArrowRight, Loader2, Lock, ShieldAlert, CheckCircle } from "lucide-react";

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Token valid — tampilkan form
        setIsReady(true);
      } else if (event === "SIGNED_OUT") {
        // Hanya event ini yang berarti token benar-benar invalid/expired
        router.push("/forgot-password");
      }
      // Event lain (TOKEN_REFRESHED, SIGNED_IN, USER_UPDATED, dll) — dibiarkan saja
    });

    return () => { 
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
      <div className={`min-h-screen flex items-center justify-center bg-[#FCFAF1] noise ${poppins.className}`}>
        <div className="bg-white border-[6px] border-black p-8 shadow-[8px_8px_0_0_#6D4AFF] flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-black" size={48} />
          <h2 className="text-xl font-black uppercase italic -skew-x-6">VERIFIKASI LINK...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 bg-[#FCFAF1] noise ${poppins.className}`}>
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-black translate-x-3 translate-y-3" />
        
        <form onSubmit={handleUpdate} className="relative bg-white border-[6px] border-black p-8 lg:p-10 shadow-[8px_8px_0_0_#6D4AFF] space-y-6">
          
          <div className="space-y-2">
            <div className="bg-[#6D4AFF] p-3 w-max mb-4 -rotate-3 border-4 border-black">
              <Lock size={32} className="text-white" strokeWidth={3} />
            </div>
            <h2 className="text-4xl font-black italic uppercase -skew-x-6 tracking-tighter">PASSWORD BARU</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Masukkan kunci baru lo biar bisa explore tiket lagi.</p>
          </div>

          {errorMsg && (
            <div className="bg-red-500 p-4 border-4 border-black flex items-center gap-3 text-white">
              <ShieldAlert size={24} />
              <p className="font-black text-sm uppercase">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500 p-4 border-4 border-black flex items-center gap-3 text-white">
              <CheckCircle size={24} />
              <p className="font-black text-sm uppercase">{successMsg}</p>
            </div>
          )}

          <div className="space-y-4">
            <input 
              type="password" 
              required 
              value={password}
              placeholder="PASSWORD BARU..."
              className="w-full p-4 border-4 border-black font-black uppercase outline-none focus:bg-amber-100 transition-colors"
              onChange={(e) => setPassword(e.target.value)}
            />
            <input 
              type="password" 
              required 
              value={confirmPassword}
              placeholder="ULANGI PASSWORD..."
              className="w-full p-4 border-4 border-black font-black uppercase outline-none focus:bg-amber-100 transition-colors"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading || !!successMsg}
            className="w-full bg-black text-white p-5 font-black uppercase text-xl italic hover:bg-[#6D4AFF] transition-all active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin"/> : <>UPDATE KUNCI <ArrowRight /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
