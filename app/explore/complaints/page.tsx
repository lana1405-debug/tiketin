"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { 
  MessageSquare, Send, Loader2, Clock, 
  CheckCircle, LifeBuoy, Zap, ArrowLeft, Ticket, CreditCard, UserCog, AlertCircle
} from "lucide-react";
import Link from "next/link";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700", "900"] });

// --- DEFINISI KATEGORI (PASTIIN INI ADA DI ATAS) ---
const CATEGORIES = [
  { id: "PEMBAYARAN", icon: CreditCard },
  { id: "TIKET", icon: Ticket },
  { id: "AKUN", icon: UserCog },
  { id: "LAINNYA", icon: AlertCircle },
];

export default function CustomerComplaintsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // State Form Baru
  const [category, setCategory] = useState("PEMBAYARAN");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  // State Chat (Multi-Reply)
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    setMounted(true);
    checkUserAndFetch();
  }, []);

  // --- LOGIKA REALTIME ---
  useEffect(() => {
    if (!selectedTicket) return;

    const channel = supabase
      .channel(`chat:${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaint_messages',
          filter: `complaint_id=eq.${selectedTicket.id}`,
        },
        (payload) => {
          setChatMessages((prev) => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints',
          filter: `id=eq.${selectedTicket.id}`,
        },
        (payload) => {
          setSelectedTicket(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket]);

  const checkUserAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUserId(session.user.id);
    fetchMyComplaints(session.user.id);
  };

  const fetchMyComplaints = async (uid: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (data) setMyComplaints(data);
    setIsLoading(false);
  };

  const fetchChatHistory = async (complaintId: number) => {
    const { data } = await supabase
      .from("complaint_messages")
      .select("*")
      .eq("complaint_id", complaintId)
      .order("created_at", { ascending: true });
    if (data) setChatMessages(data);
  };

  const handleSelectTicket = (complaint: any) => {
    setSelectedTicket(complaint);
    fetchChatHistory(complaint.id);
  };

  const handleSubmitNewReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title || !message) return alert("Isi yang lengkap Man!");
    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("complaints")
      .insert([{ user_id: userId, category, title, message, status: "open" }])
      .select()
      .single();

    if (!error && data) {
      await supabase.from("complaint_messages").insert([
        { complaint_id: data.id, sender_id: userId, message: message, is_admin: false }
      ]);
      
      setTitle(""); setMessage("");
      fetchMyComplaints(userId);
      alert("Aduan terkirim!");
    }
    setIsSubmitting(false);
  };

  const handleSendReply = async () => {
    if (!replyText || !selectedTicket || !userId) return;
    const { error } = await supabase.from("complaint_messages").insert([{ complaint_id: selectedTicket.id, sender_id: userId, message: replyText, is_admin: false }]);
    if (!error) setReplyText("");
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen bg-[#FCFAF1] text-black ${poppins.className}`}>
      {/* NAVBAR */}
      <nav className="w-full bg-white border-b-8 border-black p-6 sticky top-0 z-[50]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/explore" className="bg-black text-white border-4 border-black p-3 shadow-[4px_4px_0_0_rgba(109,74,255,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 font-black italic uppercase text-xs">
            <ArrowLeft size={16} strokeWidth={3} /> Kembali
          </Link>
          <span className="text-2xl font-black italic -skew-x-12 tracking-tighter uppercase">Support Center</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
        
        {/* KIRI: FORM & LIST TIKET */}
        <div className="lg:col-span-4 space-y-10">
          <section className="bg-white border-8 border-black p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <h2 className="text-xl font-black italic uppercase mb-4 border-b-4 border-black pb-2 text-left">Lapor Masalah</h2>
            <form onSubmit={handleSubmitNewReport} className="space-y-4">
              
              {/* --- BAGIAN KATEGORI YANG TADI ILANG --- */}
              {/* --- BAGIAN KATEGORI (UKURAN BRUTAL) --- */}
<div className="space-y-3">
  <label className="text-xs font-black uppercase text-slate-400 italic block text-left">Pilih Kategori</label>
  <div className="grid grid-cols-2 gap-4">
    {CATEGORIES.map((cat) => {
      const Icon = cat.icon;
      const isActive = category === cat.id;
      return (
        <button
          key={cat.id}
          type="button"
          onClick={() => setCategory(cat.id)}
          className={`flex items-center justify-center gap-3 p-4 border-4 border-black transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
            isActive 
            ? 'bg-black text-white shadow-none translate-x-1 translate-y-1' 
            : 'bg-white text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]'
          }`}
        >
          <Icon size={20} strokeWidth={isActive ? 3 : 2} />
          <span className="font-black italic uppercase text-xs tracking-tighter">{cat.id}</span>
        </button>
      );
    })}
  </div>
</div>

              <input type="text" placeholder="SUBJEK..." value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border-4 border-black font-black italic outline-none text-sm shadow-[4px_4px_0_0_rgba(0,0,0,1)]" />
              <textarea placeholder="DETAIL KELUHAN..." value={message} onChange={e => setMessage(e.target.value)} className="w-full p-3 border-4 border-black font-bold italic outline-none h-24 text-sm shadow-[4px_4px_0_0_rgba(0,0,0,1)]" />
              
              <button disabled={isSubmitting} className="w-full py-3 bg-emerald-400 border-4 border-black font-black uppercase italic shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none transition-all text-sm">
                {isSubmitting ? "Kirim..." : "Kirim Aduan"}
              </button>
            </form>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-left">Riwayat Aduan</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {myComplaints.map(ticket => (
                <div 
                  key={ticket.id} 
                  onClick={() => handleSelectTicket(ticket)}
                  className={`p-4 border-4 border-black cursor-pointer transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${selectedTicket?.id === ticket.id ? 'bg-amber-300 translate-x-1 translate-y-1 shadow-none' : 'bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex justify-between items-start mb-1 text-left">
                    <span className={`text-[7px] font-black uppercase px-2 py-0.5 border-2 border-black ${ticket.status === 'resolved' ? 'bg-emerald-400' : 'bg-red-500 text-white'}`}>{ticket.status}</span>
                    <span className="text-[7px] font-black text-slate-400 italic">{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="font-black italic uppercase text-xs truncate text-left">{ticket.title}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* KANAN: CHAT INTERFACE */}
        <div className="lg:col-span-8">
          {selectedTicket ? (
            <div className="bg-white border-8 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex flex-col h-[650px]">
              <div className="p-5 border-b-8 border-black bg-slate-900 text-white flex justify-between items-center">
                <div className="text-left">
                  <h3 className="font-black italic uppercase tracking-tighter text-lg leading-tight">{selectedTicket.title}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedTicket.category}</p>
                </div>
                <div className="bg-[#6D4AFF] px-3 py-1 border-2 border-white text-[9px] font-black italic uppercase">Chat Active</div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FCFAF1] custom-scrollbar flex flex-col">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.is_admin ? 'items-start' : 'items-end'}`}>
                    <div className={`max-w-[80%] p-4 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${msg.is_admin ? 'bg-white' : 'bg-[#6D4AFF] text-white text-right'}`}>
                       <p className={`text-[8px] font-black uppercase mb-1 ${msg.is_admin ? 'text-slate-400' : 'text-purple-200'}`}>
                         {msg.is_admin ? 'Admin Tiketin' : 'Saya'}
                       </p>
                       <p className="font-bold italic text-sm text-left">{msg.message}</p>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase italic">
                      {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>

              {selectedTicket.status !== 'resolved' ? (
                <div className="p-5 border-t-8 border-black bg-white flex gap-4">
                  <input type="text" placeholder="BALAS ADMIN DI SINI..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendReply()} className="flex-1 p-4 border-4 border-black font-bold italic outline-none focus:bg-slate-50 text-sm" />
                  <button onClick={handleSendReply} className="bg-black text-white px-6 border-4 border-black shadow-[4px_4px_0_0_rgba(109,74,255,1)] hover:shadow-none transition-all">
                    <Send size={20} />
                  </button>
                </div>
              ) : (
                <div className="p-5 bg-emerald-100 text-center font-black italic uppercase border-t-8 border-black text-emerald-800 tracking-widest text-sm">Tiket Sudah Diselesaikan</div>
              )}
            </div>
          ) : (
            <div className="h-full border-8 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-300 p-10 text-center">
              <MessageSquare size={80} strokeWidth={1} />
              <p className="font-black italic uppercase mt-8 text-2xl tracking-tighter">Pilih Tiket di Kiri</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}