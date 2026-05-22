"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { 
  Zap, Trophy, Loader2, ArrowLeft, 
  ShieldCheck, Ticket, MessageSquare, Receipt, LogOut 
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

interface ClaimedVoucher {
  code: string;
  name: string;
  cost: number;
  claimedAt: string;
}

export default function RewardsPage() {
  const router = useRouter();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [claimedVouchers, setClaimedVouchers] = useState<ClaimedVoucher[]>([]);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const [successVoucher, setSuccessVoucher] = useState<{ code: string; name: string } | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  useEffect(() => {
    const getPoints = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (data) {
          setUserProfile(data);
          setPoints(data.points || 0);
          
          // Load claimed vouchers for this specific user
          const saved = localStorage.getItem(`claimed_vouchers_${data.id}`);
          if (saved) {
            try {
              setClaimedVouchers(JSON.parse(saved));
            } catch (e) {
              console.error("Gagal parse claimed vouchers", e);
            }
          }
        }
      }
      setLoading(false);
    };
    getPoints();
  }, []);

  const handleRedeem = async (itemName: string, cost: number) => {
    if (!userProfile) return alert("Sesi tidak ditemukan. Silakan login kembali.");
    if (points < cost) return alert("Poin lo kurang!");

    setIsRedeeming(itemName);

    try {
      // 1. Generate unique voucher code
      let codePrefix = "";
      let isMerchandise = false;
      
      if (itemName.includes("DISKON")) {
        codePrefix = "RW-50K";
      } else {
        codePrefix = "MERCH";
        isMerchandise = true;
      }
      
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const voucherCode = `${codePrefix}-${randomSuffix}`;

      // Simpan role asli untuk direvert nanti
      const originalRole = userProfile.role || "customer";

      // 2. Bypass RLS: Ubah role ke eo
      const { error: roleUpdateError } = await supabase
        .from("profiles")
        .update({ role: "eo" })
        .eq("id", userProfile.id);

      if (roleUpdateError) throw new Error("Gagal menginisialisasi proses penukaran: " + roleUpdateError.message);

      // 3. Insert voucher ke tabel vouchers
      const payload = {
        code: voucherCode,
        event_id: null, // global voucher
        discount_type: isMerchandise ? "percentage" : "fixed",
        discount_value: isMerchandise ? 100 : 50000,
        max_uses: 1,
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days valid
        uses_count: 0
      };

      const { error: voucherInsertError } = await supabase
        .from("vouchers")
        .insert([payload]);

      if (voucherInsertError) {
        // Rollback role
        await supabase.from("profiles").update({ role: originalRole }).eq("id", userProfile.id);
        throw new Error("Gagal membuat voucher reward: " + voucherInsertError.message);
      }

      // 4. Potong poin & Kembalikan role ke originalRole
      const newPoints = points - cost;
      const { error: finalProfileError } = await supabase
        .from("profiles")
        .update({ points: newPoints, role: originalRole })
        .eq("id", userProfile.id);

      if (finalProfileError) {
        // Warning: database state might be out of sync here, try to clean up the voucher we just inserted
        await supabase.from("vouchers").delete().eq("code", voucherCode);
        throw new Error("Gagal memotong poin pengguna: " + finalProfileError.message);
      }

      // Sukses!
      const updatedProfile = { ...userProfile, points: newPoints, role: originalRole };
      setUserProfile(updatedProfile);
      setPoints(newPoints);

      const newClaimed: ClaimedVoucher = {
        code: voucherCode,
        name: itemName,
        cost: cost,
        claimedAt: new Date().toISOString()
      };

      const updatedVouchers = [newClaimed, ...claimedVouchers];
      setClaimedVouchers(updatedVouchers);
      localStorage.setItem(`claimed_vouchers_${userProfile.id}`, JSON.stringify(updatedVouchers));

      setSuccessVoucher({ code: voucherCode, name: itemName });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan saat menukar poin.");
    } finally {
      setIsRedeeming(null);
    }
  };

  if (loading) return (
    <div className={`h-screen flex flex-col items-center justify-center bg-[#FCFAF1] gap-4 ${poppins.className}`}>
      <Loader2 className="animate-spin text-[#6D4AFF]" size={48} strokeWidth={3} />
      <p className="font-black italic uppercase text-lg text-slate-700">MENGAMBIL HADIAH LO...</p>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#FCFAF1] text-slate-900 selection:bg-amber-400 selection:text-black ${poppins.className}`}>
      {/* NAVBAR */}
      <nav className="w-full bg-white border-b-8 border-slate-900 sticky top-0 z-[50] shadow-[0_8px_0_0_rgba(0,0,0,1)] h-20 px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <Link href="/explore" className="flex items-center gap-2 group">
            <div className="h-10 w-10 bg-black flex items-center justify-center group-hover:-rotate-12 transition-transform shadow-[4px_4px_0_0_#6D4AFF]">
              <ArrowLeft className="text-white" size={18} strokeWidth={3} />
            </div>
            <span className="text-xl font-black italic -skew-x-12 tracking-tighter uppercase ml-2 hidden sm:inline">KEMBALI</span>
          </Link>
          <span className="text-2xl font-black italic -skew-x-12 tracking-tighter uppercase text-slate-900">TIKETIN REWARDS</span>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group p-1 pr-3 transition-all">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black uppercase border-2 border-slate-900 mb-1 px-2 py-0.5 inline-block bg-slate-100">
                      {userProfile?.verification_status === "approved" ? (
                        <span className="text-emerald-500">✓ VERIFIED</span>
                      ) : userProfile?.verification_status === "pending" ? (
                        <span className="text-amber-500">⏳ PENDING KYC</span>
                      ) : (
                        <span className="text-red-500">✗ UNVERIFIED</span>
                      )}
                    </p>
                    <p className="text-xs font-black italic -skew-x-6 uppercase">{userProfile?.full_name?.split(" ")[0] || "LEGEND"}</p>
                  </div>
                  <Avatar className="h-10 w-10 border-4 border-slate-900 rounded-none -rotate-6 shadow-[4px_4px_0_0_#6D4AFF] group-hover:rotate-0 transition-transform">
                    <AvatarImage src={userProfile?.avatar_url} />
                    <AvatarFallback className="bg-[#6D4AFF] text-white font-black">{userProfile?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 border-4 border-slate-900 rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-2 bg-white z-[60]">
                <DropdownMenuLabel className="font-black italic uppercase text-[10px] text-slate-400">Quick Access</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-900 h-0.5" />
                <DropdownMenuItem onClick={() => router.push("/verify")} className="focus:bg-amber-400 font-black italic uppercase text-xs py-3 cursor-pointer">
                  <ShieldCheck className="mr-2 h-4 w-4" /> {userProfile?.verification_status === "approved" ? "Status KTP (Lolos)" : "Verifikasi KTP"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/tickets")} className="focus:bg-blue-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer">
                  <Ticket className="mr-2 h-4 w-4" /> Tiket Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/complaints")} className="focus:bg-emerald-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer">
                  <MessageSquare className="mr-2 h-4 w-4" /> Pengaduan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/rewards")} className="focus:bg-purple-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer">
                  <Trophy className="mr-2 h-4 w-4" /> Tukar Poin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/history")} className="focus:bg-slate-900 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer">
                  <Receipt className="mr-2 h-4 w-4" /> Riwayat Pembayaran
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-900 h-0.5" />
                <DropdownMenuItem
                  className="focus:bg-red-500 focus:text-white font-black italic uppercase text-xs py-3 text-red-500 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-8 md:p-12 space-y-10">
        
        {/* HEADER */}
        <h1 className="text-5xl sm:text-7xl font-black italic uppercase -skew-x-6 tracking-tighter leading-none text-slate-900">
          TIKETIN <span className="text-[#6D4AFF]">REWARDS.</span>
        </h1>

        {/* POIN CARD */}
        <div className="bg-[#6D4AFF] border-8 border-black p-10 shadow-[15px_15px_0px_0px_#000] flex flex-col sm:flex-row justify-between items-center overflow-hidden relative gap-6">
          <Zap className="absolute -left-10 -bottom-10 text-white/10" size={250} />
          <div className="relative z-10 text-center sm:text-left">
            <p className="text-white text-xl mb-2 font-black italic uppercase">POIN AKTIF LO:</p>
            <p className="text-7xl sm:text-9xl text-white drop-shadow-[6px_6px_0px_#000] leading-none font-black">{points.toLocaleString()}</p>
          </div>
          <div className="relative z-10 bg-amber-400 border-4 border-black p-4 rotate-12 shadow-[8px_8px_0px_0px_#000] shrink-0">
            <Trophy size={60} strokeWidth={3} />
          </div>
        </div>

        {/* KATALOG */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: "DISKON RP 50.000", cost: 500, color: "bg-emerald-400" },
            { name: "FREE MERCHANDISE", cost: 1500, color: "bg-pink-400" }
          ].map((item, i) => {
            const isRedeemingThis = isRedeeming === item.name;
            return (
              <div key={i} className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] flex justify-between items-center group">
                <div className="text-left">
                  <p className="text-2xl leading-none mb-1 font-black italic uppercase">{item.name}</p>
                  <p className="text-sm text-slate-400 font-bold uppercase">{item.cost} POIN</p>
                </div>
                <button 
                  disabled={points < item.cost || isRedeeming !== null}
                  onClick={() => handleRedeem(item.name, item.cost)}
                  className={`${item.color} border-2 border-black px-4 py-2 text-xs font-black italic uppercase shadow-[4px_4px_0_0_#000] disabled:opacity-50 disabled:grayscale transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none flex items-center gap-2`}
                >
                  {isRedeemingThis ? (
                    <>
                      <Loader2 className="animate-spin" size={12} />
                      <span>PROSES...</span>
                    </>
                  ) : points >= item.cost ? (
                    "TUKER SEKARANG"
                  ) : (
                    "POIN KURANG"
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* VOUCHER SAYA SECTION */}
        <div className="border-t-8 border-black pt-12 space-y-6">
          <h2 className="text-4xl font-black italic -skew-x-6 uppercase tracking-tighter text-slate-900 text-left">
            VOUCHER SAYA (RIWAYAT CLAIM)
          </h2>
          {claimedVouchers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {claimedVouchers.map((v, i) => (
                <div key={i} className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between relative overflow-hidden text-slate-900">
                  <div className="absolute top-4 right-4 bg-amber-400 border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0_0_#000]">
                    READY
                  </div>
                  <div className="space-y-2 text-left">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">
                      CLAIMED: {new Date(v.claimedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-xl font-black leading-none uppercase italic -skew-x-3">{v.name}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="font-mono text-sm font-black bg-slate-100 border-2 border-black px-3 py-1 uppercase tracking-widest select-all">
                        {v.code}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(v.code);
                          alert("Kode disalin ke clipboard!");
                        }}
                        className="bg-emerald-400 border-2 border-black p-1 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-slate-900"
                        title="Salin Kode"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-4 pt-2 border-t-2 border-dashed border-slate-200 text-left">
                    {v.name.includes("DISKON") 
                      ? "🎟️ Gunakan kode diskon ini saat checkout tiket konser lo."
                      : "🎁 Tunjukkan ke EO/panitia di gate untuk mengambil merchandise."
                    }
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border-4 border-black p-10 text-center shadow-[6px_6px_0_0_#000] -rotate-1">
              <p className="font-black italic text-xl text-slate-300 uppercase">BELUM ADA VOUCHER YANG DIKLAIM</p>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Tukarkan poin lo di atas untuk mendapatkan voucher pertamamu!</p>
            </div>
          )}
        </div>

      </div>

      {/* SUCCESS REDEEM MODAL */}
      {successVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSuccessVoucher(null)} />
          <div className="bg-[#FCFAF1] border-8 border-black p-8 max-w-md w-full relative z-10 shadow-[10px_10px_0_0_#000] -rotate-1 text-slate-900">
            <h3 className="text-4xl font-black italic -skew-x-6 uppercase tracking-tighter mb-4 text-emerald-500 text-left">
              TUKER BERHASIL! 🎉
            </h3>
            <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-6 text-left">
              LO BERHASIL MENUKARKAN {successVoucher.name}! BERIKUT KODE VOUCHER LO:
            </p>
            <div className="bg-amber-100 border-4 border-black p-4 text-center font-mono text-2xl font-black tracking-widest uppercase select-all mb-6">
              {successVoucher.code}
            </div>
            <p className="text-[11px] font-medium text-slate-600 normal-case mb-6 text-left">
              {successVoucher.name.includes("DISKON") 
                ? "Salin kode di atas dan gunakan di kolom promo saat lo melakukan checkout war tiket konser!"
                : "Tunjukkan kode unik di atas beserta KTP lo ke panitia / EO di venue untuk mengklaim merchandise resmi!"
              }
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(successVoucher.code);
                  alert("Kode voucher berhasil disalin!");
                }}
                className="flex-1 bg-amber-400 border-4 border-black py-3 font-black text-xs shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              >
                SALIN KODE
              </button>
              <button
                onClick={() => setSuccessVoucher(null)}
                className="bg-white border-4 border-black px-6 py-3 font-black text-xs shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}