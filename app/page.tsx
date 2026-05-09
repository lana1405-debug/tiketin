"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [status, setStatus] = useState("Sedang mengecek koneksi...");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Mengetes koneksi dengan memanggil data session user
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        console.log("Koneksi Supabase Berhasil!", data);
        setStatus("✅ Koneksi Supabase Berhasil!");
      } catch (err: any) {
        console.error("Koneksi Gagal:", err.message);
        setStatus("❌ Koneksi Gagal: " + err.message);
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 font-sans p-8">
      <main className="flex flex-col items-center gap-6 text-center bg-white p-12 rounded-2xl shadow-sm border border-zinc-200">
        <h1 className="text-3xl font-bold text-black">Status Proyek Tiketin</h1>
        
        <div className={`px-6 py-3 rounded-full font-medium text-sm ${
          status.includes("Berhasil") 
            ? "bg-green-100 text-green-700" 
            : "bg-yellow-100 text-yellow-700"
        }`}>
          {status}
        </div>

        <p className="max-w-md text-zinc-600">
          {"Jika status di atas hijau, berarti konfigurasi .env.local dan lib/supabase.ts kamu sudah bekerja dengan benar."}
        </p>

        <div className="text-xs text-zinc-400 mt-4">
          {"Cek Inspect Element (F12) > Console untuk melihat detail data teknisnya."}
        </div>
      </main>
    </div>
  );
}