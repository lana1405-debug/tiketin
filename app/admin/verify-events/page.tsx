"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Check, X, Eye, Loader2, Calendar, MapPin, Zap, AlertCircle, X as CloseIcon, Ticket, Clock, ShieldAlert, Trash2, Tag } from "lucide-react";
import { Poppins } from "next/font/google";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function VerifyEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State buat Modal Detail Event
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const fetchPendingEvents = async () => {
    setLoading(true);
    // JOIN query ke ticket_categories biar kategori tiket ikut ketarik
    const { data, error } = await supabase
      .from("events")
      .select("*, ticket_categories(*)")
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
      alert(`Event berhasil di-${newStatus}!`);
      fetchPendingEvents();
    }
  };

  // Fungsi buat Hapus Event yang di-Reject
  const handleDelete = async (id: string) => {
    if (confirm("Yakin mau hapus event rejected ini permanen, Man? Gak bisa dibatalin!")) {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (!error) {
        alert("Event berhasil dihapus dan dibersihkan dari antrean!");
        fetchPendingEvents();
      } else {
        alert("Gagal hapus event: " + error.message);
      }
    }
  };

  const openDetail = (event: any) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka || 0);
  };

  return (
    <div className={`space-y-12 ${poppins.className} text-black text-left`}>
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-black pb-10">
        <div className="space-y-4">
          <div className="bg-amber-400 text-black border-2 border-black px-4 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Zap size={14} strokeWidth={3} /> Quality Control
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
            Verifikasi <span className="text-[#6D4AFF]">Event.</span>
          </h1>
          <p className="text-lg font-bold text-slate-500 italic max-w-xl">
            Tinjau panggung baru dari EO. Pastikan semuanya layak tayang, 
          </p>
        </div>
      </header>

      {/* TABLE SECTION BRUTAL */}
      <div className="bg-white border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="p-6 border-r border-white/20">Informasi Konser</th>
                <th className="p-6 border-r border-white/20 text-center">Status</th>
                <th className="p-6 text-center">Keputusan Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-black">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-24 text-center font-black italic text-2xl uppercase tracking-widest text-[#6D4AFF]">
                    <Loader2 className="animate-spin mx-auto mb-4" size={48} strokeWidth={4} />
                    Scanning Stages...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-24 text-center font-black italic text-slate-300 text-xl uppercase">
                    Belum ada kiriman event.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 border-r-4 border-black">
                      <div className="flex items-center gap-6 text-left">
                        <div className="w-20 h-20 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden shrink-0">
                          {event.image_url ? (
                            <img src={event.image_url} alt="Poster" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                              <Calendar size={32} />
                            </div>
                          )}
                        </div>
                        <div>
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
                      <div className={`inline-block px-4 py-2 border-2 border-black font-black uppercase italic text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                        event.status === 'approved' ? 'bg-emerald-400' : 
                        event.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-400'
                      }`}>
                        {event.status || 'UNSET'}
                      </div>
                    </td>

                    <td className="p-6">
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => handleStatus(event.id, 'approved')}
                          title="Approve Event"
                          className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(16,185,129,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-emerald-600"
                        >
                          <Check size={20} strokeWidth={4} />
                        </button>
                        <button 
                          onClick={() => handleStatus(event.id, 'rejected')}
                          title="Reject Event"
                          className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(239,68,68,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-red-600"
                        >
                          <X size={20} strokeWidth={4} />
                        </button>
                        
                        <button 
                          onClick={() => openDetail(event)}
                          title="Lihat Detail"
                          className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                        >
                          <Eye size={20} strokeWidth={3} />
                        </button>

                        {/* TOMBOL DELETE: CUMA MUNCUL KALO STATUS REJECTED */}
                        {event.status === 'rejected' && (
                          <button 
                            onClick={() => handleDelete(event.id)}
                            title="Hapus Permanen"
                            className="bg-black border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(239,68,68,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-red-500"
                          >
                            <Trash2 size={20} strokeWidth={3} />
                          </button>
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
         <AlertCircle size={16} />
         <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Tiketin Validator Engine // 2026</span>
      </div>

      {/* MODAL PREVIEW EVENT BRUTAL */}
      {isDetailOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white border-8 border-black p-8 md:p-12 w-full max-w-4xl shadow-[20px_20px_0px_0px_rgba(251,191,36,1)] relative my-8">
            <button onClick={() => setIsDetailOpen(false)} className="absolute top-6 right-6 p-2 border-4 border-black bg-white hover:bg-red-500 transition-colors">
              <CloseIcon size={28} strokeWidth={4} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-10 text-left">
              {/* KOLOM KIRI (POSTER & HARGA TERMURAH) */}
              <div className="space-y-6">
                <div className="w-full aspect-[3/4] bg-slate-100 border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative">
                  <div className="absolute top-2 left-2 bg-amber-400 px-3 py-1 font-black text-[10px] uppercase italic border-2 border-black z-10">Preview</div>
                  {selectedEvent.image_url ? (
                    <img src={selectedEvent.image_url} alt="Poster" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <Calendar size={48} />
                      <span className="text-xs font-black uppercase mt-2">No Image</span>
                    </div>
                  )}
                </div>

                <div className="bg-black text-white p-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(109,74,255,1)]">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1 italic">Harga Termurah</p>
                  <p className="text-3xl font-black italic text-[#6D4AFF]">{formatRupiah(selectedEvent.price)}</p>
                </div>
              </div>

              {/* KOLOM KANAN (INFO DETAIL) */}
              <div className="space-y-6">
                <header className="border-b-8 border-black pb-4">
                  <h2 className="text-5xl md:text-6xl font-black italic uppercase -skew-x-6 tracking-tighter leading-none">{selectedEvent.title}</h2>
                </header>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border-4 border-black p-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Tanggal</label>
                    <p className="font-black italic flex items-center gap-2"><Calendar size={16} className="text-amber-500"/> {selectedEvent.date || '-'}</p>
                  </div>
                  <div className="bg-slate-50 border-4 border-black p-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Waktu</label>
                    <p className="font-black italic flex items-center gap-2"><Clock size={16} className="text-[#6D4AFF]"/> {selectedEvent.start_time || '-'}</p>
                  </div>
                  <div className="bg-slate-50 border-4 border-black p-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Total Stok</label>
                    <p className="font-black italic flex items-center gap-2"><Ticket size={16} className="text-emerald-500"/> {selectedEvent.stock || 0} Lembar</p>
                  </div>
                  <div className="bg-red-50 border-4 border-black p-4">
                    <label className="text-[10px] font-black uppercase text-red-400 block mb-1">Batas Beli / Akun</label>
                    <p className="font-black italic text-red-600 flex items-center gap-2"><ShieldAlert size={16} /> Maks {selectedEvent.max_buy || 0} Tiket</p>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 italic">Deskripsi Panggung</label>
                  <div className="bg-white border-4 border-black p-5 font-bold italic text-slate-700 leading-relaxed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {selectedEvent.description || 'Tidak ada deskripsi yang disediakan.'}
                  </div>
                </div>

                {/* TAMPILAN KATEGORI TIKET */}
                {selectedEvent.ticket_categories && selectedEvent.ticket_categories.length > 0 && (
                  <div className="pt-4 border-t-4 border-black">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 italic flex items-center gap-2"><Tag size={14}/> Rincian Kategori Tiket</label>
                    <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                      {selectedEvent.ticket_categories.map((cat: any, idx: number) => (
                        <div key={cat.id} className="flex justify-between items-center bg-amber-400 border-4 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                          <div>
                            <span className="bg-black text-white px-2 py-1 text-[8px] font-black uppercase italic mr-2">Tier {idx + 1}</span>
                            <span className="font-black italic uppercase text-sm">{cat.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-black italic text-lg leading-none">{formatRupiah(cat.price)}</p>
                            <p className="text-[10px] font-bold text-slate-800 uppercase mt-1">Stok: {cat.stock}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
            
            <div className="mt-8 flex gap-6 border-t-8 border-black pt-6">
              <button onClick={() => setIsDetailOpen(false)} className="flex-1 py-5 bg-white border-4 border-black font-black uppercase italic text-sm hover:bg-slate-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                TUTUP PREVIEW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}