"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800", "900"] 
});

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Daftarkan email dan password ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Simpan nama DAN EMAIL ke tabel profiles (Penting agar tidak 'No Email')
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: authData.user.id,
              full_name: fullName,
              email: email, // <-- FIX: Sekarang email tersimpan ke database
              role: "customer",
            }
          ]);

        if (profileError) throw profileError;
      }

      alert("Akun berhasil dibuat! Selamat datang di Tiketin.");
      // 3. Langsung arahkan ke halaman utama customer
      router.push("/explore"); 

    } catch (error: any) {
      alert("Gagal mendaftar: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={`min-h-screen bg-[#FCFAF1] flex ${poppins.className}`}>
      <div className="flex flex-col-reverse lg:flex-row-reverse w-full">
        
        {/* PANEL FORM */}
        <section className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#FCFAF1]">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center">
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
              <header className="mb-8 text-center">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Buat Akun Baru
                </h2>
                <p className="text-slate-500 mt-2 text-sm font-medium">Mulai petualangan konsermu di sini!</p>
              </header>

              <form onSubmit={handleRegister} className="space-y-5">
                {/* Input Nama Lengkap */}
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Nama Lengkap</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-[#553C9A]" />
                    <Input 
                      type="text" 
                      placeholder="Nama kamu..." 
                      className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#553C9A] transition-all" 
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Input Email */}
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

                {/* Input Password */}
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-[#553C9A]" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Minimal 6 karakter"
                      className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#553C9A] transition-all" 
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
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
                  className="w-full h-14 mt-4 rounded-2xl bg-[#FF6B6B] hover:bg-[#e55a5a] text-white font-bold text-xl transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="animate-spin" size={20} />}
                  {isLoading ? "Menyiapkan Akun..." : "Daftar Sekarang"}
                </Button>
              </form>

              <div className="relative my-8 text-center">
                <hr className="border-slate-100" />
                <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-white px-4 text-xs font-bold text-slate-300 uppercase tracking-widest">Sudah Punya Akun?</span>
              </div>

              <p className="text-center text-slate-600 font-medium">
                Kembali ke halaman <Link href="/login" className="text-[#553C9A] font-black hover:underline">Masuk</Link>
              </p>
            </div>
          </div>
        </section>

        {/* PANEL ILUSTRASI */}
        <aside className="w-full lg:w-1/2 min-h-[300px] lg:min-h-screen relative bg-[#FFD369] flex items-center justify-center overflow-hidden">
           <div className="absolute inset-0">
             <div className="absolute top-0 left-0 right-0 h-[60%] bg-gradient-to-b from-[#ffc844] to-transparent opacity-60" style={{ borderRadius: '0% 0% 40% 60% / 0% 0% 20% 30%' }} />
             <div className="absolute bottom-[-10%] left-[-5%] w-[70%] h-[70%] bg-[#553C9A] rounded-full blur-[120px] opacity-20 animate-pulse" />
           </div>

           <div className="relative z-10 text-center px-12">
             <div className="mb-8 flex justify-center">
               <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] rotate-3">
                 <Sparkles size={64} className="text-[#FF6B6B]" />
               </div>
             </div>
             <p className="text-xl text-yellow-900/80 font-bold tracking-wide">
               Jadilah bagian dari momen tak terlupakan.
             </p>
           </div>
        </aside>

      </div>
    </main>
  );
}