"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import { 
  ArrowLeft, CheckCircle2, Clock, 
  CreditCard, Loader2, Landmark, 
  Send, AlertCircle, Search
} from "lucide-react";
import { useRouter } from "next/navigation";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("withdrawals")
      .select(`*, profiles:organizer_id(full_name), events:event_id(title)`)
      .order("created_at", { ascending: false });

    if (!error) setRequests(data || []);
    setIsLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("withdrawals")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      alert(`Status berhasil diupdate ke: ${newStatus}`);
      fetchWithdrawals();
    }
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  if (!mounted) return null;

  return (
    <main className={`min-h-screen bg-white p-6 md:p-12 ${poppins.className} text-black text-left`}>
      <div className="max-w-7xl mx-auto space-y-10">
        
        <div className="flex flex-col md:flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-black pb-8">
          <div className="flex items-start gap-4">
            <button onClick={() => router.back()} className="p-3 bg-white border-4 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              <ArrowLeft size={20} strokeWidth={3} />
            </button>
            <div>
              <div className="bg-emerald-400 text-black border-2 border-black px-3 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 mb-2">
                <Landmark size={14} /> Treasury Room
              </div>
              <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">Withdrawal <span className="text-[#6D4AFF]">Center.</span></h1>
            </div>
          </div>
        </div>

        <div className="bg-white border-8 border-black shadow-[12px_12px_0_0_#000] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-4 border-black text-left text-[10px] font-black uppercase tracking-widest">
                  <th className="p-6 border-r-4 border-black">Organizer & Event</th>
                  <th className="p-6 border-r-4 border-black">Detail Rekening</th>
                  <th className="p-6 border-r-4 border-black text-center">Net Amount</th>
                  <th className="p-6 text-center">Action Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-black">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-20 text-center font-black italic text-xl animate-pulse">FETCHING LEDGER...</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan={4} className="p-20 text-center font-black text-slate-300 uppercase">Belum ada pengajuan dana.</td></tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6 border-r-4 border-black text-left">
                        <span className="font-black text-lg italic uppercase block">{req.profiles?.full_name}</span>
                        <span className="text-[10px] font-bold text-[#6D4AFF] uppercase">Event: {req.events?.title}</span>
                      </td>
                      <td className="p-6 border-r-4 border-black text-left">
                        <div className="bg-black text-white p-3 border-2 border-black shadow-[3px_3px_0_0_#6D4AFF] inline-block w-full">
                           <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">{req.bank_name}</p>
                           <p className="text-sm font-black italic tracking-widest">{req.account_number}</p>
                           <p className="text-[9px] font-bold uppercase text-slate-400">a.n {req.account_name}</p>
                        </div>
                      </td>
                      <td className="p-6 border-r-4 border-black text-center font-black text-xl italic text-emerald-600">
                        {formatRupiah(req.net_amount)}
                        <p className="text-[8px] text-slate-400 uppercase tracking-tighter mt-1">Platform Fee 15% Deducted</p>
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex flex-col gap-2">
                           {req.status === 'pending' && (
                             <button onClick={() => updateStatus(req.id, 'processing')} className="bg-amber-400 border-2 border-black p-2 font-black italic uppercase text-[10px] shadow-[3px_3px_0_0_#000] hover:shadow-none transition-all flex items-center justify-center gap-2">
                               <Clock size={14} /> Mark as Processing
                             </button>
                           )}
                           {req.status === 'processing' && (
                             <button onClick={() => updateStatus(req.id, 'completed')} className="bg-[#6D4AFF] text-white border-2 border-black p-2 font-black italic uppercase text-[10px] shadow-[3px_3px_0_0_#000] hover:shadow-none transition-all flex items-center justify-center gap-2">
                               <Send size={14} /> Send & Finish
                             </button>
                           )}
                           {req.status === 'completed' && (
                             <div className="bg-emerald-100 text-emerald-600 border-2 border-emerald-600 p-2 font-black italic uppercase text-[10px] flex items-center justify-center gap-2">
                               <CheckCircle2 size={14} /> Dana Terkirim
                             </div>
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
      </div>
    </main>
  );
}