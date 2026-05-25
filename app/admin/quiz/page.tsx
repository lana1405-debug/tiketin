"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { 
  ShieldCheck, Loader2, Save, Trash2, Plus, ArrowLeft,
  BookOpen, HelpCircle, CheckCircle, BrainCircuit
} from "lucide-react";
import { useToast } from "@/components/ui/toast-brutal";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"] 
});

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizConfig {
  activeTopic: "MUSIK" | "TEATER" | "BANDUNG";
  rewardPoints: number;
  questions: Question[];
}

const DEFAULT_QUESTIONS: Record<string, Question[]> = {
  MUSIK: [
    {
      question: "Siapakah penyanyi legendaris Indonesia yang memopulerkan lagu 'Kemesraan'?",
      options: ["Iwan Fals", "Chrisye", "Ebiet G. Ade", "Gombloh"],
      correctIndex: 0
    },
    {
      question: "Band asal Bandung yang terkenal dengan lagu 'Peterpan' sebelum berubah nama adalah...",
      options: ["Peterpan", "Sheila on 7", "Padi", "Dewa 19"],
      correctIndex: 0
    },
    {
      question: "Lagu daerah Jawa Barat yang bercerita tentang makanan tradisional dari singkong adalah...",
      options: ["Manuk Dadali", "Es Lilin", "Peuyeum Bandung", "Bubuy Bulan"],
      correctIndex: 2
    }
  ],
  TEATER: [
    {
      question: "Naskah drama terkenal 'Mega-Mega' ditulis oleh sastrawan Indonesia yaitu...",
      options: ["W.S. Rendra", "Arifin C. Noer", "Putu Wijaya", "Pramoedya Ananta Toer"],
      correctIndex: 1
    },
    {
      question: "Teater modern Indonesia yang didirikan oleh W.S. Rendra di Yogyakarta bernama...",
      options: ["Teater Koma", "Teater Populer", "Bengkel Teater", "Teater Kecil"],
      correctIndex: 2
    },
    {
      question: "Gedung kesenian bersejarah di Bandung yang sering digunakan untuk pertunjukan teater adalah...",
      options: ["Gedung Sate", "Gedung Merdeka", "Gedung Kesenian Rumentang Siang", "Gedung Landmark"],
      correctIndex: 2
    }
  ],
  BANDUNG: [
    {
      question: "Siapakah Walikota Bandung yang merancang Jalan Braga menjadi ikon wisata kreatif modern?",
      options: ["Ridwan Kamil", "Oded M. Danial", "Dada Rosada", "R.A.A. Wiranatakusumah"],
      correctIndex: 0
    },
    {
      question: "Julukan kota Bandung yang terkenal karena keindahan alam dan modenya adalah...",
      options: ["Kota Pahlawan", "Paris van Java", "Kota Satria", "Kota Khatulistiwa"],
      correctIndex: 1
    },
    {
      question: "Nama sungai terpanjang di Jawa Barat yang mengalir melalui wilayah Bandung Raya adalah...",
      options: ["Sungai Cikapundung", "Sungai Citarum", "Sungai Cisadane", "Sungai Cimanuk"],
      correctIndex: 1
    }
  ]
};

