"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { 
  LayoutDashboard, CalendarCheck, Users, Wallet, 
  ShieldCheck, LifeBuoy, LogOut, Loader2, Zap, Terminal, AlertTriangle, IdCard
} from "lucide-react";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAccess = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || profile?.role !== "admin") {
        console.error("ACCESS DENIED");
        router.push("/");
      } else {
        setIsAuthorized(true);
        setIsLoading(false);
      }
    };
    checkAccess();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // TAMBAH MENU VERIFIKASI KTP DI SINI
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Verifikasi Event", icon: CalendarCheck, href: "/admin/verify-events" },
    { name: "Verifikasi KTP", icon: IdCard, href: "/admin/verify-ktp" },
    { name: "Daftar User & EO", icon: Users, href: "/admin/users" },
    { name: "Transaksi Global", icon: Wallet, href: "/admin/transactions" },
    { name: "Sertifikasi/Legal", icon: ShieldCheck, href: "/admin/legal" },
    { name: "Layanan Pengaduan", icon: LifeBuoy, href: "/admin/complaints" },
  ];

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black font-black italic">
        <div className="p-8 border-8 border-black shadow-[12px_12px_0px_0px_rgba(109,74,255,1)] flex flex-col items-center">
          <Loader2 className="animate-spin mb-4 text-[#6D4AFF]" size={64} strokeWidth={4} />
          <p className="uppercase tracking-[0.5em] text-xs">Admin OS Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className={`flex min-h-screen bg-white ${poppins.className} text-black`}>
      {/* SIDEBAR BRUTAL TOTAL */}
      <aside className="w-80 bg-white border-r-8 border-black flex flex-col sticky top-0 h-screen z-50">
        
        {/* LOGO BOX */}
        <div className="p-8 border-b-8 border-black bg-[#6D4AFF] text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white p-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Zap className="text-[#6D4AFF]" size={24} strokeWidth={4} />
            </div>
            <span className="text-3xl font-black italic uppercase tracking-tighter -skew-x-12">TIKETIN.</span>
          </div>
          <div className="bg-black text-white px-3 py-1 inline-flex items-center gap-2 text-[9px] font-black uppercase italic tracking-widest border-2 border-white">
            <Terminal size={12} /> Central Control
          </div>
        </div>

        {/* MENU LIST */}
        <nav className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar text-left bg-slate-50">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-4 px-6 py-5 border-4 border-black font-black uppercase italic text-[10px] tracking-widest transition-all ${
                  isActive 
                  ? "bg-black text-white shadow-[6px_6px_0px_0px_rgba(109,74,255,1)] translate-x-[-4px] translate-y-[-4px]" 
                  : "bg-white text-black hover:bg-slate-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                }`}
              >
                <item.icon size={20} strokeWidth={3} className={isActive ? "text-amber-400" : "text-black"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT AREA */}
        <div className="p-6 border-t-8 border-black bg-white">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-4 w-full px-6 py-5 bg-red-500 text-white border-4 border-black font-black uppercase italic text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            <LogOut size={20} strokeWidth={4} />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* MAIN STAGE */}
      <main className="flex-1 p-8 md:p-16 bg-white overflow-y-auto relative">
        {/* Background Grid Pattern (Brutal Style) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, black 2px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {children}
        </div>

        {/* System Info (Floating) */}
        <div className="fixed bottom-8 right-8 pointer-events-none hidden xl:block">
          <div className="bg-black text-white border-2 border-black p-4 font-black italic text-[8px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(109,74,255,1)]">
             <div className="flex items-center gap-2">
  
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}