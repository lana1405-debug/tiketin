"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Check, X, ExternalLink, Loader2, 
  ShieldCheck, Zap, FileSearch, AlertCircle 
} from "lucide-react";
import { Poppins } from "next/font/google";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function AdminLegalPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true);
    fetchApps(); 
  }, []);

  const fetchApps = async () => {
    setLoading(true);
    try {
      // Pake !left join biar data pengajuan TETEP MUNCUL meskipun profil usernya bermasalah
      const { data, error } = await supabase
        .from("eo_applications")
        .select(`
          *,
          profiles!left (
            full_name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Supabase Error:", error);
        // Jika error RLS, biasanya data balik kosong atau error 403
      }

      console.log("Debug Admin Data:", data);
      if (data) setApps(data);
      
    } catch (err) {
      console.error("System Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, userId: string, action: 'approved' | 'rejected') => {
    const confirmMsg = action === 'approved' ? "Angkat user jadi EO?" : "Tolak pengajuan ini?";
    if (!window.confirm(confirmMsg)) return;

    try {
      // 1. Update status pengajuan
      const { error: appError } = await supabase
        .from("eo_applications")
        .update({ status: action })
        .eq("id", id);

      if (appError) throw appError;
      
      // 2. Kalau APPROVED, ubah role user di tabel profiles
      if (action === 'approved') {
        const { error: roleError } = await supabase
          .from("profiles")
          .update({ role: 'eo' })
          .eq("id", userId);
        
        if (roleError) throw roleError;
        alert("STATUS BERHASIL: USER SEKARANG ADALAH EO!");
      } else {
        alert("PENGAMBILAN KEPUTUSAN: DITOLAK.");
      }
      
      fetchApps(); // Refresh list secara otomatis
    } catch (error: any) {
      console.error("Action Error:", error);
      alert("Gagal memproses: " + error.message);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`p-6 md:p-12 space-y-12 bg-white min-h-screen text-black ${poppins.className} text-left`}>
      
      {/* HEADER BRUTAL */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-black pb-10">
        <div className="space-y-4">
          <div className="bg-[#6D4AFF] text-white border-2 border-black px-4 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <ShieldCheck size={14} strokeWidth={3} /> Admin Authorization
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
            VERIFIKASI <span className="text-[#6D4AFF]">EO.</span>
          </h1>
          <p className="text-lg font-bold text-slate-500 italic max-w-xl">
            Saring penyelenggara event. Pastikan dokumen legalitas valid sebelum di-approve Man.
          </p>
        </div>

        <div className="bg-amber-400 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -rotate-3 group hover:rotate-0 transition-transform">
          <div className="text-[10px] font-black uppercase tracking-widest text-black/60">Antrean Pending</div>
          <div className="text-5xl font-black italic">{apps.length}</div>
        </div>
      </header>

      {/* LIST CONTENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {loading ? (
          <div className="col-span-full py-20 text-center space-y-4">
            <Loader2 className="animate-spin mx-auto text-[#6D4AFF]" size={48} />
            <p className="font-black italic text-xl uppercase tracking-widest">Scanning Storage...</p>
          </div>
        ) : apps.length > 0 ? (
          apps.map((app) => (
            <div key={app.id} className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] group relative">
              <div className="absolute top-[-20px] right-6 bg-black text-white border-2 border-black px-4 py-2 font-black italic uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(109,74,255,1)]">
                Waiting Review
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 text-left">
                  <div className="bg-slate-100 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-[#6D4AFF] group-hover:text-white transition-colors">
                    <Zap size={28} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-tight underline decoration-4 decoration-amber-400 underline-offset-4">{app.company_name}</h3>
                    <p className="text-xs font-bold text-slate-400 italic mt-1 uppercase tracking-tight">
                      {app.profiles?.full_name || "Nama Tidak Terdeteksi"} — {app.profiles?.email || "Email Kosong"}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border-2 border-black p-6 flex items-center justify-between group/file hover:bg-slate-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3">
                    <FileSearch className="text-slate-400 group-hover/file:text-black transition-colors" />
                    <span className="text-[10px] font-black uppercase italic truncate max-w-[150px]">
                      {app.legal_document_url ? "Legal_Docs.pdf" : "File Missing"}
                    </span>
                  </div>
                  <a 
                    href={app.legal_document_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-black text-white p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(109,74,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                    onClick={() => handleAction(app.id, app.user_id, 'approved')} 
                    className="flex-1 bg-emerald-400 border-4 border-black py-4 font-black italic uppercase text-xs tracking-[0.2em] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={18} strokeWidth={4} /> Approve EO
                  </button>
                  <button 
                    onClick={() => handleAction(app.id, app.user_id, 'rejected')} 
                    className="flex-1 bg-white border-4 border-black py-4 font-black italic uppercase text-xs tracking-[0.2em] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 text-red-500"
                  >
                    <X size={18} strokeWidth={4} /> Reject Data
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 border-4 border-dashed border-slate-200 text-center bg-slate-50 flex flex-col items-center justify-center space-y-4">
            <AlertCircle size={48} className="text-slate-200" />
            <p className="text-2xl font-black italic text-slate-300 uppercase tracking-widest">Antrean Kosong </p>
          </div>
        )}
      </div>

      <footer className="pt-20 text-center">
        <p className="text-[10px] font-black uppercase text-slate-300 italic tracking-[0.5em]">Tiketin Security Protocol • Official Admin Interface</p>
      </footer>
    </div>
  );
}