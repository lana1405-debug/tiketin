"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, ArrowRight } from "lucide-react";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email"); // Email dibawa dari halaman sebelumnya
  
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // ⚡ Validasi OTP ke Supabase
    const { error } = await supabase.auth.verifyOtp({
      email: email || "",
      token: otp,
      type: "recovery", // 'recovery' untuk reset password
    });

    if (error) {
      alert("Kode salah atau kadaluwarsa, Man! Coba cek lagi.");
      setIsLoading(false);
    } else {
      // Kalau sukses, lempar ke halaman ganti password baru
      router.push("/auth/update-password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FCFAF1]">
      <div className="w-full max-w-md bg-white border-8 border-black p-10 shadow-[10px_10px_0_0_#6D4AFF]">
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="bg-amber-400 p-3 w-max border-4 border-black">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black italic uppercase -skew-x-6">MASUKKIN KODE</h2>
          <p className="text-xs font-bold text-slate-500 uppercase">Kita udah kirim kode 6 digit ke <span className="text-black font-black">{email}</span></p>
          
          <input 
            type="text" 
            placeholder="000000" 
            maxLength={6}
            required
            className="w-full p-4 border-4 border-black font-black text-center text-4xl tracking-[0.5em] uppercase outline-none"
            onChange={(e) => setOtp(e.target.value)}
          />
          
          <button className="w-full bg-black text-white p-4 font-black uppercase flex items-center justify-center gap-2 hover:bg-[#6D4AFF]">
            {isLoading ? <Loader2 className="animate-spin" /> : <>VERIFIKASI <ArrowRight /></>}
          </button>
        </form>
      </div>
    </div>
  );
}