"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Poppins } from "next/font/google";
import { Mail, Lock, Eye, EyeOff, Music, Ticket, Star, Loader2, Zap, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800", "900"] 
});

/* ─────────────────────────────────────────────
    MEGA BRUTALIST STYLES
───────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  .marquee-track { display:flex; width:max-content; animation:marquee 20s linear infinite; }
  .noise::after {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:999; opacity:.03;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }
`;

const LoginIllustration = () => (
  <div className="relative w-full h-full bg-[#6D4AFF] flex items-center justify-center overflow-hidden border-l-[12px] border-black">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-20" 
      style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #000, #000 10px, transparent 10px, transparent 20px)' }} 
    />

    {/* Center Sticker */}
    <div className="relative z-20">
        <div className="absolute inset-0 bg-black translate-x-4 translate-y-4" />
        <div className="relative bg-white border-[10px] border-black p-16 -rotate-3">
            <Ticket size={120} className="text-[#6D4AFF]" strokeWidth={3} />
            <div className="absolute -top-8 -right-8 bg-amber-400 border-4 border-black px-6 py-2 font-black italic uppercase shadow-[4px_4px_0_0_#000] rotate-12">
                OFFICIAL
            </div>
        </div>
    </div>

    {/* Floating Elements */}
    <div className="absolute top-10 right-10 animate-bounce">
      <div className="p-4 bg-red-500 text-white border-4 border-black shadow-[6px_6px_0_0_#000] rotate-12">
        <Star size={32} fill="white" />
      </div>
    </div>

    <div className="absolute bottom-10 left-10">
      <div className="p-4 bg-amber-400 border-4 border-black shadow-[6px_6px_0_0_#000] -rotate-12">
        <Zap size={32} fill="black" />
      </div>
    </div>

    {/* Bottom Marquee */}
    <div className="absolute bottom-0 w-full bg-black border-t-8 border-black py-4 overflow-hidden">
        <div className="marquee-track">
            {[...Array(6)].map((_, i) => (
                <span key={i} className="text-2xl font-black italic uppercase text-amber-400 mx-4">
                    NO CALO ALLOWED • TIKETIN • WAR NOW • NO DRAMA •
                </span>
            ))}
        </div>
    </div>
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const tag = document.createElement("style");
    tag.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      const role = profile?.role || "customer"; 

      if (role === "admin") router.push("/admin/dashboard");
      else if (role === "eo") router.push("/eo/dashboard");
      else router.push("/explore"); 

    } catch (error: any) {
      alert("Login Gagal: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={`min-h-screen bg-[#FCFAF1] flex ${poppins.className} noise overflow-hidden`}>
      <div className="flex flex-col-reverse lg:flex-row w-full">
        
        {/* PANEL FORM (Kiri) */}
        <section className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-14 bg-[#FCFAF1]">
          <div className="w-full max-w-lg">
            
            {/* LOGO AREA */}
            <div className="mb-12 flex flex-col items-center lg:items-start">
               <div className="flex items-center gap-4 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                    <div className="relative h-14 w-14 bg-[#6D4AFF] border-4 border-black flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-transform">
                      <Zap className="text-amber-400" size={32} strokeWidth={4} />
                    </div>
                  </div>
                  <span className="text-5xl font-black italic -skew-x-12 tracking-tighter uppercase">TIKETIN</span>
               </div>
            </div>

            {/* FORM CARD */}
            <div className="relative">
              <div className="absolute inset-0 bg-black translate-x-4 translate-y-4" />
              <div className="relative border-[8px] border-black bg-white p-10 md:p-14">
                <header className="mb-12 text-left">
                  <h2 className="text-5xl font-black italic uppercase -skew-x-6 tracking-tighter leading-none">
                    SIAP <span className="text-[#6D4AFF]">WAR?</span>
                  </h2>
                  <p className="font-bold text-slate-400 uppercase tracking-widest text-xs mt-3">Masukin kuncinya buat masuk arena</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <Label className="font-black uppercase italic text-sm tracking-widest ml-1">Email Arena</Label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                      <div className="relative flex items-center bg-white border-4 border-black">
                        <div className="px-4 border-r-4 border-black h-16 flex items-center bg-amber-400">
                           <Mail size={24} strokeWidth={3} />
                        </div>
                        <input 
                          type="email" 
                          placeholder="LEGEND@GMAIL.COM" 
                          className="w-full h-16 px-6 font-bold text-lg uppercase outline-none placeholder:text-slate-300" 
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between font-black uppercase italic text-sm tracking-widest ml-1">
                      <Label>Kunci Rahasia</Label>
                      <span className="text-red-500 cursor-pointer hover:underline decoration-4">LUPA?</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                      <div className="relative flex items-center bg-white border-4 border-black">
                        <div className="px-4 border-r-4 border-black h-16 flex items-center bg-[#6D4AFF] text-white">
                           <Lock size={24} strokeWidth={3} />
                        </div>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••"
                          className="w-full h-16 px-6 font-bold text-xl uppercase outline-none placeholder:text-slate-300" 
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-4">
                          {showPassword ? <EyeOff size={24} strokeWidth={3} /> : <Eye size={24} strokeWidth={3} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-4">
                    <div className="absolute inset-0 bg-black translate-x-2 translate-y-2" />
                    <button 
                      type="submit" 
                      className="relative w-full h-20 border-[6px] border-black bg-[#6D4AFF] hover:bg-amber-400 hover:text-black text-white font-black text-2xl italic uppercase transition-all flex items-center justify-center gap-4 group active:translate-x-1 active:translate-y-1"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={32} strokeWidth={4} /> : (
                          <>MASUK SEKARANG <ArrowRight size={32} strokeWidth={4} className="group-hover:translate-x-2 transition-transform" /></>
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-12 text-center lg:text-left border-t-4 border-black pt-8">
                  <p className="text-slate-900 font-black italic uppercase tracking-tight text-lg">
                    BARU DI SINI? <Link href="/register" className="text-[#6D4AFF] underline decoration-[6px] underline-offset-4 hover:bg-amber-400 transition-colors">DAFTAR AKUN</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PANEL ILUSTRASI (Kanan) */}
        <aside className="w-full lg:w-1/2 min-h-[400px] lg:min-h-screen">
          <LoginIllustration />
        </aside>

      </div>
    </main>
  );
}