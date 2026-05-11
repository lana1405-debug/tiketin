"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles, ArrowRight, Mic2, Ticket as TicketIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800", "900"] 
});

/* ─────────────────────────────────────────────
    MEGA BRUTALIST STYLES
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
  <div className="relative w-full h-full bg-[#FCD34D] flex items-center justify-center overflow-hidden border-b-4 lg:border-b-0 lg:border-l-[12px] border-black">
    <div className="absolute inset-0 opacity-10" 
      style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 1px, transparent 1px, transparent 15px)' }} 
    />
    
    <div className="relative z-20 scale-[0.6] sm:scale-75 lg:scale-110 -translate-y-4 lg:translate-y-0">
        <div className="absolute inset-0 bg-black translate-x-3 translate-y-3 lg:translate-x-4 lg:translate-y-4" />
        <div className="relative bg-white border-[6px] lg:border-[10px] border-black p-8 lg:p-16 -rotate-2 flex flex-col items-center">
            
            <div className="relative">
               <div className="bg-[#6D4AFF] p-6 lg:p-8 border-[4px] lg:border-[6px] border-black shadow-[4px_4px_0_0_#000] lg:shadow-[6px_6px_0_0_#000]">
                  <Mic2 size={80} className="lg:w-[120px] lg:h-[120px] text-white" strokeWidth={2.5} />
               </div>
               <div className="absolute -top-4 -right-4 lg:-top-6 lg:-right-6 animate-pulse">
                  <Sparkles size={32} className="lg:w-12 lg:h-12 text-black" fill="#FCD34D" strokeWidth={2} />
               </div>
            </div>

            <div className="absolute -bottom-8 -right-8 lg:-bottom-10 lg:-right-10 -rotate-6 group cursor-pointer">
                <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 lg:translate-x-2 lg:translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform" />
                <div className="relative bg-red-500 text-white border-[4px] lg:border-[6px] border-black px-6 lg:px-8 py-2 lg:py-3 font-black italic uppercase text-xl lg:text-3xl shadow-none">
                    FRONT ROW
                </div>
            </div>

            <div className="absolute -top-6 -left-6 lg:-top-10 lg:-left-10 rotate-12">
                <div className="bg-amber-400 text-black border-4 border-black p-3 lg:p-4 shadow-[4px_4px_0_0_#000]">
                    <TicketIcon size={24} className="lg:w-8 lg:h-8" strokeWidth={3} />
                </div>
            </div>

        </div>
    </div>

    {/* Badge LIVE */}
    <div className="absolute top-1/4 left-6 lg:left-12 animate-bounce hidden sm:block">
      <div className="bg-black text-white border-4 border-white px-4 lg:px-6 py-2 shadow-[4px_4px_0_0_#6D4AFF] lg:shadow-[8px_8px_0_0_#6D4AFF] -rotate-12">
        <span className="font-black text-sm lg:text-xl uppercase italic tracking-tighter">LIVE!</span>
      </div>
    </div>

    {/* RUNNING TEXT DIMUNCULIN LAGI DI HP (class 'hidden sm:block' DIBUANG) */}
    <div className="absolute bottom-0 w-full bg-black border-t-4 lg:border-t-8 border-black py-2 lg:py-4 overflow-hidden text-left z-30">
        <div className="marquee-track">
            {[...Array(6)].map((_, i) => (
                <span key={i} className="text-sm lg:text-2xl font-black italic uppercase text-white mx-4 lg:mx-8">
                    GET THE BEST SEAT • MUSIC & THEATER • TIKETIN REVOLUTION
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
      <div className="flex flex-col lg:flex-row-reverse w-full min-h-screen">
        
        {/* ILUSTRASI: Tinggi dibikin 280px biar running text & stiker gak tabrakan */}
        <aside className="w-full lg:w-1/2 h-[280px] sm:h-[350px] lg:h-auto shrink-0">
          <RegisterIllustration />
        </aside>

        {/* PANEL FORM */}
        <section className="w-full lg:w-1/2 flex items-start lg:items-center justify-center p-6 sm:p-10 lg:p-20 relative bg-[#FCFAF1] overflow-y-auto">
          <div className="w-full max-w-lg text-left mt-2 lg:mt-0">
            
            <div className="mb-8 lg:mb-12 flex flex-col items-center lg:items-start group">
               <Link href="/login" className="flex items-center gap-3 lg:gap-4 cursor-pointer">
                  <div className="relative">
                    <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                    <div className="relative h-12 w-12 lg:h-14 lg:w-14 bg-[#6D4AFF] border-[3px] lg:border-4 border-black flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-transform">
                      <TicketIcon size={28} className="lg:w-8 lg:h-8 text-amber-400" strokeWidth={4} />
                    </div>
                  </div>
                  <span className="text-4xl lg:text-5xl font-black italic -skew-x-12 tracking-tighter uppercase leading-none">TIKETIN</span>
               </Link>
               <p className="font-black italic uppercase text-[#6D4AFF] tracking-[0.2em] text-[10px] lg:text-xs mt-3">Stage Access Entrance</p>
            </div>

            <div className="relative mb-10 lg:mb-0">
              <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 lg:translate-x-4 lg:translate-y-4" />
              <div className="relative border-4 lg:border-[8px] border-black bg-white p-6 lg:p-12">
                <header className="mb-8 lg:mb-10 border-b-[3px] lg:border-b-4 border-black pb-4 lg:pb-6">
                  <h2 className="text-4xl lg:text-5xl font-black italic uppercase -skew-x-6 tracking-tighter leading-none">
                    BUAT <span className="text-[#6D4AFF]">AKUN.</span>
                  </h2>
                  <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] lg:text-[10px] mt-3 lg:mt-4 italic">Isi data diri buat war tiket!</p>
                </header>

                <form onSubmit={handleRegister} className="space-y-4 lg:space-y-6">
                  <div className="space-y-1 lg:space-y-2">
                    <Label className="font-black uppercase italic text-[10px] lg:text-xs tracking-widest ml-1 text-left block">Siapa Nama Lo?</Label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                      <div className="relative flex items-center bg-white border-[3px] lg:border-4 border-black">
                        <div className="px-3 lg:px-4 border-r-[3px] lg:border-r-4 border-black h-12 lg:h-14 flex items-center bg-red-500 text-white">
                           <User size={20} strokeWidth={3} />
                        </div>
                        <input 
                          type="text" 
                          placeholder="SIAPA NAMA LO?" 
                          className="w-full h-12 lg:h-14 px-3 lg:px-4 font-bold uppercase outline-none placeholder:text-slate-200 bg-transparent text-sm lg:text-base" 
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 lg:space-y-2">
                    <Label className="font-black uppercase italic text-[10px] lg:text-xs tracking-widest ml-1 text-left block">Email Arena</Label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                      <div className="relative flex items-center bg-white border-[3px] lg:border-4 border-black">
                        <div className="px-3 lg:px-4 border-r-[3px] lg:border-r-4 border-black h-12 lg:h-14 flex items-center bg-[#6D4AFF] text-white">
                           <Mail size={20} strokeWidth={3} />
                        </div>
                        <input 
                          type="email" 
                          placeholder="LEGEND@GMAIL.COM" 
                          className="w-full h-12 lg:h-14 px-3 lg:px-4 font-bold uppercase outline-none placeholder:text-slate-300 bg-transparent text-sm lg:text-base" 
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 lg:space-y-2">
                    <Label className="font-black uppercase italic text-[10px] lg:text-xs tracking-widest ml-1 text-left block">Kunci Rahasia</Label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                      <div className="relative flex items-center bg-white border-[3px] lg:border-4 border-black">
                        <div className="px-3 lg:px-4 border-r-[3px] lg:border-r-4 border-black h-12 lg:h-14 flex items-center bg-amber-400">
                           <Lock size={20} strokeWidth={3} />
                        </div>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••"
                          className="w-full h-12 lg:h-14 px-3 lg:px-4 font-bold outline-none bg-transparent text-sm lg:text-base" 
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 lg:px-4">
                          {showPassword ? <EyeOff size={20} strokeWidth={3} /> : <Eye size={20} strokeWidth={3} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-4 lg:pt-6">
                    <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 lg:translate-x-2 lg:translate-y-2" />
                    <button 
                      type="submit" 
                      className="relative w-full h-16 lg:h-20 border-4 lg:border-[6px] border-black bg-[#6D4AFF] hover:bg-amber-400 hover:text-black text-white font-black text-xl lg:text-2xl italic uppercase transition-all flex items-center justify-center gap-3 lg:gap-4 group active:translate-x-1 active:translate-y-1 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={28} strokeWidth={4} /> : (
                          <>GABUNG SEKARANG <ArrowRight size={28} strokeWidth={4} className="group-hover:translate-x-2 transition-transform" /></>
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-8 lg:mt-10 text-center lg:text-right border-t-[3px] lg:border-t-4 border-black pt-5 lg:pt-6">
                  <p className="text-slate-900 font-black italic uppercase tracking-tight text-[11px] lg:text-sm">
                    DAH ADA AKUN? <Link href="/login" className="text-[#6D4AFF] underline decoration-2 lg:decoration-[4px] underline-offset-4 hover:bg-amber-400 transition-colors">MASUK SINI</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}