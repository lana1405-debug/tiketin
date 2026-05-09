"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Search, 
  Trash2, 
  Mail, 
  ShieldAlert, 
  Loader2,
  Zap,
  Filter
} from "lucide-react";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("all"); 
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUsers();
  }, [filterRole]);

  const fetchUsers = async () => {
    setLoading(true);
    
    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterRole !== "all") {
      query = query.eq("role", filterRole);
    }

    const { data, error } = await query;

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const deleteUser = async (id: string) => {
    if (confirm("Hapus akun ini secara permanen, Man? Tindakan ini gak bisa dibatalin!")) {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (!error) fetchUsers();
      else alert("Gagal hapus: " + error.message);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`space-y-12 pb-20 ${poppins.className} text-black text-left`}>
      
      {/* HEADER BRUTAL */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-black pb-10">
        <div className="space-y-4">
          <div className="bg-[#6D4AFF] text-white border-2 border-black px-4 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <ShieldAlert size={14} /> Security Level: Admin
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
            User <span className="text-[#6D4AFF]">Base.</span>
          </h1>
          <p className="text-lg font-bold text-slate-500 italic max-w-xl">
            Manajemen otorisasi akun. Hati-hati pas hapus data, Man!
          </p>
        </div>

        {/* ROLE FILTER BRUTAL */}
        <div className="flex flex-wrap bg-black p-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(109,74,255,1)]">
          {['all', 'admin', 'eo', 'customer'].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-6 py-3 font-black uppercase italic text-[10px] tracking-widest transition-all ${
                filterRole === role 
                ? "bg-[#6D4AFF] text-white" 
                : "text-slate-400 hover:text-white"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </header>

      {/* TABLE USERS BRUTAL */}
      <div className="bg-white border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="p-8 border-r border-white/20">Identitas Akun</th>
                <th className="p-8 border-r border-white/20">Otoritas / Role</th>
                <th className="p-8 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-black">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-32 text-center font-black italic text-2xl uppercase tracking-widest text-[#6D4AFF]">
                    <Loader2 className="animate-spin mx-auto mb-4" size={48} />
                    Scanning Database...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-32 text-center font-black italic text-slate-300 text-xl uppercase">
                    Data Tidak Ditemukan.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-8 border-r-4 border-black">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(109,74,255,1)] flex items-center justify-center font-black text-2xl italic text-[#6D4AFF] -rotate-3 group-hover:rotate-0 transition-transform">
                          {user.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-2">{user.full_name}</p>
                          <div className="flex items-center gap-2 text-slate-400 font-bold text-xs italic">
                            <Mail size={12} /> {user.email || "no-email@tiketin.com"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-8 border-r-4 border-black">
                      <div className={`px-6 py-2 border-4 border-black font-black uppercase italic text-[10px] tracking-[0.2em] flex items-center gap-3 w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                        user.role === 'admin' ? 'bg-[#6D4AFF] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' :
                        user.role === 'eo' ? 'bg-amber-400 text-black' : 'bg-white text-black'
                      }`}>
                        {user.role === 'admin' ? <ShieldCheck size={16} strokeWidth={3}/> : <UserCheck size={16} strokeWidth={3}/>}
                        {user.role || 'customer'}
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex justify-center gap-4">
                        <a 
                          href={`mailto:${user.email}`}
                          className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                        >
                          <Mail size={20} strokeWidth={3} />
                        </a>
                        {user.role !== 'admin' && (
                          <button 
                            onClick={() => deleteUser(user.id)}
                            className="bg-white border-2 border-black p-4 text-red-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
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

      {/* FOOTER BRUTAL */}
      <footer className="pt-10 flex items-center justify-center gap-4 text-slate-300">
         <div className="h-[2px] w-20 bg-slate-200" />
         <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Tiketin User Database // Admin Only</span>
         <div className="h-[2px] w-20 bg-slate-200" />
      </footer>
    </div>
  );
}