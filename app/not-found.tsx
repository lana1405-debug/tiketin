"use client";

import Link from "next/link";
import { Poppins } from "next/font/google";
import { motion } from "framer-motion";
import { Ticket, ArrowLeft } from "lucide-react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export default function NotFound() {
  return (
    <div className={`min-h-screen bg-[#FCFAF1] text-slate-900 flex flex-col items-center justify-center p-6 select-none ${poppins.className}`}>
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none opacity-5 noise" />
      
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
        className="max-w-md w-full bg-white border-4 border-slate-900 p-8 text-center shadow-[8px_8px_0_0_#000] relative z-10"
      >
        <div className="absolute -top-6 -left-6 bg-yellow-400 border-4 border-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wider transform -rotate-3 shadow-[4px_4px_0_0_#000]">
          Waduh!
        </div>

        {/* Huge 404 heading with Ticket replacing '0' */}
        <div className="flex items-center justify-center gap-1 my-6">
          <span className="text-8xl md:text-9xl font-black tracking-tighter text-slate-900">4</span>
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="inline-block bg-[#6D4AFF] text-white p-4 border-4 border-slate-900 rounded-2xl shadow-[4px_4px_0_0_#000] transform -rotate-6"
          >
            <Ticket className="w-16 h-16 md:w-20 md:h-20 stroke-[3]" />
          </motion.div>
          <span className="text-8xl md:text-9xl font-black tracking-tighter text-slate-900">4</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-4 leading-none">
          Halaman Tidak Ditemukan!
        </h1>
        
        <p className="text-slate-600 font-medium mb-8 text-sm md:text-base leading-relaxed">
          Sepertinya tiket atau halaman yang kamu cari sudah kedaluwarsa atau hilang entah kemana. Jangan khawatir, yuk balik lagi!
        </p>

        {/* CTA Button */}
        <Link href="/explore" className="block">
          <motion.div
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98, translateY: 1 }}
            className="w-full bg-[#6D4AFF] hover:bg-[#5b3edd] text-white font-black uppercase italic tracking-wider py-4 px-6 border-4 border-slate-900 shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] active:shadow-[2px_2px_0_0_#000] cursor-pointer transition-all flex items-center justify-center gap-3"
          >
            <ArrowLeft className="w-5 h-5 stroke-[3]" />
            Kembali Ke Explore
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );
}
