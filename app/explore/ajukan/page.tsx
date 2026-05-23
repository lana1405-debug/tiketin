"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { Send, Briefcase, Ticket as TicketIcon, Globe, Phone, Info, FileText, UploadCloud } from "lucide-react";
import { useToast } from "@/components/ui/toast-brutal";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function AjukanEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // ⚡ STATE DATA TEKS
  const [orgName, setOrgName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [orgType, setOrgType] = useState("PROMOTOR MUSIK");
  const [reason, setReason] = useState("");

  // ⚡ STATE BERKAS (FILE)
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [legalFile, setLegalFile] = useState<File | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
    };
    checkUser();
  }, [router]);

  // 🔥 FUNGSI UPLOAD KE BUCKET legal_docs
  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('legal_docs')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('legal_docs').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioFile || !legalFile) {
      toast("Wajib upload Portofolio dan Berkas PT dulu, Man!", "warning");
      return;
    }
    
    setLoading(true);
    try {
      // 1. Upload file ke storage
      const portfolioUrl = await uploadFile(portfolioFile, 'portfolios');
      const legalUrl = await uploadFile(legalFile, 'pt_documents');

      // 2. Insert menggunakan nama kolom asli di database Anda (company_name, phone_number, portfolio_url)
      const { error: insertError } = await supabase
        .from("eo_applications")
        .insert([
          { 
            user_id: user.id, 
            company_name: orgName,           // Pakai company_name
            phone_number: whatsapp,          // Pakai phone_number
            organization_type: orgType, 
            portfolio_url: portfolioUrl,      // Pakai portfolio_url
            legal_document_url: legalUrl, 
            reason: reason,
            status: "pending" 
          }
        ]);

      if (insertError) throw insertError;

      toast("🚀 MANTAP! Data & PDF udah masuk. Admin bakal kurasi dulu ya.", "success");
      router.push("/explore");
    } catch (error: any) {
      toast("Aduh gagal: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen bg-[#FCFAF1] p-6 md:p-12 ${poppins.className} text-left`}>
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-12">
          <div className="bg-[#6D4AFF] border-4 border-black p-4 inline-block -rotate-2 shadow-[6px_6px_0_0_#000] mb-8">
            <TicketIcon className="text-amber-400" size={40} strokeWidth={3} />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl md:text-8xl font-black italic uppercase -skew-x-6 tracking-tighter leading-[0.8] mb-4">
            VERIFIKASI <span className="text-[#6D4AFF]">PROMOTOR.</span>
          </h1>
          <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-[10px] italic">Tiketin Revolution • Know Your Business (KYB)</p>
        </header>

        {/* WARNING NOTE POTONGAN 15% */}
        <div className="bg-amber-400 border-4 border-slate-900 p-6 shadow-[6px_6px_0px_0px_#000] -rotate-1 mb-12 text-slate-900">
          <div className="flex gap-4 items-start">
            <Info className="shrink-0 text-slate-900 mt-1" size={24} strokeWidth={3} />
            <div>
              <h4 className="font-black uppercase tracking-wider text-xs mb-1">PENGUMUMAN PENTING UNTUK PROMOTOR:</h4>
              <p className="font-bold text-[11px] uppercase leading-relaxed">
                Seluruh penghasilan dari penjualan tiket di platform Tiketin akan dikenakan potongan biaya layanan (transaction deduction) sebesar <span className="bg-black text-amber-400 px-1.5 py-0.5 font-black text-xs mx-0.5">15%</span> pada saat pencairan dana (withdrawal) untuk operasional & maintenance platform ke depannya. Harap sesuaikan strategi harga event Anda!
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* SECTION 01: IDENTITAS */}
          <section className="relative">
            <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 md:translate-x-4 md:translate-y-4" />
            <div className="relative bg-white border-4 border-black p-6 md:p-10">
              <div className="bg-black text-white px-4 py-1 inline-block -skew-x-12 mb-8">
                <h3 className="font-black italic uppercase text-lg">01. IDENTITAS ORGANISASI</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 md:col-span-2">
                  <label className="font-black uppercase italic text-[10px] tracking-widest text-slate-400 block">Nama Resmi Promotor / Event Organizer</label>
                  <div className="relative flex items-center bg-white border-4 border-black">
                    <div className="px-4 border-r-4 border-black h-14 flex items-center bg-amber-400"><Briefcase size={20} strokeWidth={3} /></div>
                    <input type="text" placeholder="MISAL: BUMI SILIWANGI ENTERTAINMENT" className="w-full h-14 px-4 font-black uppercase outline-none focus:bg-amber-50" onChange={(e) => setOrgName(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-black uppercase italic text-[10px] tracking-widest text-slate-400 block">WhatsApp Bisnis</label>
                  <div className="relative flex items-center bg-white border-4 border-black">
                    <div className="px-4 border-r-4 border-black h-14 flex items-center bg-emerald-400"><Phone size={20} strokeWidth={3} /></div>
                    <input type="tel" placeholder="08123456789" className="w-full h-14 px-4 font-black outline-none" onChange={(e) => setWhatsapp(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-black uppercase italic text-[10px] tracking-widest text-slate-400 block">Tipe Organisasi</label>
                  <select className="w-full h-14 px-4 border-4 border-black font-black uppercase outline-none bg-white" onChange={(e) => setOrgType(e.target.value)}>
                    <option>PROMOTOR MUSIK</option>
                    <option>KOMUNITAS SENI</option>
                    <option>EVENT ORGANIZER</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 02: UPLOAD DOKUMEN */}
          <section className="relative">
            <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 md:translate-x-4 md:translate-y-4" />
            <div className="relative bg-white border-4 border-black p-6 md:p-10">
              <div className="bg-[#6D4AFF] text-white px-4 py-1 inline-block -skew-x-12 mb-8">
                <h3 className="font-black italic uppercase text-lg">02. BERKAS PENDUKUNG (PDF)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="font-black uppercase italic text-[10px] tracking-widest text-slate-400 block">Portofolio (PDF)</label>
                  <div className="relative border-4 border-dashed border-black p-6 text-center group hover:bg-amber-50 transition-all">
                    <input type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setPortfolioFile(e.target.files?.[0] || null)} required />
                    <div className="flex flex-col items-center gap-2">
                      <UploadCloud size={32} className={portfolioFile ? "text-emerald-500" : "text-slate-300"} />
                      <p className="font-black text-[10px] uppercase truncate max-w-[200px] italic">
                        {portfolioFile ? portfolioFile.name : "KLIK BUAT UPLOAD PORTOFOLIO"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="font-black uppercase italic text-[10px] tracking-widest text-slate-400 block">Berkas PT / Akta (PDF)</label>
                  <div className="relative border-4 border-dashed border-black p-6 text-center group hover:bg-emerald-50 transition-all">
                    <input type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setLegalFile(e.target.files?.[0] || null)} required />
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={32} className={legalFile ? "text-[#6D4AFF]" : "text-slate-300"} />
                      <p className="font-black text-[10px] uppercase truncate max-w-[200px] italic">
                        {legalFile ? legalFile.name : "KLIK BUAT UPLOAD BERKAS PT"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 03: VISI */}
          <section className="relative">
            <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 md:translate-x-4 md:translate-y-4" />
            <div className="relative bg-white border-4 border-black p-6 md:p-10">
              <div className="bg-amber-400 border-2 border-black text-black px-4 py-1 inline-block -skew-x-12 mb-8 shadow-[3px_3px_0_0_#000]">
                <h3 className="font-black italic uppercase text-lg">03. RENCANA EVENT</h3>
              </div>
              <textarea placeholder="JELASKAN EVENT APA YANG INGIN ANDA JUAL DI TIKETIN..." className="w-full p-6 h-40 border-4 border-black font-bold outline-none resize-none bg-white focus:bg-blue-50" onChange={(e) => setReason(e.target.value)} required />
            </div>
          </section>

          <button type="submit" disabled={loading} className="w-full h-24 bg-black text-white border-4 border-black font-black italic uppercase text-2xl shadow-[10px_10px_0_0_#6D4AFF] hover:bg-[#6D4AFF] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all flex items-center justify-center gap-4 disabled:opacity-50">
            {loading ? "LAGI UPLOAD..." : <>KIRIM DATA & BERKAS <Send size={32} strokeWidth={3} /></>}
          </button>
        </form>
      </div>
    </main>
  );
}