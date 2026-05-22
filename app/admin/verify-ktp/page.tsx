"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import { 
  CheckCircle, XCircle, Eye, Loader2, 
  ShieldAlert, X, IdCard, User, Mail, ShieldCheck 
} from "lucide-react";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function AdminVerifyKTPPage() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // State buat Modal Detail KTP
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchPendingKTP();
  }, []);

 const fetchPendingKTP = async () => {
  setLoading(true);
  console.log("Sedang narik data pending...");

  // Pake .ilike biar gak sensitif sama huruf gede/kecil
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("verification_status", "pending") 
    .order("verified_at", { ascending: false });

  if (error) {
    console.error("Error dari Supabase:", error.message);
  } else {
    console.log("Data yang didapet:", data); // Cek di console browser (F12)
    setPendingUsers(data || []);
  }
  setLoading(false);
};

  const handleStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    const actionText = newStatus === 'approved' ? 'TERIMA' : 'TOLAK';
    if (confirm(`Yakin mau ${actionText} verifikasi KTP user ini, Man?`)) {
      const { error } = await supabase
        .from("profiles")
        .update({ verification_status: newStatus })
        .eq("id", id);
      
      if (!error) {
        setIsDetailOpen(false); // Tutup modal kalo lagi kebuka
        fetchPendingKTP(); // Refresh data
      } else {
        alert("Gagal update status: " + error.message);
      }
    }
  };

  const openDetail = (user: any) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  if (!mounted) return null;

  return (
    <div className={`space-y-12 pb-20 ${poppins.className} text-black text-left`}>
      
      {/* HEADER BRUTAL */}
      <header className="flex flex-col md:flex-row justify-between items-start xl:items-end gap-8 border-b-8 border-black pb-10">
        <div className="space-y-4">
          <div className="bg-red-500 text-white border-2 border-black px-4 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <ShieldAlert size={14} strokeWidth={3} /> Security & KYC
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
            Verifikasi <span className="text-red-500">KTP.</span>
          </h1>
          <p className="text-lg font-bold text-slate-500 italic max-w-xl">
            Cocokin NIK sama foto KTP. Jangan sampe ada calo yang lolos, 
          </p>
        </div>

        <div className="bg-black text-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(239,68,68,1)] rotate-2">
           <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Antrean KYC</p>
           <h2 className="text-5xl font-black italic">{pendingUsers.length} User</h2>
        </div>
      </header>

      {/* TABLE SECTION BRUTAL */}
      <div className="bg-white border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="p-6 border-r border-white/20">Identitas User</th>
                <th className="p-6 border-r border-white/20">Data KTP</th>
                <th className="p-6 text-center">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-black">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-24 text-center font-black italic text-2xl uppercase tracking-widest text-red-500">
                    <Loader2 className="animate-spin mx-auto mb-4" size={48} strokeWidth={4} />
                    Scanning Berkas...
                  </td>
                </tr>
              ) : pendingUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-24 text-center font-black italic text-slate-300 text-xl uppercase">
                    Antrean Verifikasi KTP Kosong Man.
                  </td>
                </tr>
              ) : (
                pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 border-r-4 border-black">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-xl italic text-red-500 shrink-0">
                          {user.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <h3 className="text-xl font-black italic uppercase tracking-tighter leading-tight mb-1">
                            {user.full_name}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                            <Mail size={12} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-6 border-r-4 border-black">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-amber-400 border-2 border-black px-3 py-1 font-black uppercase italic text-[10px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          <IdCard size={12} strokeWidth={3} /> {user.nik || 'NIK TIDAK ADA'}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <ShieldCheck size={12} /> Menunggu Review
                        </p>
                      </div>
                    </td>

                    <td className="p-6">
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => openDetail(user)}
                          className="bg-black text-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(109,74,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                        >
                          <Eye size={20} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={() => handleStatus(user.id, 'approved')}
                          className="bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-emerald-600"
                        >
                          <CheckCircle size={20} strokeWidth={4} />
                        </button>
                        <button 
                          onClick={() => handleStatus(user.id, 'rejected')}
                          className="bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-red-600"
                        >
                          <XCircle size={20} strokeWidth={4} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PREVIEW KTP BRUTAL */}
      {isDetailOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white border-8 border-black p-8 md:p-12 w-full max-w-4xl shadow-[20px_20px_0px_0px_rgba(239,68,68,1)] relative my-8 text-left">
            <button onClick={() => setIsDetailOpen(false)} className="absolute top-6 right-6 p-2 border-4 border-black bg-white hover:bg-red-500 transition-colors z-10">
              <X size={28} strokeWidth={4} />
            </button>

            <header className="border-b-8 border-black pb-6 mb-8">
              <div className="bg-black text-white px-4 py-1 inline-flex items-center gap-2 border-2 border-black font-black italic uppercase text-[10px] mb-4">
                <IdCard size={14} /> Dokumen Identitas
              </div>
              <h2 className="text-4xl md:text-5xl font-black italic uppercase -skew-x-6 tracking-tighter leading-none">
                KYC: {selectedUser.full_name}
              </h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-[1.5fr,1fr] gap-10">
              
              {/* KOLOM KIRI (ZOOM FOTO KTP) */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 block italic tracking-widest">Pindaian KTP Asli</label>
                <div className="w-full aspect-[16/10] bg-slate-100 border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative group">
                  {selectedUser.ktp_url ? (
                    <img 
                      src={selectedUser.ktp_url} 
                      alt="KTP" 
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 cursor-crosshair" 
                      title="Hover buat Zoom"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <IdCard size={64} />
                      <span className="text-xs font-black uppercase mt-4">Foto KTP Hilang</span>
                    </div>
                  )}
                </div>
              </div>

              {/* KOLOM KANAN (INFO DETAIL & ACTION) */}
              <div className="space-y-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="bg-slate-50 border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nomor Induk Kependudukan</label>
                    <p className="text-3xl font-black italic text-red-500 tracking-tighter">{selectedUser.nik || 'KOSONG'}</p>
                  </div>
                  
                  <div className="bg-slate-50 border-4 border-black p-5">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nama Akun (Sesuai Register)</label>
                    <p className="text-xl font-black italic uppercase">{selectedUser.full_name}</p>
                  </div>

                  <div className="bg-slate-50 border-4 border-black p-5">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Email</label>
                    <p className="font-bold text-sm text-slate-700">{selectedUser.email}</p>
                  </div>
                </div>

                {/* TOMBOL ACTION RAKSASA */}
                <div className="flex gap-4 pt-6 border-t-8 border-black">
                  <button 
                    onClick={() => handleStatus(selectedUser.id, 'approved')}
                    className="flex-1 py-4 bg-emerald-400 text-black border-4 border-black font-black uppercase italic text-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} strokeWidth={3} /> APPROVE
                  </button>
                  <button 
                    onClick={() => handleStatus(selectedUser.id, 'rejected')}
                    className="flex-1 py-4 bg-red-500 text-white border-4 border-black font-black uppercase italic text-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} strokeWidth={3} /> REJECT
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}