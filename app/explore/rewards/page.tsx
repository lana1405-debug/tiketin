"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Gift, Trophy, Loader2 } from "lucide-react";

export default function RewardsPage() {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPoints = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from("profiles").select("points").eq("id", session.user.id).single();
        setPoints(data?.points || 0);
      }
      setLoading(false);
    };
    getPoints();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FCFAF1]"><Loader2 className="animate-spin" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#FCFAF1] p-8 md:p-12 font-black italic uppercase italic">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* HEADER */}
        <h1 className="text-7xl -skew-x-6 tracking-tighter leading-none text-slate-900">
          TIKETIN <span className="text-[#6D4AFF]">REWARDS.</span>
        </h1>

        {/* POIN CARD */}
        <div className="bg-[#6D4AFF] border-8 border-black p-10 shadow-[15px_15px_0px_0px_#000] flex justify-between items-center overflow-hidden relative">
          <Zap className="absolute -left-10 -bottom-10 text-white/10" size={250} />
          <div className="relative z-10">
            <p className="text-white text-xl mb-2">POIN AKTIF LO:</p>
            <p className="text-9xl text-white drop-shadow-[6px_6px_0px_#000]">{points.toLocaleString()}</p>
          </div>
          <div className="relative z-10 bg-amber-400 border-4 border-black p-4 rotate-12 shadow-[8px_8px_0px_0px_#000]">
            <Trophy size={60} strokeWidth={3} />
          </div>
        </div>

        {/* KATALOG */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: "DISKON RP 50.000", cost: 500, color: "bg-emerald-400" },
            { name: "FREE MERCHANDISE", cost: 1500, color: "bg-pink-400" }
          ].map((item, i) => (
            <div key={i} className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] flex justify-between items-center group">
              <div>
                <p className="text-2xl leading-none mb-1">{item.name}</p>
                <p className="text-sm text-slate-400">{item.cost} POIN</p>
              </div>
              <button 
                disabled={points < item.cost}
                className={`${item.color} border-2 border-black px-4 py-2 text-xs shadow-[4px_4px_0_0_#000] disabled:opacity-50 disabled:grayscale transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none`}
              >
                {points >= item.cost ? "TUKER SEKARANG" : "POIN KURANG"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}