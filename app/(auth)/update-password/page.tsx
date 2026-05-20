"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { Key, ArrowRight, Loader2, Lock } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Inject visual noise
    const style = document.createElement("style");
    style.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(style);

    // ⚡ Logic penangkap session dari URL (Hash)
    const handleAuth = async () => {
      // Kasih napas 100ms buat Supabase ngebaca URL sebelum di-render Next.js
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        alert("Link tidak valid atau kadaluwarsa, Man! Minta link baru ya.");
        router.push("/forgot-password");
      } else {
        setIsReady(true);
      }
    };
    
    handleAuth();

    return () => { document.head.removeChild(style); };
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      alert("Gagal update: " + error.message);
    } else {
      alert("Password berhasil diganti! Login sekarang.");
      router.push("/login");
    }
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
        {/* Dekorasi Shadow Brutalist */}
        <div className="absolute inset-0 bg-black translate-x-3 translate-y-3" />
        
        <form onSubmit={handleUpdate} className="relative bg-white border-[6px] border-black p-10 lg:p-12 shadow-[8px_8px_0_0_#6D4AFF] space-y-8">
          <div className="space-y-2">
            <div className="bg-[#6D4AFF] p-3 w-max mb-4 -rotate-3 border-4 border-black">
              <Lock size={32} className="text-white" strokeWidth={3} />
            </div>
            <h2 className="text-4xl font-black italic uppercase -skew-x-6 tracking-tighter">PASSWORD BARU</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Masukkan kunci baru lo biar bisa login lagi.</p>
          </div>

          <div className="space-y-2">
            <input 
              type="password" 
              required 
              placeholder="Ketik di sini..."
              className="w-full p-5 border-4 border-black font-black uppercase text-lg outline-none focus:bg-amber-100 transition-colors"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={isLoading}
            className="w-full bg-black text-white p-5 font-black uppercase text-xl italic hover:bg-[#6D4AFF] transition-all active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin"/> : <>UPDATE KUNCI <ArrowRight /></>}
          </button>
        </form>
      </div>
    </div>
  );
}