"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; // Pastikan path ini sesuai dengan file koneksi kamu
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Poppins } from "next/font/google";
import { Mail, Lock, Eye, EyeOff, Music, Ticket, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800", "900"] 
});

const LoginIllustration = () => (
  <div className={`relative w-full h-full bg-[#553C9A] flex items-center justify-center overflow-hidden ${poppins.className}`}>
    <div className="absolute inset-0">
      <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-[#432d7a] to-transparent opacity-60" style={{ borderRadius: '40% 60% 0% 0% / 20% 30% 0% 0%' }} />
      <div className="absolute top-[-10%] right-[-5%] w-[70%] h-[70%] bg-[#FF6B6B] rounded-full blur-[120px] opacity-20 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-[#FFD369] rounded-full blur-[100px] opacity-10" />
    </div>

    <div className="absolute top-20 left-20 animate-bounce">
      <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 -rotate-12">
        <Music size={40} className="text-[#FFD369]" />
      </div>
    </div>
    
    <div className="absolute bottom-24 right-20 animate-pulse">
      <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 rotate-12">
        <Star size={32} className="text-[#FF6B6B]" />
      </div>
    </div>

    <div className="relative z-10 text-center px-12">
      <div className="mb-8 flex justify-center">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] -rotate-3">
          <Ticket size={64} className="text-[#553C9A]" />
        </div>
      </div>
      <p className="text-xl text-purple-100/80 font-medium tracking-wide">
        Ribuan tiket konser. Satu platform. Tanpa ribet.
      </p>
    </div>
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Proses Login ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Ambil data Role dari tabel 'profiles' (Gunakan maybeSingle)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // 3. Pengalihan (Redirect) berdasarkan Role
      const role = profile?.role || "customer"; 

      if (role === "admin") {
        router.push("/admin/dashboard");
      } else if (role === "eo") {
        router.push("/eo/dashboard");
      } else {
        router.push("/explore"); 
      }

    } catch (error: any) {
      alert("Login Gagal: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={`min-h-screen bg-[#FCFAF1] flex ${poppins.className}`}>
      <div className="flex flex-col-reverse lg:flex-row w-full">
        
        {/* PANEL FORM (Kiri) */}
        <section className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#FCFAF1]">
          <div className="w-full max-w-md">
            <div className="mb-10 flex justify-center">
              <Image
                src="/logo-tiketin.png" 
                alt="Logo Tiketin"
                width={200}
                height={80}
                className="h-auto w-48 drop-shadow-2xl transition-transform hover:scale-105"
                priority
              />
            </div>

            <div className="rounded-[40px] border border-slate-200 bg-white p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
              <header className="mb-10 text-center">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Selamat Datang!
                </h2>
              </header>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-[#553C9A]" />
                    <Input 
                      type="email" 
                      placeholder="email@contoh.com" 
                      className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#553C9A] transition-all" 
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-slate-700 text-sm ml-1">
                    <Label>Password</Label>
                    <span className="text-[#FF6B6B] cursor-pointer hover:underline">Lupa?</span>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-[#553C9A]" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#553C9A] transition-all" 
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-slate-400"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl bg-[#553C9A] hover:bg-[#432d7a] text-white font-bold text-xl transition-all shadow-xl shadow-purple-100 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="animate-spin" size={20} />}
                  {isLoading ? "Memproses..." : "Masuk Sekarang"}
                </Button>
              </form>

              <div className="relative my-10 text-center">
                <hr className="border-slate-100" />
                <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-white px-4 text-xs font-bold text-slate-300 uppercase tracking-widest">Atau</span>
              </div>

              <p className="text-center text-slate-600 font-medium">
                Baru di Tiketin? <span className="text-[#FF6B6B] font-black cursor-pointer hover:underline">Daftar</span>
              </p>
            </div>
          </div>
        </section>

        {/* PANEL ILUSTRASI (Kanan) */}
        <aside className="w-full lg:w-1/2 min-h-[300px] lg:min-h-screen">
          <LoginIllustration />
        </aside>

      </div>
    </main>
  );
}