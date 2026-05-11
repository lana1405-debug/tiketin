"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";
import { 
  BarChart3, ArrowLeft, Loader2, 
  Users, Ticket as TicketIcon, 
  DollarSign, Star, Search, ShieldCheck
} from "lucide-react";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function EventAnalyticsPage() {
  const router = useRouter();
  const [eventStats, setEventStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
    fetchEventAnalytics();
  }, []);

  const fetchEventAnalytics = async () => {
    setIsLoading(true);
    
    // Tarik data Event, Nama EO (dari profile creator), dan semua transaksi terkait
    const { data, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        profiles:organizer_id (full_name),
        transaksi (total_bayar, status_pembayaran)
      `);

    if (error) {
      console.error("🚨 ERROR ANALYTICS:", error);
    } else if (data) {
      // Olah data biar siap tampil
      const formattedData = data.map((event: any) => {
        const paidTransactions = event.transaksi?.filter((t: any) => t.status_pembayaran === 'paid') || [];
        const totalRevenue = paidTransactions.reduce((acc: number, curr: any) => acc + (curr.total_bayar || 0), 0);
        const ticketsSold = paidTransactions.length;

        return {
          id: event.id,
          title: event.title,
          eo_name: event.profiles?.full_name || "Unknown EO",
          ticketsSold,
          totalRevenue
        };
      });

      setEventStats(formattedData);
    }
    
    setIsLoading(false);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { 
      style: "currency", 
      currency: "IDR", 
      maximumFractionDigits: 0 
    }).format(angka);
  };

  const filteredEvents = eventStats.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.eo_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <main className={`min-h-screen bg-[#FCFAF1] p-6 md:p-12 ${poppins.className} text-black text-left`}>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-black pb-8">
          <div className="flex items-start gap-4">
            <button 
              onClick={() => router.back()} 
              className="p-3 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <ArrowLeft size={20} strokeWidth={3} />
            </button>
            <div>
              <div className="bg-amber-400 text-black border-2 border-black px-3 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 mb-2">
                <ShieldCheck size={14} /> Admin Control Room
              </div>
              <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
                Event <span className="text-[#6D4AFF]">Insight.</span>
              </h1>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="CARI EVENT ATAU EO..."
              className="w-full pl-12 pr-4 py-4 border-4 border-black font-bold uppercase text-sm shadow-[4px_4px_0px_0px_#000] outline-none"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ANALYTICS TABLE */}
        <div className="bg-white border-8 border-black shadow-[12px_12px_0px_0px_#000] overflow-hidden">
          <div className="bg-[#6D4AFF] p-4 border-b-8 border-black flex justify-between items-center text-white">
            <span className="font-black italic uppercase tracking-widest text-sm">Performance Matrix</span>
            <BarChart3 size={24} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-4 border-black text-left text-[10px] font-black uppercase tracking-widest">
                  <th className="p-6 border-r-4 border-black">Detail Event & Organizer</th>
                  <th className="p-6 border-r-4 border-black text-center">Tiket Terjual</th>
                  <th className="p-6 text-center">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-black">
                {isLoading ? (
                  <tr><td colSpan={3} className="p-20 text-center font-black italic text-xl animate-pulse">RECALCULATING DATA...</td></tr>
                ) : filteredEvents.length === 0 ? (
                  <tr><td colSpan={3} className="p-20 text-center font-black text-slate-300 uppercase">Gak ada data yang cocok, Man.</td></tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6 border-r-4 border-black">
                        <div>
                          <span className="font-black text-xl italic uppercase block leading-none mb-1">{event.title}</span>
                          <div className="inline-flex items-center gap-1 bg-black text-white px-2 py-0.5 text-[9px] font-bold uppercase italic">
                             EO: {event.eo_name}
                          </div>
                        </div>
                      </td>
                      <td className="p-6 border-r-4 border-black text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-4xl font-black italic -skew-x-6">{event.ticketsSold}</span>
                          <span className="text-[9px] font-black uppercase text-slate-400">Sold Out</span>
                        </div>
                      </td>
                      <td className="p-6 text-center bg-emerald-50/30">
                        <span className="text-2xl font-black italic tracking-tighter text-emerald-600">
                          {formatRupiah(event.totalRevenue)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* INFO CARD BRUTAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-black text-white p-8 border-8 border-black shadow-[8px_8px_0px_0px_#6D4AFF]">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6D4AFF] mb-2">Top Performer</p>
              <h3 className="text-2xl font-black italic uppercase">
                {eventStats.length > 0 ? eventStats.sort((a,b) => b.totalRevenue - a.totalRevenue)[0].title : "-"}
              </h3>
              <p className="text-sm italic text-slate-400 mt-2">Event dengan pendapatan tertinggi saat ini.</p>
           </div>
           <div className="bg-white p-8 border-8 border-black shadow-[8px_8px_0px_0px_#FCD34D]">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Global Audience</p>
              <h3 className="text-4xl font-black italic uppercase">
                {eventStats.reduce((acc, curr) => acc + curr.ticketsSold, 0)} <span className="text-lg uppercase">Tiket</span>
              </h3>
              <p className="text-sm italic text-slate-400 mt-2">Total tiket yang sudah mendarat di tangan fans.</p>
           </div>
        </div>

      </div>
    </main>
  );
}