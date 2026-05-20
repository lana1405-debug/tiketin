"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { Mail, Lock, Eye, EyeOff, Ticket, Star, Loader2, ArrowRight, Ticket as TicketIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800", "900"] 
});

const GLOBAL_STYLES = `
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  .marquee-track { display:flex; width:max-content; animation:marquee 20s linear infinite; }
  .noise::after {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:999; opacity:.03;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }
`;

const LoginIllustration = () => (
  <div className="relative w-full h-full bg-[#6D4AFF] flex items-center justify-center overflow-hidden border-b-8 lg:border-b-0 lg:border-l-[12px] border-black py-12 lg:py-0">
    <div className="absolute inset-0 opacity-20" 
      style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #000, #000 10px, transparent 10px, transparent 20px)' }} 
    />

    <div className="relative z-20 scale-75 lg:scale-100">
        <div className="absolute inset-0 bg-black translate-x-4 translate-y-4" />
        <div className="relative bg-white border-[8px] lg:border-[10px] border-black p-10 lg:p-16 -rotate-3">
            <TicketIcon size={80} className="lg:w-[120px] lg:h-[120px] text-[#6D4AFF]" strokeWidth={3} />
            <div className="absolute -top-6 -right-6 lg:-top-8 lg:-right-8 bg-amber-400 border-4 border-black px-4 lg:px-6 py-2 font-black italic uppercase shadow-[4px_4px_0_0_#000] rotate-12 text-xs lg:text-base">
                OFFICIAL
            </div>
        </div>
    </div>

    {/* Floating Star - Hidden on small mobile to keep it clean */}
    <div className="absolute top-5 right-5 lg:top-10 lg:right-10 animate-bounce hidden xs:block">
      <div className="p-2 lg:p-4 bg-red-500 text-white border-4 border-black shadow-[4px_4px_0_0_#000] rotate-12">
        <Star size={20} className="lg:w-8 lg:h-8" fill="white" />
      </div>
    </div>

    <div className="absolute bottom-0 w-full bg-black border-t-4 lg:border-t-8 border-black py-2 lg:py-4 overflow-hidden">
        <div className="marquee-track">
            {[...Array(6)].map((_, i) => (
                <span key={i} className="text-sm lg:text-2xl font-black italic uppercase text-amber-400 mx-4">
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
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
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
    <main className={`min-h-screen bg-[#FCFAF1] ${poppins.className} noise`}>
      <div className="flex flex-col lg:flex flex-col md:flex-row min-h-screen w-full">
        
        {/* PANEL ILUSTRASI (Muncul di ATAS saat di HP) */}
        <aside className="w-full lg:w-1/2 h-[250px] lg:h-auto">
          <LoginIllustration />
        </aside>

        {/* PANEL FORM */}
        <section className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-14 bg-[#FCFAF1]">
          <div className="w-full max-w-md lg:max-w-lg">
            
            {/* LOGO AREA */}
            <div className="mb-8 lg:mb-12 flex flex-col items-center lg:items-start">
               <div className="flex items-center gap-3 lg:gap-4 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                    <div className="relative h-10 w-10 lg:h-14 lg:w-14 bg-[#6D4AFF] border-[3px] lg:border-4 border-black flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-transform">
                      <TicketIcon className="text-amber-400 w-6 h-6 lg:w-8 lg:h-8" strokeWidth={4} />
                    </div>
                  </div>
                  <span className="text-3xl lg:text-5xl font-black italic -skew-x-12 tracking-tighter uppercase">TIKETIN</span>
               </div>
            </div>

            {/* FORM CARD */}
            <div className="relative">
              <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 lg:translate-x-4 lg:translate-y-4" />
              <div className="relative border-4 lg:border-[8px] border-black bg-white p-6 lg:p-14 text-left">
                <header className="mb-8 lg:mb-12">
                  <h2 className="text-3xl lg:text-5xl font-black italic uppercase -skew-x-6 tracking-tighter leading-none">
                    SIAP <span className="text-[#6D4AFF]">WAR?</span>
                  </h2>
                  <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] lg:text-xs mt-2">Masukin kuncinya buat masuk </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
                  <div className="space-y-2 lg:space-y-3">
                    <Label className="font-black uppercase italic text-xs lg:text-sm tracking-widest">Email</Label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                      <div className="relative flex items-center bg-white border-[3px] lg:border-4 border-black">
                        <div className="px-3 lg:px-4 border-r-[3px] lg:border-r-4 border-black h-12 lg:h-16 flex items-center bg-amber-400">
                           <Mail size={20} className="lg:w-6 lg:h-6" strokeWidth={3} />
                        </div>
                        <input 
                          type="email" 
                          placeholder="........@GMAIL.COM" 
                          className="w-full h-12 lg:h-16 px-4 lg:px-6 font-bold text-sm lg:text-lg uppercase outline-none placeholder:text-slate-300 bg-transparent" 
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 lg:space-y-3">
                    <div className="flex justify-between font-black uppercase italic text-xs lg:text-sm tracking-widest">
                      <Label>Kunci Rahasia</Label>
                      <Link href="/forgot-password" className="text-red-500 cursor-pointer hover:underline decoration-2 lg:decoration-4">
  LUPA?
</Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1" />
                      <div className="relative flex items-center bg-white border-[3px] lg:border-4 border-black">
                        <div className="px-3 lg:px-4 border-r-[3px] lg:border-r-4 border-black h-12 lg:h-16 flex items-center bg-[#6D4AFF] text-white">
                           <Lock size={20} className="lg:w-6 lg:h-6" strokeWidth={3} />
                        </div>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••"
                          className="w-full h-12 lg:h-16 px-4 lg:px-6 font-bold text-sm lg:text-xl uppercase outline-none placeholder:text-slate-300 bg-transparent" 
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 lg:px-4">
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-2 lg:pt-4">
                    <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 lg:translate-x-2 lg:translate-y-2" />
                    <button 
                      type="submit" 
                      className="relative w-full h-14 lg:h-20 border-4 lg:border-[6px] border-black bg-[#6D4AFF] hover:bg-amber-400 hover:text-black text-white font-black text-lg lg:text-2xl italic uppercase transition-all flex items-center justify-center gap-2 lg:gap-4 active:translate-x-1 active:translate-y-1 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={24} /> : (
                          <>MASUK SEKARANG <ArrowRight size={24} className="lg:w-8 lg:h-8" strokeWidth={4} /></>
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-8 lg:mt-12 text-center lg:text-left border-t-2 lg:border-t-4 border-black pt-6 lg:pt-8">
                  <p className="text-slate-900 font-black italic uppercase tracking-tight text-sm lg:text-lg">
                    BARU DI SINI? <Link href="/register" className="text-[#6D4AFF] underline decoration-[4px] lg:decoration-[6px] underline-offset-4 hover:bg-amber-400 transition-colors">DAFTAR AKUN</Link>
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