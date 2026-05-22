"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { 
  LayoutDashboard, CalendarCheck, Users, Wallet, 
  ShieldCheck, LifeBuoy, LogOut, Loader2, Landmark, Zap, Terminal, AlertTriangle, IdCard, BarChart3, Ticket as TicketIcon,
  Menu, X
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./admin.css";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // 💥 MENU BARU DITAMBAH DI SINI 💥
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Verifikasi Event", icon: CalendarCheck, href: "/admin/verify-events" },
    { name: "Verifikasi KTP", icon: IdCard, href: "/admin/verify-ktp" },
    { name: "Daftar User & EO", icon: Users, href: "/admin/users" },
    { name: "Transaksi Global", icon: Wallet, href: "/admin/transactions" },
    { name: "Event Analytics", icon: BarChart3, href: "/admin/event-analytics" },
    { name: "Sertifikasi/Legal", icon: ShieldCheck, href: "/admin/legal" },
    { name: "Pencairan Dana", icon: Landmark, href: "/admin/withdrawals" },
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

  const SidebarContent = () => (
    <>
      {/* LOGO BOX */}
      <div className="p-6 lg:p-8 border-b-8 border-black bg-[#6D4AFF] text-white">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <TicketIcon className="text-[#6D4AFF]" size={24} strokeWidth={4} />
            </div>
            <span className="text-3xl font-black italic uppercase tracking-tighter -skew-x-12">TIKETIN.</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* Close button for mobile drawer */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 bg-white/20 border-2 border-white hover:bg-white/40 transition-colors"
            >
              <X size={20} strokeWidth={3} className="text-white" />
            </button>
          </div>
        </div>
        <div className="bg-black text-white px-3 py-1 inline-flex items-center gap-2 text-[9px] font-black uppercase italic tracking-widest border-2 border-white">
          <Terminal size={12} /> Central Control
        </div>
      </div>

      {/* MENU LIST */}
      <nav className="flex-1 p-4 lg:p-6 space-y-3 lg:space-y-4 overflow-y-auto custom-scrollbar text-left bg-slate-50">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-4 px-4 lg:px-6 py-4 lg:py-5 border-4 border-black font-black uppercase italic text-[10px] tracking-widest transition-all ${
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
      <div className="p-4 lg:p-6 border-t-8 border-black bg-white">
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-4 w-full px-6 py-5 bg-red-500 text-white border-4 border-black font-black uppercase italic text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
        >
          <LogOut size={20} strokeWidth={4} />
          Keluar Sistem
        </button>
      </div>
    </>
  );

  return (
    <div className={`flex min-h-screen bg-white ${poppins.className} text-black admin-layout`}>
      
      {/* ── DESKTOP SIDEBAR (hidden on mobile/tablet) ── */}
      <aside className="hidden lg:flex w-80 bg-white border-r-8 border-black flex-col sticky top-0 h-screen z-50">
        <SidebarContent />
      </aside>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-72 sm:w-80 bg-white border-r-8 border-black flex flex-col z-10 overflow-y-auto">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── MAIN STAGE ── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ── MOBILE TOPBAR (hidden on desktop) ── */}
        <header className="lg:hidden sticky top-0 z-50 bg-[#6D4AFF] border-b-4 border-black h-16 flex items-center justify-between px-4 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-white border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <Menu size={22} strokeWidth={3} className="text-[#6D4AFF]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-white p-1.5 border-2 border-black">
              <TicketIcon className="text-[#6D4AFF]" size={18} strokeWidth={4} />
            </div>
            <span className="text-xl font-black italic uppercase tracking-tighter -skew-x-12 text-white">TIKETIN.</span>
          </div>
          <ThemeToggle />
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 p-4 sm:p-8 lg:p-16 bg-white overflow-y-auto relative">
          {/* Background Grid Pattern (Brutal Style) */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, var(--grid-color) 2px, transparent 0)', backgroundSize: '40px 40px' }} />
          
          <div className="max-w-7xl mx-auto relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}