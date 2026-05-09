"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles, Zap, ArrowRight, Mic2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800", "900"] 
});

/* ─────────────────────────────────────────────
    MEGA BRUTALIST STYLES (Animations & Textures)
───────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  .marquee-track { display:flex; width:max-content; animation:marquee 25s linear infinite; }
  .noise::after {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:999; opacity:.03;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }
`;

const RegisterIllustration = () => (
  <div className="relative w-full h-full bg-[#FCD34D] flex items-center justify-center overflow-hidden border-l-[12px] border-black">
    {/* 1. Background Vibe */}
    <div className="absolute inset-0 opacity-20" 
      style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 1px, transparent 1px, transparent 15px)' }} 
    />
    <div className="absolute top-10 -right-20 rotate-12 select-none">
        <span className="text-[12rem] font-black italic uppercase text-black/5 leading-none">STAGE ACCESS</span>
    </div>

    {/* 2. THE MAIN ASSET (MICROPHONE & STAGE VIBE) */}
    <div className="relative z-20 scale-110 md:scale-125">
        {/* Layer Shadow */}
        <div className="absolute inset-0 bg-black translate-x-4 translate-y-4" />
        
        {/* White Card Container */}
        <div className="relative bg-white border-[10px] border-black p-16 -rotate-2 flex flex-col items-center">
            {/* The Themed Icon */}
            <div className="relative">
               {/* Pake Mic2 buat aura Musik & Teater */}
               <div className="bg-[#6D4AFF] p-8 border-[6px] border-black shadow-[6px_6px_0_0_#000]">
                  <Mic2 size={120} className="text-white" strokeWidth={2.5} />
               </div>
               
               {/* Sparkle di pojok mic */}
               <div className="absolute -top-6 -right-6 animate-pulse">
                  <Sparkles size={48} fill="#FCD34D" className="text-black" strokeWidth={2} />
               </div>
            </div>

            {/* STIKER BARU: FRONT ROW (Bukan MVP lagi) */}
            <div className="absolute -bottom-10 -right-10 -rotate-6 group cursor-pointer">
                <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform" />
                <div className="relative bg-red-500 text-white border-[6px] border-black px-8 py-3 font-black italic uppercase text-3xl shadow-none">
                    FRONT ROW
                </div>
            </div>

            {/* Ikon Musik kecil sebagai aksen */}
            <div className="absolute -top-10 -left-10 rotate-12">
                <div className="bg-amber-400 text-black border-4 border-black p-4 shadow-[6px_6px_0_0_#000]">
                    <Music size={32} strokeWidth={3} />
                </div>
            </div>
        </div>
    </div>

    {/* 3. Floating "Live" Badge */}
    <div className="absolute top-1/4 left-12 animate-bounce">
      <div className="bg-black text-white border-4 border-white px-6 py-2 shadow-[8px_8px_0_0_#6D4AFF] -rotate-12">
        <span className="font-black text-xl uppercase italic tracking-tighter">LIVE!</span>
      </div>
    </div>

    {/* 4. DNA Marquee */}
    <div className="absolute bottom-0 w-full bg-black border-t-8 border-black py-4 overflow-hidden">
        <div className="marquee-track">
            {[...Array(6)].map((_, i) => (
                <span key={i} className="text-2xl font-black italic uppercase text-white mx-8">
                    GET THE BEST SEAT • MUSIC & THEATER • TIKETIN REVOLUTION • NO MORE CALO •
                </span>
            ))}
        </div>
    </div>
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Inject styles
  useEffect(() => {
    const tag = document.createElement("style");
    tag.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([{ id: authData.user.id, full_name: fullName, email: email, role: "customer" }]);
        if (profileError) throw profileError;
      }

      alert("Akun berhasil dibuat! Selamat datang di Tiketin.");
      router.push("/explore"); 
    } catch (error: any) {
      alert("Gagal mendaftar: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={`min-h-screen bg-[#FCFAF1] flex ${poppins.className} noise overflow-hidden`}>
      <div className="flex flex-col-reverse lg:flex-row-reverse w-full pt-3">
        
        {/* PANEL FORM (Kiri di Desktop, Bawah di HP) */}
        <section className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-14 lg:p-20 relative">
          <div className="w-full max-w-lg">
            
            {/* LOGO AREA */}
            <div className="mb-12 flex flex-col items-center lg:items-start group">
               <Link href="/login" className="flex items-center gap-4 cursor-pointer">
                  <div className="relative">
                    <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                    <div className="relative h-14 w-14 bg-[#6D4AFF] border-4 border-black flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-transform">
                      <Zap size={32} className="text-amber-400" strokeWidth={4} />
                    </div>
                  </div>
                  <span className="text-5xl font-black italic -skew-x-12 tracking-tighter uppercase">TIKETIN</span>
               </Link>
               <p className="font-black italic uppercase text-[#6D4AFF] tracking-[0.2em] text-xs mt-3">Stage Access Entrance</p>
            </div>

            {/* FORM CARD (BRUTALIZED) */}
            <div className="relative">
              <div className="absolute inset-0 bg-black translate-x-4 translate-y-4" />
              <div className="relative border-[8px] border-black bg-white p-10 md:p-12">
                <header className="mb-10 text-left border-b-4 border-black pb-6">
                  <h2 className="text-5xl font-black italic uppercase -skew-x-6 tracking-tighter leading-none">
                    BUAT <span className="text-[#6D4AFF]">AKUN.</span>
                  </h2>
                  <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-4 italic">Isi data diri lo buat war tiket!</p>
                </header>

                <form onSubmit={handleRegister} className="space-y-6">
                  {/* Nama Lengkap */}
                  <div className="space-y-2">
                    <Label className="font-black uppercase italic text-xs tracking-widest ml-1">Siapa Nama Lo?</Label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                      <div className="relative flex items-center bg-white border-4 border-black">
                        <div className="px-4 border-r-4 border-black h-14 flex items-center bg-red-500 text-white">
                           <User size={20} strokeWidth={3} />
                        </div>
                        <input 
                          type="text" 
                          placeholder="SIAPA NAMA LO?" 
                          className="w-full h-14 px-4 font-bold uppercase outline-none placeholder:text-slate-200" 
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="font-black uppercase italic text-xs tracking-widest ml-1">Email Arena</Label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                      <div className="relative flex items-center bg-white border-4 border-black">
                        <div className="px-4 border-r-4 border-black h-14 flex items-center bg-[#6D4AFF] text-white">
                           <Mail size={20} strokeWidth={3} />
                        </div>
                        <input 
                          type="email" 
                          placeholder="LEGEND@GMAIL.COM" 
                          className="w-full h-14 px-4 font-bold uppercase outline-none placeholder:text-slate-300 rounded-none focus-visible:ring-0" 
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label className="font-black uppercase italic text-xs tracking-widest ml-1">Kunci Rahasia</Label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                      <div className="relative flex items-center bg-white border-4 border-black">
                        <div className="px-4 border-r-4 border-black h-14 flex items-center bg-amber-400">
                           <Lock size={20} strokeWidth={3} />
                        </div>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••"
                          className="w-full h-14 px-4 font-bold outline-none rounded-none focus-visible:ring-0" 
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-4 bg-white">
                          {showPassword ? <EyeOff size={20} strokeWidth={3} /> : <Eye size={20} strokeWidth={3} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-6">
                    <div className="absolute inset-0 bg-black translate-x-2 translate-y-2" />
                    <button 
                      type="submit" 
                      className="relative w-full h-20 border-[6px] border-black bg-[#6D4AFF] hover:bg-amber-400 hover:text-black text-white font-black text-2xl italic uppercase transition-all flex items-center justify-center gap-4 group active:translate-x-1 active:translate-y-1 active:shadow-none"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={32} strokeWidth={4} /> : (
                          <>GABUNG SEKARANG <ArrowRight size={32} strokeWidth={4} className="group-hover:translate-x-2 transition-transform" /></>
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-10 text-center lg:text-right border-t-4 border-black pt-6">
                  <p className="text-slate-900 font-black italic uppercase tracking-tight text-sm">
                    DAH ADA AKUN? <Link href="/login" className="text-[#6D4AFF] underline decoration-[4px] underline-offset-4 hover:bg-amber-400 transition-colors">MASUK SINI BRAY</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PANEL ILUSTRASI (Kanan di desktop, Atas di HP) */}
        <aside className="w-full lg:w-1/2 min-h-[400px] lg:min-h-screen">
          <RegisterIllustration />
        </aside>

      </div>
    </main>
  );
}