export default function AdminQuizPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // States
  const [activeTopic, setActiveTopic] = useState<"MUSIK" | "TEATER" | "BANDUNG">("BANDUNG");
  const [rewardPoints, setRewardPoints] = useState(2);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    setMounted(true);
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      toast("🛑 AREA TERLARANG! Anda bukan admin.", "error");
      router.push("/explore");
      return;
    }

    fetchQuizConfig();
  };

  const fetchQuizConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "daily_quiz")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data && data.value) {
        const config = data.value as QuizConfig;
        setActiveTopic(config.activeTopic || "BANDUNG");
        setRewardPoints(config.rewardPoints ?? 2);
        setQuestions(config.questions || []);
      } else {
        // Load default config
        setActiveTopic("BANDUNG");
        setRewardPoints(2);
        setQuestions(DEFAULT_QUESTIONS["BANDUNG"]);
      }
    } catch (err: any) {
      toast("Gagal memuat konfigurasi: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTopicChange = (newTopic: "MUSIK" | "TEATER" | "BANDUNG") => {
    setActiveTopic(newTopic);
    // Suggest loading default questions if list is empty or matches previous default
    if (confirm(`Apakah Anda ingin memuat pertanyaan bawaan (default) untuk topik ${newTopic}? Ini akan menggantikan daftar pertanyaan Anda saat ini.`)) {
      setQuestions(DEFAULT_QUESTIONS[newTopic]);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "Pertanyaan Baru?",
        options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
        correctIndex: 0
      }
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (confirm("Hapus pertanyaan ini?")) {
      setQuestions(questions.filter((_, i) => i !== idx));
    }
  };

  const handleQuestionTextChange = (idx: number, val: string) => {
    setQuestions(
      questions.map((q, i) => (i === idx ? { ...q, question: val } : q))
    );
  };

  const handleOptionChange = (qIdx: number, oIdx: number, val: string) => {
    setQuestions(
      questions.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = [...q.options];
        newOpts[oIdx] = val;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleCorrectIndexChange = (qIdx: number, val: number) => {
    setQuestions(
      questions.map((q, i) => (i === qIdx ? { ...q, correctIndex: val } : q))
    );
  };

  const handleSave = async () => {
    if (questions.length === 0) {
      toast("Wajib ada minimal 1 pertanyaan kuis, Man!", "warning");
      return;
    }

    // Validasi kosong
    const hasEmptyFields = questions.some(
      (q) => !q.question.trim() || q.options.some((o) => !o.trim())
    );
    if (hasEmptyFields) {
      toast("Harap isi semua input teks pertanyaan & pilihan ganda!", "warning");
      return;
    }

    setIsSaving(true);
    try {
      const payload: QuizConfig = {
        activeTopic,
        rewardPoints,
        questions
      };

      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: "daily_quiz",
          value: payload,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast("Kuis Harian berhasil disimpan ke database! 🧠", "success");
    } catch (err: any) {
      toast("Gagal menyimpan kuis: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`space-y-12 pb-20 ${poppins.className} text-black text-left`}>
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-black pb-10">
        <div className="space-y-4">
          <div className="bg-[#6D4AFF] text-white border-2 border-black px-4 py-1 text-[10px] font-black uppercase italic inline-flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <BrainCircuit size={14} strokeWidth={3} /> Admin Daily Quiz Control
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
            Quiz <span className="text-[#6D4AFF]">Manager.</span>
          </h1>
          <p className="text-lg font-bold text-slate-500 italic max-w-xl">
            Kelola soal kuis harian penonton seputar musik, teater, & Bandung.
          </p>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving || loading}
          className="bg-emerald-400 border-4 border-black px-8 py-5 font-black uppercase italic text-xs tracking-widest shadow-[6px_6px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={16} />}
          SAVE CONFIG
        </button>
      </header>

      {loading ? (
        <div className="py-24 text-center space-y-4">
          <Loader2 className="animate-spin mx-auto text-[#6D4AFF]" size={64} strokeWidth={4} />
          <p className="font-black italic text-xl uppercase tracking-widest">Loading Quiz Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT: CONFIG SETTINGS */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border-8 border-black p-6 shadow-[10px_10px_0_0_#000] text-left">
              <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2 border-b-4 border-black pb-2">
                <BookOpen size={20} /> Kuis Settings
              </h3>

              <div className="space-y-6">
                {/* TOPIC SELECTION */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Topik Aktif Hari Ini</label>
                  <select 
                    value={activeTopic}
                    onChange={(e) => handleTopicChange(e.target.value as any)}
                    className="w-full h-14 px-4 border-4 border-black font-black uppercase outline-none bg-white focus:bg-amber-50"
                  >
                    <option value="BANDUNG">🏞️ BANDUNG (LOKAL)</option>
                    <option value="MUSIK">🎵 MUSIK (INDONESIA)</option>
                    <option value="TEATER">🎭 TEATER (SENI)</option>
                  </select>
                </div>

                {/* POINTS REWARD */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Reward Poin (Semua Benar)</label>
                  <input 
                    type="number"
                    value={rewardPoints}
                    onChange={(e) => setRewardPoints(Math.max(1, Number(e.target.value)))}
                    className="w-full h-14 px-4 border-4 border-black font-black outline-none focus:bg-amber-50"
                  />
                  <p className="text-[9px] font-bold text-red-500 uppercase tracking-tight italic">
                    Sesuai instruksi: Standard default bernilai 2 Poin.
                  </p>
                </div>

                {/* INFO NOTES */}
                <div className="bg-amber-100 border-4 border-slate-900 p-4 font-bold text-[10px] uppercase tracking-wider leading-relaxed">
                  📢 Kuis ini memiliki batas waktu **10 detik per soal** saat dikerjakan oleh user. Sifat reset harian terikat pada tanggal lokal perangkat penonton.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: QUESTION EDITOR LIST */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border-8 border-black p-6 sm:p-8 shadow-[12px_12px_0_0_rgba(109,74,255,1)]">
              <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-6">
                <h3 className="text-xl font-black italic uppercase flex items-center gap-2">
                  <HelpCircle size={20} /> Daftar Pertanyaan ({questions.length})
                </h3>
                <button 
                  onClick={handleAddQuestion}
                  className="bg-black text-white hover:bg-slate-800 px-4 py-2 border-2 border-black font-black uppercase text-[10px] flex items-center gap-1 shadow-[3px_3px_0_0_rgba(0,0,0,0.3)] transition-all"
                >
                  <Plus size={14} /> TAMBAH SOAL
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="py-16 text-center border-4 border-dashed border-slate-200">
                  <p className="font-black italic text-slate-300 uppercase">Belum ada pertanyaan dibuat</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="border-4 border-black p-6 relative bg-slate-50 shadow-[4px_4px_0_0_#000]">
                      {/* Badge Nomer Soal */}
                      <span className="absolute top-[-18px] left-4 bg-black text-white px-3 py-1 border-2 border-black font-black italic uppercase text-[10px]">
                        Soal #{qIdx + 1}
                      </span>

                      {/* Remove Button */}
                      <button 
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="absolute top-[-18px] right-4 bg-red-500 hover:bg-red-600 text-white p-1 border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                        title="Hapus Soal"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="space-y-4 pt-2">
                        {/* Teks Pertanyaan */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 block">Pertanyaan</label>
                          <input 
                            type="text"
                            value={q.question}
                            onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                            className="w-full p-3 border-2 border-black font-black uppercase text-xs outline-none bg-white focus:bg-amber-50"
                            placeholder="Tulis soal kuis di sini..."
                            required
                          />
                        </div>

                        {/* Opsi Pilihan Ganda */}
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 block">Opsi Pilihan (Centang Opsi yang Benar)</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2 bg-white border-2 border-black p-2">
                                <input 
                                  type="radio"
                                  name={`correct-${qIdx}`}
                                  checked={q.correctIndex === oIdx}
                                  onChange={() => handleCorrectIndexChange(qIdx, oIdx)}
                                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                                />
                                <input 
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                  className="w-full border-b border-transparent focus:border-black font-bold text-xs uppercase outline-none"
                                  placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`}
                                  required
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
