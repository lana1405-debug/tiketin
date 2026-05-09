"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, ArrowLeft, CheckCircle, Trash2, 
  Loader2, Mail, Clock, User, AlertCircle, Search, Zap, ShieldAlert, Send
} from "lucide-react";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function AdminComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  
  const [allMessages, setAllMessages] = useState<{ [key: string]: any[] }>({});
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setMounted(true);
    fetchComplaints();
  }, []);

  // --- LOGIKA REALTIME ADMIN ---
  useEffect(() => {
    // Dengerin semua pesan baru yang masuk ke tabel complaint_messages
    const channel = supabase
      .channel('admin-global-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'complaint_messages' },
        (payload) => {
          const newMessage = payload.new;
          // Langsung update state allMessages supaya chat yang masuk nongol live di dashboard
          setAllMessages((prev) => ({
            ...prev,
            [newMessage.complaint_id]: [...(prev[newMessage.complaint_id] || []), newMessage]
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'complaints' },
        (payload) => {
          // Kalau ada status berubah (misal customer nutup tiket), update list complaints
          setComplaints((prev) => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .order("created_at", { ascending: false });
      
    if (data) {
      setComplaints(data);
      // Tarik history chat awal buat tiap tiket
      data.forEach(complaint => fetchThread(complaint.id));
    }
    setLoading(false);
  };

  const fetchThread = async (complaintId: string) => {
    const { data } = await supabase
      .from("complaint_messages")
      .select("*")
      .eq("complaint_id", complaintId)
      .order("created_at", { ascending: true });
    
    if (data) {
      setAllMessages(prev => ({ ...prev, [complaintId]: data }));
    }
  };

  const handleAdminReply = async (id: string) => {
    const text = replyInputs[id];
    if (!text) return alert("Isi pesan dulu, Man!");

    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from("complaint_messages")
      .insert([{ 
        complaint_id: id, 
        sender_id: session?.user.id, 
        message: text, 
        is_admin: true 
      }]);
    
    if (!error) {
      setReplyInputs(prev => ({ ...prev, [id]: "" }));
      // fetchThread gak perlu dipanggil lagi karena sudah di-handle Realtime .on('INSERT')
    } else {
      alert("Gagal kirim pesan: " + error.message);
    }
  };

  const markAsResolved = async (id: string) => {
    if (confirm("Tandai laporan ini sebagai SELESAI?")) {
      const { error } = await supabase.from("complaints").update({ status: "resolved" }).eq("id", id);
      if (!error) {
        // Status akan terupdate otomatis via realtime 'UPDATE' listener
      }
    }
  };

  const deleteComplaint = async (id: string) => {
    if (confirm("Hapus laporan ini secara permanen?")) {
      const { error } = await supabase.from("complaints").delete().eq("id", id);
      if (!error) {
        setComplaints(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  const filteredComplaints = complaints.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <main className={`min-h-screen bg-white p-6 md:p-12 ${poppins.className} text-black text-left`}>
      <div className="max-w-6xl mx-auto space-y-12 text-left">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-8 border-black pb-10">
          <div className="flex items-start gap-6">
            <button onClick={() => router.back()} className="p-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              <ArrowLeft size={24} strokeWidth={3} />
            </button>
            <div className="text-left">
              <div className="bg-red-500 text-white border-2 border-black px-4 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                <ShieldAlert size={14} strokeWidth={3} /> Support Command Center
              </div>
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] text-left">
                Live <span className="text-red-500">Threads.</span>
              </h1>
            </div>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-black" size={20} strokeWidth={3} />
            <input 
              type="text" 
              placeholder="CARI LAPORAN..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 border-4 border-black bg-slate-50 font-black italic uppercase outline-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:bg-white transition-all text-left"
            />
          </div>
        </div>

        {/* LIST LAPORAN */}
        <div className="grid gap-16 text-left">
          {loading ? (
            <div className="py-20 text-center font-black italic text-2xl uppercase tracking-widest text-red-500">
              <Loader2 className="animate-spin mx-auto mb-4" size={48} strokeWidth={3} />
              Loading Conversations...
            </div>
          ) : filteredComplaints.map((item) => (
            <div key={item.id} className="bg-white border-8 border-black p-0 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className={`p-4 border-b-8 border-black flex justify-between items-center ${item.status === 'resolved' ? 'bg-emerald-400' : 'bg-amber-400'}`}>
                <div className="flex items-center gap-4">
                  <span className="font-black italic uppercase text-sm tracking-tighter">{item.status === 'resolved' ? '✅ Tiket Selesai' : '⏳ Live Thread'}</span>
                  <span className="text-[10px] font-bold opacity-60">ID: #{item.id}</span>
                </div>
                <div className="flex gap-2">
                  {item.status !== 'resolved' && (
                    <button onClick={() => markAsResolved(item.id)} className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase italic border-2 border-black hover:bg-white hover:text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Tutup Tiket</button>
                  )}
                  <button onClick={() => deleteComplaint(item.id)} className="bg-white text-red-500 p-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Trash2 size={16}/></button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 text-left">
                {/* INFO USER */}
                <div className="lg:col-span-4 p-8 border-b-8 lg:border-b-0 lg:border-r-8 border-black bg-slate-50 space-y-6 text-left">
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-left">{item.title}</h3>
                  <div className="space-y-2 text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase italic">Pelapor:</p>
                    <div className="flex items-center gap-3">
                      <div className="bg-[#6D4AFF] p-2 border-2 border-black text-white"><User size={18} /></div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase italic leading-none">{item.profiles?.full_name}</p>
                        <p className="text-[9px] font-bold text-[#6D4AFF] underline">{item.profiles?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border-4 border-black p-4 text-[11px] font-bold italic text-slate-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left">
                    Original Message: <br/> "{item.message}"
                  </div>
                </div>

                {/* CHAT AREA */}
                <div className="lg:col-span-8 flex flex-col h-[500px] bg-[#FCFAF1] text-left">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {allMessages[item.id]?.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.is_admin ? 'items-end' : 'items-start'}`}>
                        <div className={`p-4 border-4 border-black max-w-[85%] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${msg.is_admin ? 'bg-[#6D4AFF] text-white' : 'bg-white'}`}>
                          <p className={`text-[8px] font-black uppercase mb-1 ${msg.is_admin ? 'text-purple-200' : 'text-slate-400'}`}>{msg.is_admin ? 'Admin Tiketin' : item.profiles?.full_name?.split(' ')[0]}</p>
                          <p className="text-sm font-bold italic text-left">{msg.message}</p>
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase italic">{new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>

                  {item.status !== 'resolved' ? (
                    <div className="p-6 border-t-8 border-black bg-white flex gap-4">
                      <input 
                        type="text" 
                        placeholder="BALAS USER DI SINI..."
                        className="flex-1 p-4 border-4 border-black font-black italic uppercase text-xs outline-none focus:bg-slate-50 text-left"
                        value={replyInputs[item.id] || ""}
                        onChange={(e) => setReplyInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdminReply(item.id)}
                      />
                      <button onClick={() => handleAdminReply(item.id)} className="bg-black text-white px-6 border-4 border-black shadow-[4px_4px_0_0_rgba(109,74,255,1)] hover:shadow-none transition-all">
                        <Send size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-100 text-center font-black italic uppercase text-[10px] border-t-8 border-black tracking-widest text-emerald-800">Tiket Selesai Diatasi</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="bg-black text-white p-6 border-4 border-black flex items-center justify-center gap-4 italic font-black uppercase text-[10px] tracking-widest rotate-1">
          <AlertCircle size={20} className="text-amber-400" />
          Sistem Realtime Monitoring Aktif. Balesan masuk otomatis.
        </div>
      </div>
    </main>
  );
}