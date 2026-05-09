"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { 
  LayoutDashboard, Ticket, LogOut, Loader2, 
  PlusCircle, Calendar, Edit2, Trash2,
  ImageIcon, Box, Zap, X, UploadCloud, Tag
} from "lucide-react";
import Link from "next/link";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

export default function EODashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eoId, setEoId] = useState<string | null>(null);
  const [eoName, setEoName] = useState("Organizer");
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Modal & Loading
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State File Gambar
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    end_date: "",
    start_time: "",
    location: "",
    max_buy: "4",
    description: "",
  });

  // STATE BARU: DYNAMIC ARRAY KATEGORI TIKET
  const [categories, setCategories] = useState([
    { id: Date.now(), name: "REGULAR", price: "", stock: "" }
  ]);

  useEffect(() => {
    setMounted(true);
    const fetchEOData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setEoId(session.user.id);
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", session.user.id).single();
      if (profile) setEoName(profile.full_name);
      fetchMyEvents(session.user.id);
    };
    fetchEOData();
  }, [router]);

  const fetchMyEvents = async (id: string) => {
    setIsLoading(true);
    const { data } = await supabase.from("events").select("*").eq("organizer_id", id).order("created_at", { ascending: false });
    if (data) setEvents(data);
    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert("Maksimal 2MB Man!"); return; }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // FUNGSI MANAJEMEN KATEGORI
  const addCategory = () => {
    setCategories([...categories, { id: Date.now(), name: "", price: "", stock: "" }]);
  };

  const removeCategory = (id: number) => {
    if (categories.length === 1) return alert("Minimal harus ada 1 kategori tiket Man!");
    setCategories(categories.filter(cat => cat.id !== id));
  };

  const updateCategory = (id: number, field: string, value: string) => {
    setCategories(categories.map(cat => cat.id === id ? { ...cat, [field]: value } : cat));
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eoId) return;

    // Validasi Kategori
    for (let cat of categories) {
      if (!cat.name || !cat.price || !cat.stock) {
        return alert("Bro, data kategori tiket lo masih ada yang kosong!");
      }
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = imagePreview; 

      if (imageFile) {
        const fileName = `${eoId}-${Date.now()}.png`;
        const filePath = `event-banners/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('event_images').upload(filePath, imageFile);
        if (uploadError) throw new Error("Gagal upload gambar: " + uploadError.message);
        
        const { data: { publicUrl } } = supabase.storage.from('event_images').getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      }

      // Hitung total stok dan harga termurah (buat disimpen di tabel events utama)
      const minPrice = Math.min(...categories.map(c => Number(c.price)));
      const totalStock = categories.reduce((acc, c) => acc + Number(c.stock), 0);

      const payload = {
        title: formData.title,
        date: formData.date,
        end_date: formData.end_date === "" ? null : formData.end_date,
        start_time: formData.start_time === "" ? null : formData.start_time,
        location: formData.location,
        price: minPrice, // Harga termurah sebagai patokan awal
        stock: totalStock, // Total semua tiket
        max_buy: Number(formData.max_buy),
        description: formData.description === "" ? null : formData.description,
        image_url: finalImageUrl,
        organizer_id: eoId,
        status: "pending"
      };

      if (editingEventId) {
        // UPDATE EVENT (Catatan: Lo mungkin perlu logika tambahan di backend buat hapus/update kategori lama kalau ngedit event)
        const { error: err } = await supabase.from("events").update(payload).eq("id", editingEventId);
        if (err) throw err;
        alert("Peringatan: Edit event saat ini tidak mengubah daftar kategori tiket (Cuma update info dasar)!");
      } else {
        // INSERT EVENT BARU
        const { data: eventData, error: err } = await supabase.from("events").insert([payload]).select().single();
        if (err) throw err;

        // INSERT KATEGORI TIKET KE TABEL BARU
        const categoryInserts = categories.map(cat => ({
          event_id: eventData.id,
          name: cat.name,
          price: Number(cat.price),
          stock: Number(cat.stock)
        }));

        const { error: catError } = await supabase.from("ticket_categories").insert(categoryInserts);
        if (catError) throw catError;
      }

      closeModal();
      fetchMyEvents(eoId);
    } catch (error: any) {
      alert("Gagal: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (event: any) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title,
      date: event.date,
      end_date: event.end_date || "",
      start_time: event.start_time || "",
      location: event.location,
      max_buy: event.max_buy?.toString() || "4",
      description: event.description || "",
    });
    // Saat edit, kita biarin state kategori kosong aja dulu atau kasih warning
    setCategories([{ id: Date.now(), name: "DEFAULT TIER", price: event.price.toString(), stock: event.stock.toString() }]);
    
    setImagePreview(event.image_url);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEventId(null);
    setFormData({ title: "", date: "", end_date: "", start_time: "", location: "", max_buy: "4", description: "" });
    setCategories([{ id: Date.now(), name: "REGULAR", price: "", stock: "" }]);
    setImageFile(null);
    setImagePreview(null);
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  if (!mounted) return null;

  return (
    <main className={`min-h-screen bg-white flex flex-col md:flex-row ${poppins.className} text-black`}>
      {/* SIDEBAR */}
      <aside className="w-full md:w-72 bg-white border-r-8 border-black md:min-h-screen flex flex-col p-8 z-20">
        <div className="mb-12 flex items-center gap-3">
          <div className="bg-[#6D4AFF] p-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-6deg]">
            <Zap className="text-amber-400" size={24} strokeWidth={3} />
          </div>
          <span className="text-3xl font-black italic uppercase tracking-tighter -skew-x-12 leading-none">Tiketin.</span>
        </div>
        <nav className="flex-grow space-y-6">
          <button className="w-full flex items-center gap-4 bg-black text-white px-6 py-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(109,74,255,1)] font-black uppercase italic text-sm tracking-widest">
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <Link href="/explore" className="w-full flex items-center gap-4 bg-white text-black px-6 py-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-black uppercase italic text-sm tracking-widest hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            <Ticket size={20} /> Lihat Stage
          </Link>
        </nav>
        <div className="border-t-8 border-black pt-8 mt-auto">
          <button onClick={() => { supabase.auth.signOut(); router.push("/login"); }} className="w-full flex items-center gap-3 text-red-600 font-black uppercase italic text-xs tracking-widest hover:underline">
            <LogOut size={18} /> Keluar Akun
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 p-6 md:p-12 bg-[#FCFAF1]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-left">
            <div>
              <h2 className="text-6xl font-black italic uppercase tracking-tighter leading-tight -skew-x-6">EO Stage.</h2>
              <p className="text-slate-500 font-bold italic text-lg mt-2">Yo {eoName.split(' ')[0]}, kelola panggungmu sekarang.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-[#6D4AFF] text-white border-4 border-black px-8 py-5 font-black uppercase italic text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all flex items-center gap-3">
              <PlusCircle size={22} strokeWidth={3} /> Buat Event Baru
            </button>
          </div>

          {/* TABLE */}
          <div className="bg-white border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="overflow-x-auto text-left">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="p-6 border-r border-white/20">Poster & Nama</th>
                    <th className="p-6 border-r border-white/20">Jadwal & Kuota</th>
                    <th className="p-6 border-r border-white/20">Harga Termurah</th>
                    <th className="p-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-4 divide-black">
                  {isLoading ? (
                    <tr><td colSpan={4} className="p-24 text-center font-black italic text-2xl uppercase italic tracking-widest">Loading...</td></tr>
                  ) : events.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6 border-r-4 border-black text-left">
                        <div className="flex items-center gap-5">
                          <div className="w-20 h-20 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden shrink-0">
                             {event.image_url ? (
                               <img src={event.image_url} className="w-full h-full object-cover" alt="Poster" />
                             ) : (
                               <ImageIcon size={24} className="m-auto mt-6 text-slate-200" />
                             )}
                          </div>
                          <div>
                            <span className="font-black text-xl uppercase italic -skew-x-3 block leading-none mb-2">{event.title}</span>
                            <span className={`text-[8px] font-black px-3 py-1 border-2 border-black uppercase italic ${event.status === 'approved' ? 'bg-emerald-400' : 'bg-amber-400'}`}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 border-r-4 border-black font-black uppercase italic text-xs space-y-2">
                        <div className="flex items-center gap-2"><Calendar size={14} className="text-red-500" /> {event.date}</div>
                        <div className="flex items-center gap-2 text-[#6D4AFF]"><Box size={14} /> Total Stok: {event.stock} Lembar</div>
                      </td>
                      <td className="p-6 border-r-4 border-black text-left">
                        <div className="font-black text-2xl italic tracking-tighter text-[#6D4AFF] leading-none mb-1">{formatRupiah(event.price)}</div>
                        <div className="text-[9px] font-black uppercase bg-amber-100 border border-amber-400 inline-block px-2 py-0.5 italic text-black">Start From</div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-4 text-black">
                          <button onClick={() => openEditModal(event)} className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                            <Edit2 size={20} strokeWidth={3} />
                          </button>
                          <button onClick={() => { if(confirm("Hapus?")) supabase.from("events").delete().eq("id", event.id).then(() => fetchMyEvents(eoId!)) }} className="bg-white border-2 border-black p-3 text-red-500 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                            <Trash2 size={20} strokeWidth={3} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL (BUAT/EDIT EVENT) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] text-black">
          <div className="bg-white border-8 border-black p-8 md:p-12 w-full max-w-4xl shadow-[20px_20px_0px_0px_rgba(109,74,255,1)] relative max-h-[95vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-6 right-6 p-2 border-4 border-black hover:bg-red-500 transition-colors">
              <X size={28} strokeWidth={4} />
            </button>
            
            <h2 className="text-5xl font-black italic uppercase mb-8 -skew-x-6 tracking-tighter text-left underline decoration-8 decoration-[#6D4AFF]">
              {editingEventId ? "Edit Panggung" : "Siapkan Panggung"}
            </h2>
            
            <form onSubmit={handleSubmitEvent} className="text-left space-y-10">
              
              {/* SECTION 1: INFO UTAMA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 border-4 border-black p-6">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block italic">Nama Event</label>
                    <input type="text" required className="w-full p-4 border-4 border-black bg-white font-black italic uppercase outline-none focus:bg-amber-100 text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block italic tracking-widest">Poster Panggung (Maks 2MB)</label>
                    <div className="flex gap-4">
                      <div className="w-[120px] h-[120px] border-4 border-black bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <UploadCloud size={32} className="text-slate-300" />}
                      </div>
                      <div onClick={() => fileInputRef.current?.click()} className="flex-1 border-4 border-dashed border-black bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors text-center p-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-black">{imageFile ? imageFile.name : "Ganti Poster"}</p>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block italic">Lokasi Venue</label>
                    <input type="text" required className="w-full p-4 border-4 border-black bg-white font-black italic uppercase text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-6 text-black flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block italic">Tgl Mulai</label>
                      <input type="date" required className="w-full p-4 border-4 border-black bg-white font-black text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block italic">Jam Mulai</label>
                      <input type="time" className="w-full p-4 border-4 border-black bg-white font-black text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[#FF6B6B] mb-1 block italic">Maks Beli / Akun (Calo Blocker)</label>
                    <input type="number" required min={1} className="w-full p-4 border-4 border-black bg-red-50 font-black text-black shadow-[4px_4px_0_0_rgba(239,68,68,1)]" value={formData.max_buy} onChange={(e) => setFormData({...formData, max_buy: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block italic">Deskripsi Event</label>
                    <textarea rows={2} className="w-full p-4 border-4 border-black bg-white font-medium text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* SECTION 2: DYNAMIC TICKET CATEGORIES */}
              <div className="bg-amber-400 border-8 border-black p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] space-y-4">
                <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-6">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2"><Tag size={24}/> Kategori Tiket</h3>
                  <button type="button" onClick={addCategory} disabled={!!editingEventId} className="bg-black text-white px-4 py-2 border-2 border-black font-black uppercase italic text-[10px] shadow-[4px_4px_0_0_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 disabled:opacity-50">
                    <PlusCircle size={14} /> Tambah Tier
                  </button>
                </div>
                
                {editingEventId && <p className="text-xs font-bold bg-white text-red-600 p-2 border-2 border-black mb-4 inline-block">Edit kategori sementara tidak tersedia. Hapus event jika ingin ubah harga.</p>}

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {categories.map((cat, index) => (
                    <div key={cat.id} className="bg-white border-4 border-black p-4 relative flex flex-col md:flex-row gap-4 items-center group shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                      <div className="absolute -top-3 -left-3 bg-black text-white px-2 py-1 font-black italic text-[9px] uppercase border-2 border-black">Tier {index + 1}</div>
                      
                      <div className="flex-1 w-full mt-2 md:mt-0">
                        <label className="text-[9px] font-black uppercase text-slate-400 italic">Nama</label>
                        <input type="text" value={cat.name} onChange={e => updateCategory(cat.id, 'name', e.target.value)} disabled={!!editingEventId} placeholder="FESTIVAL" required className="w-full p-2 border-2 border-black font-black italic uppercase text-sm" />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="text-[9px] font-black uppercase text-slate-400 italic">Harga (Rp)</label>
                        <input type="number" value={cat.price} onChange={e => updateCategory(cat.id, 'price', e.target.value)} disabled={!!editingEventId} placeholder="500000" required className="w-full p-2 border-2 border-black font-black italic uppercase text-sm text-[#6D4AFF]" />
                      </div>
                      <div className="w-full md:w-32">
                        <label className="text-[9px] font-black uppercase text-slate-400 italic">Jml Stok</label>
                        <input type="number" value={cat.stock} onChange={e => updateCategory(cat.id, 'stock', e.target.value)} disabled={!!editingEventId} placeholder="100" required className="w-full p-2 border-2 border-black font-black italic uppercase text-sm" />
                      </div>
                      
                      {!editingEventId && categories.length > 1 && (
                        <button type="button" onClick={() => removeCategory(cat.id)} className="w-full md:w-auto mt-4 md:mt-4 bg-red-100 text-red-500 border-2 border-black p-2 hover:bg-red-500 hover:text-white transition-colors">
                          <Trash2 size={20} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-5 bg-white border-4 border-black font-black uppercase italic text-sm hover:bg-slate-100 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-5 bg-[#6D4AFF] text-white border-4 border-black font-black uppercase italic text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-2 hover:translate-y-2 transition-all disabled:opacity-50 flex items-center justify-center">
                  {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> SEDANG MENGIRIM...</> : (editingEventId ? "SIMPAN PERUBAHAN" : "KIRIM PENGAJUAN EVENT")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}