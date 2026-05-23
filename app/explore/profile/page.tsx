"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { 
  Camera, User, Key, Trophy, Ticket as TicketIcon, 
  CheckCircle2, AlertTriangle, LogOut, ArrowLeft, 
  Sparkles, ShieldCheck, Check, Loader2, Award
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast-brutal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import { playClick, playWinPoints } from "@/lib/soundEffects";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export default function UserProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Stats state
  const [totalTickets, setTotalTickets] = useState(0);
  const [attendedEvents, setAttendedEvents] = useState(0);

  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    const currentUserId = session.user.id;
    setUserId(currentUserId);

    // Get profiles details
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUserId)
      .single();

    if (profile) {
      setUserProfile(profile);
      setFullName(profile.full_name || "");

      // Fetch stats
      const { count: ticketCount } = await supabase
        .from("tiket")
        .select("id, transaksi!inner(user_id)", { count: "exact", head: true })
        .eq("transaksi.user_id", currentUserId);

      setTotalTickets(ticketCount || 0);

      const { count: checkinCount } = await supabase
        .from("tiket")
        .select("id, transaksi!inner(user_id)", { count: "exact", head: true })
        .eq("transaksi.user_id", currentUserId)
        .eq("status_checkin", true);

      setAttendedEvents(checkinCount || 0);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    if (!fullName.trim()) {
      toast("Nama tidak boleh kosong!", "error");
      return;
    }
    playClick();
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userId);

      if (error) throw error;
      
      toast("Profil berhasil diperbarui!", "success");
      playWinPoints();
      fetchUserProfile();
    } catch (err: any) {
      toast("Gagal memperbarui profil: " + err.message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarClick = () => {
    playClick();
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      toast("File harus berupa gambar!", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast("Ukuran gambar maksimal 2MB!", "error");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (dbError) throw dbError;

      toast("Avatar berhasil diperbarui!", "success");
      playWinPoints();
      fetchUserProfile();
    } catch (err: any) {
      toast("Gagal upload avatar: " + err.message, "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      toast("Password baru tidak boleh kosong!", "error");
      return;
    }
    if (newPassword.length < 6) {
      toast("Password minimal 6 karakter!", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("Konfirmasi password tidak cocok!", "error");
      return;
    }
    playClick();
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast("Password berhasil diperbarui!", "success");
      playWinPoints();
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast("Gagal ganti password: " + err.message, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    playClick();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 noise brutal-grid ${poppins.className}`}>
      
      {/* NAVBAR */}
      <nav className="w-full bg-white dark:bg-zinc-900 border-b-8 border-slate-900 dark:border-zinc-700 sticky top-0 z-[50] shadow-[0_8px_0_0_rgba(0,0,0,1)] dark:shadow-[0_8px_0_0_var(--primary-color,#6D4AFF)] h-20 px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <Link href="/explore" className="flex items-center gap-2 group">
            <div className="h-10 w-10 bg-black flex items-center justify-center group-hover:-rotate-12 transition-transform shadow-[4px_4px_0_0_#6D4AFF]">
              <ArrowLeft className="text-white" size={18} strokeWidth={3} />
            </div>
            <span className="text-xl font-black italic -skew-x-12 tracking-tighter uppercase ml-2 hidden sm:inline text-slate-900 dark:text-zinc-50">Kembali</span>
          </Link>
          <span className="text-2xl font-black italic -skew-x-12 tracking-tighter uppercase text-slate-900 dark:text-zinc-50">Profil Pengguna</span>

          <div className="flex items-center gap-4">
            <NotificationBell userId={userProfile?.id} />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="max-w-5xl mx-auto px-6 pt-12 pb-24">
        
        {/* HEADER PROFILE CARD */}
        <div className="border-4 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color,#6D4AFF)] flex flex-col md:flex-row items-center gap-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Award size={200} className="text-slate-900 dark:text-white" />
          </div>

          <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick}>
            <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-slate-900 dark:border-zinc-700 rounded-none -rotate-3 group-hover:rotate-0 transition-transform shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color,#6D4AFF)]">
              <AvatarImage src={userProfile?.avatar_url} className="object-cover" />
              <AvatarFallback className="bg-[#6D4AFF] text-white font-black text-4xl">{userProfile?.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-amber-400 border-2 border-slate-900 dark:border-zinc-700 p-1.5 shadow-[2px_2px_0_0_#000] transition-transform group-hover:scale-110">
              {uploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
              ) : (
                <Camera className="h-4 w-4 text-slate-900" strokeWidth={3} />
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-3 z-10">
            <div className="space-y-1">
              <h2 className="text-3xl font-black italic -skew-x-6 uppercase tracking-tight text-slate-900 dark:text-zinc-50">
                {userProfile?.full_name || "Bintang Tiketin"}
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">{userProfile?.email}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {/* KYC BADGE */}
              <div className={`border-2 border-slate-900 dark:border-zinc-700 px-3 py-1 text-[10px] font-black uppercase shadow-[2.5px_2.5px_0_0_#000] flex items-center gap-1.5 ${
                userProfile?.verification_status === "approved"
                  ? "bg-emerald-400 text-slate-950"
                  : userProfile?.verification_status === "pending"
                  ? "bg-amber-400 text-slate-950"
                  : "bg-rose-500 text-white"
              }`}>
                {userProfile?.verification_status === "approved" ? (
                  <>
                    <ShieldCheck size={12} strokeWidth={3} /> Verified
                  </>
                ) : userProfile?.verification_status === "pending" ? (
                  <>
                    <Sparkles className="animate-spin" size={12} strokeWidth={3} /> Pending KYC
                  </>
                ) : (
                  <>
                    <AlertTriangle size={12} strokeWidth={3} /> Unverified
                  </>
                )}
              </div>

              {/* POINTS BADGE */}
              <div className="bg-purple-500 text-white border-2 border-slate-900 dark:border-zinc-700 px-3 py-1 text-[10px] font-black uppercase shadow-[2.5px_2.5px_0_0_#000] flex items-center gap-1.5">
                <Trophy size={12} strokeWidth={3} /> {userProfile?.points || 0} Poin
              </div>
            </div>
          </div>
        </div>

        {/* STATS CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Link href="/explore/tickets" className="group">
            <div className="border-4 border-slate-900 dark:border-zinc-700 bg-[#E0F2FE] dark:bg-sky-950/40 p-5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] transition-all group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-400">Tiket Saya</span>
                <TicketIcon className="text-sky-800 dark:text-sky-400" size={20} strokeWidth={3} />
              </div>
              <div className="mt-4">
                <span className="text-4xl font-black italic -skew-x-6 text-sky-950 dark:text-white">{totalTickets}</span>
                <p className="text-[9px] font-bold text-sky-700 dark:text-sky-300 mt-1">LIHAT SEMUA TIKET →</p>
              </div>
            </div>
          </Link>

          <div className="border-4 border-slate-900 dark:border-zinc-700 bg-[#DCFCE7] dark:bg-emerald-950/40 p-5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Event Dihadiri</span>
              <CheckCircle2 className="text-emerald-800 dark:text-emerald-400" size={20} strokeWidth={3} />
            </div>
            <div className="mt-4">
              <span className="text-4xl font-black italic -skew-x-6 text-emerald-950 dark:text-white">{attendedEvents}</span>
              <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 mt-1">CHECK-IN SUKSES</p>
            </div>
          </div>

          <Link href="/explore/rewards" className="group">
            <div className="border-4 border-slate-900 dark:border-zinc-700 bg-[#F3E8FF] dark:bg-purple-950/40 p-5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] transition-all group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-400">Rewards Arena</span>
                <Trophy className="text-purple-800 dark:text-purple-400" size={20} strokeWidth={3} />
              </div>
              <div className="mt-4">
                <span className="text-4xl font-black italic -skew-x-6 text-purple-950 dark:text-white">{userProfile?.points || 0}</span>
                <p className="text-[9px] font-bold text-purple-700 dark:text-purple-300 mt-1">TUKAR VOUCHER →</p>
              </div>
            </div>
          </Link>
        </div>

        {/* FORMS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* EDIT PROFILE CARD */}
          <div className="border-4 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color)]">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-rose-100 dark:bg-rose-950/40 p-2 border-2 border-slate-900 dark:border-zinc-700">
                <User className="text-rose-600 dark:text-rose-400" size={18} strokeWidth={3} />
              </div>
              <h3 className="text-lg font-black uppercase italic -skew-x-3">Data Diri</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  Nama Lengkap
                </label>
                <Input 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  className="border-4 border-slate-900 dark:border-zinc-700 rounded-none dark:bg-zinc-800 text-sm p-3 font-bold h-12 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.1)] focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all text-slate-900 dark:text-white"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="w-full bg-[#6D4AFF] hover:bg-[#5b3ce6] text-white border-4 border-slate-900 dark:border-zinc-700 rounded-none font-black italic uppercase text-xs py-5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer disabled:opacity-50"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" strokeWidth={3} /> Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* CHANGE PASSWORD CARD */}
          <div className="border-4 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color)]">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-amber-100 dark:bg-amber-950/40 p-2 border-2 border-slate-900 dark:border-zinc-700">
                <Key className="text-amber-600 dark:text-amber-400" size={18} strokeWidth={3} />
              </div>
              <h3 className="text-lg font-black uppercase italic -skew-x-3">Keamanan</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  Password Baru
                </label>
                <Input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="border-4 border-slate-900 dark:border-zinc-700 rounded-none dark:bg-zinc-800 text-sm p-3 font-bold h-12 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.1)] focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  Konfirmasi Password Baru
                </label>
                <Input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="border-4 border-slate-900 dark:border-zinc-700 rounded-none dark:bg-zinc-800 text-sm p-3 font-bold h-12 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.1)] focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all text-slate-900 dark:text-white"
                />
              </div>

              <Button
                onClick={handleUpdatePassword}
                disabled={changingPassword}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 border-4 border-slate-900 dark:border-zinc-700 rounded-none font-black italic uppercase text-xs py-5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer disabled:opacity-50"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin animate-spin-slow" /> Mengubah...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" strokeWidth={3} /> Ganti Password
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* DANGER ZONE */}
        <div className="border-4 border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/20 p-6 shadow-[8px_8px_0_0_#EF4444] text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase text-red-600 dark:text-red-400">Danger Zone</h3>
              <p className="text-xs text-red-700 dark:text-red-300 font-medium">Keluar dari sesi akun Anda di perangkat ini.</p>
            </div>
            <div>
              <Button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white border-4 border-slate-900 rounded-none font-black italic uppercase text-xs py-5 px-6 shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" strokeWidth={3} /> Keluar Akun
              </Button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
