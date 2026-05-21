"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Check, X, Eye, Loader2, Calendar, MapPin, Zap, 
  AlertCircle, X as CloseIcon, Ticket, Clock, 
  ShieldAlert, Trash2, Tag, ListFilter, User, 
  CheckCircle2
} from "lucide-react";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function VerifyEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  
  // State buat Modal Detail Event
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openDetail = (event: any) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // ⚡ PROTEKSI HALAMAN: Hanya Admin yang boleh masuk
  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      alert("🛑 AREA TERLARANG! Lo bukan admin, Man.");
      router.push("/explore");
      return;
    }

    fetchEvents();
  };

  const fetchEvents = async () => {
    setLoading(true);
    // JOIN query ke ticket_categories dan profiles (EO)
    const { data, error } = await supabase
      .from("events")
      .select(`
        *, 
        ticket_categories(*),
        profiles:user_id(full_name)
      `)
      .order("created_at", { ascending: false });

    if (data) setEvents(data);
    setLoading(false);
  };

  const handleStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from("events")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      alert(`Event berhasil di-${newStatus.toUpperCase()}!`);
      fetchEvents();
      if (isDetailOpen) setIsDetailOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin mau hapus event rejected ini permanen?")) {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (!error) {
        alert("Event dibersihkan!");
        fetchEvents();
      }
    }
  };

  // ⚡ LOGIC FILTERING FRONTEND
  const filteredEvents = events.filter(ev => filter === 'all' || ev.status === filter);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka || 0);
  };

  return (
    <div className={`space-y-12 ${poppins.className} text-black text-left pb-20`}>
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-8 border-black pb-10">
        <div className="space-y-4">
          <div className="bg-[#6D4AFF] text-white border-4 border-black px-4 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <ShieldAlert size={14} strokeWidth={3} /> Admin Authorization Required
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
            Validator <span className="text-[#6D4AFF]">Stages.</span>
          </h1>
          <p className="text-lg font-bold text-slate-500 italic max-w-xl uppercase">
            Kurasi panggung terbaik sebelum live ke publik.
          </p>
        </div>

        {/* STATS RINGKAS */}
        <div className="flex gap-4">
            <div className="bg-amber-400 border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                <p className="text-[10px] font-black uppercase">Pending</p>
                <p className="text-2xl font-black italic">{events.filter(e => e.status === 'pending').length}</p>
            </div>
            <div className="bg-emerald-400 border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                <p className="text-[10px] font-black uppercase">Live</p>
                <p className="text-2xl font-black italic">{events.filter(e => e.status === 'approved').length}</p>
            </div>
        </div>
      </header>

      {/* FILTER BAR BRUTAL */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="bg-black text-white p-4 flex items-center gap-2 border-4 border-black">
            <ListFilter size={20} />
            <span className="font-black italic uppercase text-xs">Filter Status:</span>
        </div>
        {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-6 py-4 border-4 border-black font-black uppercase italic text-xs transition-all shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none ${
              filter === s ? "bg-amber-400 translate-x-1 translate-y-1 shadow-none" : "bg-white hover:bg-slate-100"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white border-8 border-black shadow-[15px_15px_0px_0px_rgba(109,74,255,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="p-6 border-r border-white/20">Stage & Organizer</th>
                <th className="p-6 border-r border-white/20 text-center">Current Status</th>
                <th className="p-6 text-center">Action Center</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-black">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-24 text-center font-black italic text-2xl uppercase tracking-widest text-[#6D4AFF]">
                    <Loader2 className="animate-spin mx-auto mb-4" size={48} strokeWidth={4} />
                    Syncing Data...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-24 text-center font-black italic text-slate-300 text-xl uppercase">
                    Antrean Kosong, Man! 🛋️
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 border-r-4 border-black">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden shrink-0">
                          <img src={event.image_url} alt="Poster" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="bg-amber-400 border-2 border-black px-2 py-0.5 text-[8px] font-black uppercase italic shadow-[2px_2px_0_0_#000]">
                               EO: {event.profiles?.full_name || "UNKNOWN"}
                             </span>
                          </div>
                          <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-tight mb-2 underline decoration-4 decoration-[#6D4AFF] underline-offset-4">
                            {event.title}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase italic text-slate-400">
                            <span className="flex items-center gap-1.5"><Calendar size={12} strokeWidth={3} /> {event.date}</span>
                            <span className="flex items-center gap-1.5"><MapPin size={12} strokeWidth={3} /> {event.location}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-6 border-r-4 border-black text-center">
                      <div className={`inline-block px-4 py-2 border-4 border-black font-black uppercase italic text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                        event.status === 'approved' ? 'bg-emerald-400 text-black' : 
                        event.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-400'
                      }`}>
                        {event.status || 'PENDING'}
                      </div>
                    </td>

                    <td className="p-6">
                      <div className="flex items-center justify-center gap-4">
                        <button onClick={() => handleStatus(event.id, 'approved')} className="bg-white border-4 border-black p-3 shadow-[4px_4px_0_0_#10B981] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all text-emerald-600"><Check size={24} strokeWidth={4} /></button>
                        <button onClick={() => handleStatus(event.id, 'rejected')} className="bg-white border-4 border-black p-3 shadow-[4px_4px_0_0_#EF4444] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all text-red-600"><X size={24} strokeWidth={4} /></button>
                        <button onClick={() => openDetail(event)} className="bg-[#6D4AFF] border-4 border-black p-3 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all text-white"><Eye size={24} strokeWidth={3} /></button>
                        {event.status === 'rejected' && (
                          <button onClick={() => handleDelete(event.id)} className="bg-black border-4 border-black p-3 shadow-[4px_4px_0_0_#EF4444] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all text-red-500"><Trash2 size={24} strokeWidth={3} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="flex items-center justify-center gap-4 text-slate-300 pt-10">
         <ShieldAlert size={16} />
         <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Tiketin Admin Security Protocol // v2.0</span>
      </div>

      {/* MODAL PREVIEW EVENT BRUTAL */}
      {isDetailOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white border-8 border-black p-8 md:p-12 w-full max-w-5xl shadow-[25px_25px_0px_0px_rgba(109,74,255,1)] relative my-8">
            <button onClick={() => setIsDetailOpen(false)} className="absolute top-6 right-6 p-2 border-4 border-black bg-white hover:bg-red-500 transition-colors z-[110]">
              <CloseIcon size={28} strokeWidth={4} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-12 text-left">
              {/* KOLOM KIRI */}
              <div className="space-y-6">
                <div className="w-full aspect-[3/4] bg-slate-100 border-8 border-black shadow-[10px_10px_0px_0px_#000] overflow-hidden relative">
                  <img src={selectedEvent.image_url} alt="Poster" className="w-full h-full object-cover" />
                </div>
                <div className="bg-amber-400 border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000]">
                  <p className="text-[10px] font-black uppercase mb-1">Base Price</p>
                  <p className="text-4xl font-black italic">{formatRupiah(selectedEvent.price)}</p>
                </div>
              </div>

              {/* KOLOM KANAN */}
              <div className="space-y-8">
                <header className="border-b-8 border-black pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-black text-white px-3 py-1 font-black text-xs italic uppercase">By: {selectedEvent.profiles?.full_name}</div>
                    <div className={`px-3 py-1 font-black text-xs italic uppercase border-2 border-black ${selectedEvent.status === 'approved' ? 'bg-emerald-400' : 'bg-amber-400'}`}>{selectedEvent.status}</div>
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">{selectedEvent.title}</h2>
                </header>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 border-4 border-black p-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Stage Location</label>
                    <p className="font-black italic flex items-center gap-2"><MapPin size={18} className="text-[#6D4AFF]"/> {selectedEvent.location}</p>
                  </div>
                  <div className="bg-slate-50 border-4 border-black p-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Event Date</label>
                    <p className="font-black italic flex items-center gap-2"><Calendar size={18} className="text-red-500"/> {selectedEvent.date}</p>
                  </div>
                </div>

                <div className="bg-white border-4 border-black p-6 font-bold italic text-slate-700 leading-relaxed shadow-[6px_6px_0px_0px_#000]">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2 italic">Official Description</p>
                  {selectedEvent.description}
                </div>

                {/* TICKET TIERS */}
                <div className="pt-6 border-t-8 border-black">
                    <h4 className="font-black italic uppercase text-lg mb-4 flex items-center gap-2"><Tag size={20}/> Ticket Tiers Listing</h4>
                    <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                        {selectedEvent.ticket_categories?.map((cat: any) => (
                            <div key={cat.id} className="bg-white border-4 border-black p-4 flex justify-between items-center shadow-[4px_4px_0_0_#6D4AFF]">
                                <div>
                                    <p className="font-black italic uppercase text-sm">{cat.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Stock: {cat.stock} Tickets</p>
                                </div>
                                <p className="text-xl font-black italic text-[#6D4AFF]">{formatRupiah(cat.price)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ACTION BUTTONS IN MODAL */}
                <div className="flex gap-4 pt-6">
                    <button onClick={() => handleStatus(selectedEvent.id, 'approved')} className="flex-1 py-5 bg-emerald-400 border-4 border-black font-black uppercase italic shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">APPROVE STAGE</button>
                    <button onClick={() => handleStatus(selectedEvent.id, 'rejected')} className="flex-1 py-5 bg-red-500 text-white border-4 border-black font-black uppercase italic shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">REJECT STAGE</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}