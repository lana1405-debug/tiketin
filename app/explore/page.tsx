"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, MapPin, Calendar, LogOut, Ticket, 
  ChevronRight, Sparkles, User, LayoutDashboard, 
  Heart as HeartIcon, // TAMBAHIN 'as HeartIcon' DI SINI MAN!
  Loader2, Mail, Phone, Camera, Send, Play,
  Trophy, MessageSquare, PlusCircle, Zap, TrendingUp,
  Ticket as TicketIcon, ShieldCheck
} from "lucide-react";
import Link from "next/link"; // TAMBAHIN INI MAN!

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800", "900"] 
});

export default function ExplorePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroEvents, setHeroEvents] = useState<any[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [router]);

  useEffect(() => {
    if (mounted && heroEvents.length > 1) {
      const timer = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroEvents.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [mounted, heroEvents]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profile) setUserProfile(profile);

    const { data: eventData } = await supabase
      .from("events")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (eventData) {
      setEvents(eventData);
      setHeroEvents(eventData.slice(0, 3));
    }
    setIsLoading(false);
  };

  const filteredEvents = events.filter((event) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      event.title?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query)
    );
    const matchesCategory = selectedCategory === "ALL" || event.category?.toUpperCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { 
      style: "currency", currency: "IDR", maximumFractionDigits: 0 
    }).format(angka);
  };

  if (!mounted || isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white font-black italic text-2xl text-[#6D4AFF]">
      <Loader2 className="animate-spin mr-3" /> LOADING TIKETIN...
    </div>
  );

  return (
    <div className={`min-h-screen bg-white text-slate-900 ${poppins.className}`}>
      
      {/* --- HEADER --- */}
      <nav className="w-full bg-white border-b-4 border-slate-900 sticky top-0 z-[50] shadow-[0_4px_0_0_rgba(0,0,0,1)] h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/explore" className="flex items-center gap-2 group">
            <div className="h-10 w-10 bg-[#6D4AFF] border-4 border-slate-900 -rotate-12 flex items-center justify-center group-hover:rotate-0 transition-transform shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <Zap className="text-amber-400" size={24} strokeWidth={3} />
            </div>
            <span className="text-2xl font-black italic -skew-x-12 tracking-tighter uppercase">TIKETIN</span>
          </Link>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group p-1 pr-3 rounded-2xl transition-all border-2 border-transparent hover:border-slate-900">
                  <div className="text-right hidden md:block">
                    <p className="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">
                      {userProfile?.verification_status === 'approved' ? (
                        <span className="text-emerald-500">VERIFIED</span>
                      ) : userProfile?.verification_status === 'pending' ? (
                        <span className="text-amber-500">PENDING KYC</span>
                      ) : (
                        <span className="text-red-500">UNVERIFIED</span>
                      )}
                    </p>
                    <p className="text-xs font-black italic -skew-x-6 uppercase">{userProfile?.full_name?.split(" ")[0]}</p>
                  </div>
                  <Avatar className="h-10 w-10 border-4 border-slate-900 rounded-none -rotate-6 shadow-[3px_3px_0_0_rgba(0,0,0,1)] group-hover:rotate-0 transition-transform">
                    <AvatarImage src={userProfile?.avatar_url} />
                    <AvatarFallback className="bg-[#6D4AFF] text-white font-black">{userProfile?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 border-4 border-slate-900 rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-2 bg-white z-[60]">
                <DropdownMenuLabel className="font-black italic uppercase text-[10px] text-slate-400">Quick Access</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-900 h-0.5" />
                <DropdownMenuItem onClick={() => router.push('/verify')} className="focus:bg-amber-400 font-black italic uppercase text-xs py-3 cursor-pointer"><ShieldCheck className="mr-2 h-4 w-4" /> {userProfile?.verification_status === 'approved' ? 'Status KTP (Lolos)' : 'Verifikasi KTP'}</DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-blue-500 focus:text-white font-black italic uppercase text-xs py-3"><TicketIcon className="mr-2 h-4 w-4" /> Tiket Saya</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('explore/complaints')} className="focus:bg-emerald-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer"><MessageSquare className="mr-2 h-4 w-4" /> Pengaduan</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-900 h-0.5" />
                <DropdownMenuItem className="focus:bg-red-500 focus:text-white font-black italic uppercase text-xs py-3 text-red-500" onClick={() => supabase.auth.signOut()}><LogOut className="mr-2 h-4 w-4" /> Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* --- CONTENT --- */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 pt-16 pb-24">
        <header className="mb-16 space-y-8 flex flex-col items-start text-left">
          <h1 className="text-6xl md:text-8xl font-black -skew-x-12 italic uppercase leading-[0.75] tracking-tighter">
            YO, {userProfile?.full_name?.split(" ")[0].toUpperCase()}!
          </h1>
          
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" strokeWidth={3} />
            <input 
              placeholder="CARI KONSER (lokasi dan artis)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-20 w-full pl-16 pr-6 border-4 border-slate-900 bg-white font-black text-lg uppercase shadow-[8px_8px_0_0_rgba(109,74,255,1)] outline-none -skew-x-3 focus:bg-slate-50 transition-all"
            />
          </div>
        </header>

        {/* HERO SECTION */}
        {!searchQuery && (
          <section className="mb-32">
            <div className="relative w-full h-[450px] border-8 border-slate-900 overflow-hidden bg-slate-900 shadow-[16px_16px_0_0_rgba(0,0,0,1)]">
              <AnimatePresence mode="wait">
                {heroEvents.length > 0 && (
                  <motion.img
                    key={currentHeroIndex}
                    src={heroEvents[currentHeroIndex]?.image_url}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 w-full h-full object-cover grayscale-[20%]"
                  />
                )}
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent" />
              <div className="relative z-20 h-full p-12 flex flex-col justify-end items-start text-left">
                <div className="bg-amber-400 border-4 border-slate-900 px-4 py-2 font-black uppercase text-[10px] shadow-[4px_4px_0_0_rgba(0,0,0,1)] -rotate-2 mb-6 italic inline-flex items-center gap-2"><Sparkles size={14}/> RECOMMENDED</div>
                <h2 className="text-6xl md:text-8xl font-black italic uppercase text-white tracking-tighter drop-shadow-[4px_4px_0_rgba(0,0,0,1)] -skew-x-6 mb-8">{heroEvents[currentHeroIndex]?.title || "LIVE NOW"}</h2>
                <button className="bg-white border-4 border-slate-900 px-10 py-5 font-black uppercase text-sm shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:bg-amber-400 transition-all -skew-x-6">BOOK NOW</button>
              </div>
            </div>
          </section>
        )}

        {/* --- TITLE & CATEGORY FILTER SECTION (LEBIH TURUN KE BAWAH) --- */}
        <div className="flex flex-col items-center justify-center space-y-16 mb-24 mt-40 pt-10"> 
          
          {/* Judul Nearby Stages (Centered & Clean) */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
               <TrendingUp className="text-red-500" size={40} strokeWidth={4} />
               <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter -skew-x-6 text-center">
                 {searchQuery ? `SEARCHING: "${searchQuery}"` : "NEARBY STAGES"}
               </h2>
            </div>
            {/* Garis Dekorasi Bawah Judul biar makin gahar */}
            <div className="h-2 w-40 bg-slate-900 -skew-x-12 mt-2" />
          </div>

          {/* FILTER CHIPS (Center Alignment & Brutal Spacing) */}
          <div className="flex flex-wrap items-center justify-center gap-10 w-full max-w-5xl mx-auto pt-4"> 
            {["ALL", "MUSIK", "TEATER"].map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`group relative px-14 py-6 border-4 border-slate-900 font-black italic uppercase text-sm transition-all shadow-[10px_10px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 ${
                    isActive 
                    ? "bg-[#6D4AFF] text-white shadow-none translate-x-1 translate-y-1" 
                    : "bg-white text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {cat === "MUSIK" && <Zap size={24} className={isActive ? "text-amber-400" : "text-[#6D4AFF]"} />}
                    {cat === "TEATER" && <Sparkles size={24} className={isActive ? "text-amber-300" : "text-purple-500"} />}
                    <span className="tracking-[0.15em] text-lg">{cat}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* GRID EVENTS */}
        <div className="mt-12">
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-24">
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_0_rgba(109,74,255,1)] transition-all flex flex-col group">
                  <div className="relative h-64 border-b-4 border-slate-900 overflow-hidden">
                    <img src={event.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <button className="absolute top-4 right-4 p-3 bg-white border-4 border-slate-900 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-red-500 hover:text-white transition-all">
                      <HeartIcon size={18} strokeWidth={3}/>
                    </button>
                  </div>
                  <div className="p-8 space-y-6 flex-grow flex flex-col text-left">
                    <h3 className="text-2xl font-black italic uppercase -skew-x-6 tracking-tighter line-clamp-1">{event.title}</h3>
                    <div className="space-y-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <div className="flex items-center gap-3"><Calendar size={18} className="text-red-500" /> {event.date}</div>
                      <div className="flex items-center gap-3"><MapPin size={18} className="text-[#6D4AFF]" /> {event.location}</div>
                    </div>
                    <div className="pt-6 border-t-4 border-slate-900 flex items-center justify-between mt-auto">
                      <div className="text-left">
                        <p className="text-[8px] font-black text-slate-400 mb-1 uppercase italic">From</p>
                        <p className="text-2xl font-black text-[#6D4AFF] italic tracking-tighter leading-none">{formatRupiah(event.price)}</p>
                      </div>
                      <button className="h-14 w-14 bg-slate-900 text-white flex items-center justify-center border-4 border-slate-900 shadow-[4px_4px_0_0_rgba(109,74,255,1)] rotate-12 hover:rotate-0 transition-all">
                        <ChevronRight size={24} strokeWidth={4}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border-8 border-dashed border-slate-200 mb-24">
              <p className="text-4xl font-black italic uppercase text-slate-300">STAGE GAK NEMU, MAN!</p>
              <p className="text-slate-400 font-bold italic mt-2 uppercase">Coba cari kategori atau artis lain.</p>
            </div>
          )}
        </div>

        {/* --- CTA BANNER --- */}
        {!searchQuery && (
          <section className="bg-gradient-to-br from-[#6D4AFF] to-[#553C9A] border-8 border-slate-900 p-12 md:p-20 text-white shadow-[20px_20px_0_0_rgba(0,0,0,1)] relative overflow-hidden mb-20 text-left">
            <div className="relative z-10 space-y-8 max-w-xl">
              <div className="bg-white border-4 border-slate-900 px-4 py-2 font-black uppercase text-[10px] text-slate-900 -rotate-2 inline-block italic">EVENT MANAGER</div>
              <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.8] -skew-x-6">PUNYA EVENT? <br/> JUAL DI SINI.</h2>
              <p className="text-purple-100 font-bold text-lg italic opacity-90">Kelola tiket konsermu sendiri dengan sistem dashboard profesional Tiketin.</p>
              <Button asChild className="bg-amber-400 border-4 border-slate-900 text-slate-900 px-12 py-8 font-black uppercase text-sm shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:bg-white transition-all -skew-x-6 h-auto">
                <Link href="/dashboard/upgrade-eo">DAFTAR EO SEKARANG</Link>
              </Button>
            </div>
            <PlusCircle size={250} className="absolute right-[-50px] bottom-[-50px] text-white/10 rotate-12" strokeWidth={4} />
          </section>
        )}
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-[#6D4AFF] text-white pt-24 pb-12 px-6 sm:px-12 border-t-8 border-slate-900 text-left">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
            <div className="space-y-8 text-left">
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 bg-amber-400 border-4 border-white -rotate-12 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]"><Zap size={28} strokeWidth={3} className="text-slate-900" /></div>
                <span className="text-3xl font-black italic -skew-x-12 tracking-tighter uppercase">TIKETIN</span>
              </div>
              <p className="text-purple-100 text-sm font-bold italic uppercase">Platform war tiket konser paling gila di Indonesia.</p>
            </div>
            <div className="space-y-6">
              <h4 className="font-black uppercase tracking-widest text-[10px] text-amber-300 italic underline underline-offset-8 text-left">Explore</h4>
              <ul className="space-y-3 text-purple-50 text-sm font-bold italic uppercase text-left">
                <li className="hover:text-amber-300 cursor-pointer">Trending Now</li>
                <li className="hover:text-amber-300 cursor-pointer">Featured Festivals</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-black uppercase tracking-widest text-[10px] text-amber-300 italic underline underline-offset-8 text-left">Support</h4>
              <ul className="space-y-4 text-purple-50 text-sm font-bold text-left uppercase">
                <li onClick={() => router.push('explore/complaints')} className="flex items-center gap-3 italic hover:text-amber-300 cursor-pointer"><MessageSquare size={16} /> PUSAT PENGADUAN</li>
                <li className="flex items-center gap-3 italic"><Mail size={16} /> HELLO@TIKETIN.COM</li>
                <li className="flex items-center gap-3 italic"><Phone size={16} /> +62 812 3456 789</li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t-2 border-white/20 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-200">© 2026 TIKETIN. ALL STAGES PROTECTED.</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300 italic -skew-x-12">BUILT BY IKMAN @ UPI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}