"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { 
  ShieldAlert, UploadCloud, CheckCircle, 
  Loader2, AlertCircle, Image as ImageIcon, IdCard, ArrowLeft
} from "lucide-react";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function CustomerVerificationPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("loading");
  
  const [nik, setNik] = useState("");
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUserId(session.user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("verification_status")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setStatus(profile.verification_status || "unverified");
    } else {
      setStatus("unverified");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        alert("Ukuran KTP maksimal 2MB "); 
        return; 
      }
      setKtpFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setKtpPreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nik || !ktpFile || !userId) return;
    setIsSubmitting(true);

    try {
      const fileExt = ktpFile.name.split('.').pop();
      const fileName = `KTP-${userId}-${Date.now()}.${fileExt}`;
      const filePath = `ktp/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ktp_images')
        .upload(filePath, ktpFile);

      if (uploadError) throw new Error("Gagal upload KTP: " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage
        .from('ktp_images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("profiles")
        .update({ 
          nik: nik, 
          ktp_url: publicUrl, 
          verification_status: "pending" 
        })
        .eq("id", userId);

      if (dbError) throw dbError;

      alert("Berkas KTP berhasil dikirim!");
      setStatus("pending");
      
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-[#FCFAF1]"><Loader2 className="animate-spin text-[#6D4AFF]" size={48} /></div>;
  }

  return (
    <div className={`min-h-screen bg-[#FCFAF1] p-6 md:p-12 flex items-center justify-center ${poppins.className} text-black`}>
      <div className="w-full max-w-2xl bg-white border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 relative text-left">
        
        {/* HEADER */}
        <div className="border-b-8 border-black pb-8 mb-8">
          <div className="flex justify-between items-start">
            <div className="bg-[#6D4AFF] text-white px-4 py-1 inline-flex items-center gap-2 border-2 border-black font-black italic uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
              <ShieldAlert size={14} strokeWidth={3} /> Security Clearance
            </div>
            <button onClick={() => router.push('/explore')} className="text-[10px] font-black uppercase italic underline hover:text-[#6D4AFF]">Skip ke Explore</button>
          </div>
          <h1 className="text-4xl md:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter leading-none">
            Verifikasi <span className="text-[#6D4AFF]">KTP.</span>
          </h1>
          <p className="font-bold text-slate-500 italic mt-2 text-sm">Wajib verifikasi identitas asli sebelum beli tiket. Lawan Calo!</p>
        </div>

        {/* LOGIKA TAMPILAN BERDASARKAN STATUS */}
        {status === "approved" ? (
          <div className="bg-emerald-400 border-4 border-black p-8 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle size={64} strokeWidth={3} className="mx-auto mb-4" />
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Akun Tervalidasi!</h2>
            <p className="font-bold text-sm mt-2">Identitas udah dikonfirmasi admin. Sekarang bisa beli tiket sepuasnya.</p>
            <button onClick={() => router.push('/explore')} className="mt-6 bg-black text-white px-6 py-3 font-black uppercase italic text-xs tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">Mulai Belanja Tiket</button>
          </div>
        ) : status === "pending" ? (
          <div className="bg-amber-400 border-4 border-black p-8 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
            <Loader2 size={64} strokeWidth={3} className="mx-auto mb-4 animate-spin" />
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Dalam Antrean Review</h2>
            <p className="font-bold text-sm mt-2 mb-8">Berkas KTP lagi dicek sama sistem admin. Sabar ya </p>
            
            <button 
              onClick={() => router.push('/explore')}
              className="py-4 px-8 bg-black text-white border-4 border-black font-black uppercase italic text-xs shadow-[8px_8px_0_0_rgba(255,255,255,1)] hover:bg-[#6D4AFF] hover:shadow-none transition-all"
            >
              Sambil Nunggu, Explore Konser Yuk!
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {status === "rejected" && (
              <div className="bg-red-500 text-white border-4 border-black p-4 font-bold italic text-sm flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <AlertCircle size={24} /> KTP ditolak admin! Pastiin fotonya jelas dan NIK-nya bener. Silakan upload ulang.
              </div>
            )}

            {/* INPUT NIK */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block italic flex items-center gap-2">
                <IdCard size={14} /> Nomor Induk Kependudukan (NIK)
              </label>
              <input 
                type="text" 
                required 
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                placeholder="CONTOH: 32731..." 
                className="w-full p-5 border-4 border-black bg-slate-50 font-black italic uppercase outline-none focus:bg-white text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
              />
            </div>

            {/* UPLOAD FOTO KTP */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block italic flex items-center gap-2">
                <ImageIcon size={14} /> Upload Foto KTP Fisik
              </label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-4 border-dashed border-black flex flex-col items-center justify-center cursor-pointer transition-all ${ktpPreview ? 'p-2 bg-black' : 'p-10 bg-slate-50 hover:bg-slate-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
              >
                {ktpPreview ? (
                  <div className="w-full relative aspect-video border-2 border-black">
                    <img src={ktpPreview} alt="Preview KTP" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white font-black italic uppercase border-2 border-white px-4 py-2">Ganti Foto</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={48} className="text-black mb-4" strokeWidth={3} />
                    <p className="font-black italic uppercase text-lg text-center">Klik Untuk Upload KTP</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic">JPG/PNG. Maks 2MB.</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileChange} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full py-6 bg-[#6D4AFF] text-white border-4 border-black font-black uppercase italic text-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? <><Loader2 className="animate-spin" /> MENGIRIM DATA...</> : "KIRIM VERIFIKASI"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}