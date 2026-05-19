"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Key, ArrowRight, Loader2 } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Supabase otomatis ngenalin session dari token di URL
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      alert("Gagal update: " + error.message);
    } else {
      alert("Password berhasil diganti! Login sekarang.");
      router.push("/login");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FCFAF1]">
      <form onSubmit={handleUpdate} className="bg-white border-8 border-black p-10 w-full max-w-sm space-y-6 shadow-[8px_8px_0_0_#6D4AFF]">
        <h2 className="text-2xl font-black uppercase italic">PASSWORD BARU</h2>
        <input 
          type="password" required placeholder="PASSWORD BARU..."
          className="w-full p-4 border-4 border-black font-black uppercase"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full bg-black text-white p-4 font-black uppercase flex items-center justify-center gap-2">
          {isLoading ? <Loader2 className="animate-spin"/> : <>UPDATE <ArrowRight /></>}
        </button>
      </form>
    </div>
  );
}