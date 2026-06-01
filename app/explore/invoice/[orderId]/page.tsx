"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { 
  ChevronLeft, Printer, ShieldCheck, Ticket, Calendar, MapPin, 
  User, CreditCard, Receipt, RefreshCw, AlertCircle, CheckCircle2, Clock, XCircle,
  Home
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const PRINT_STYLES = `
  @media print {
    /* Set page margins to be clean */
    @page {
      margin: 20mm;
    }
    
    body { 
      background: white !important; 
      color: #0f172a !important; 
      font-size: 12px !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Force light mode styles in print even if browser has dark mode class active */
    html.dark body, body.dark {
      background: white !important;
      color: #0f172a !important;
    }
    
    .no-print { 
      display: none !important; 
    }
    
    .print-container { 
      border: none !important; 
      box-shadow: none !important; 
      padding: 0 !important; 
      margin: 0 auto !important; 
      max-width: 100% !important; 
    }
    
    .print-card { 
      background: white !important;
      color: #0f172a !important;
      border: 8px solid #0f172a !important; 
      box-shadow: 12px 12px 0px 0px #000 !important; 
      margin: 0 auto !important; 
      padding: 40px !important; 
      max-width: 800px !important;
      border-radius: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      page-break-inside: avoid !important;
    }

    /* Preserve Neo-Brutalist elements in print */
    .print-card div, 
    .print-card table, 
    .print-card tr, 
    .print-card td, 
    .print-card th,
    .print-card span,
    .print-card p {
      color: #0f172a !important;
      border-color: #0f172a !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Specific element adjustments for printing ink and design accuracy */
    .print-card .bg-slate-900,
    .print-card th.bg-slate-900 {
      background-color: #0f172a !important;
      color: white !important;
    }
    .print-card .text-white {
      color: white !important;
    }
    .print-card .bg-slate-50 {
      background-color: #f8fafc !important;
    }
    .print-card .bg-[#FCFAF1] {
      background-color: #FCFAF1 !important;
    }
    .print-card .text-[#6D4AFF] {
      color: #6D4AFF !important;
    }
    .print-card .text-red-500 {
      color: #ef4444 !important;
    }
    .print-card .text-emerald-600 {
      color: #059669 !important;
    }
    .print-card .text-amber-600 {
      color: #d97706 !important;
    }
  }
`;

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = PRINT_STYLES;
    document.head.appendChild(styleEl);
    fetchInvoice();
    return () => { document.head.removeChild(styleEl); };
  }, [orderId]);

  const fetchInvoice = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`/api/payment/invoice/${orderId}`, {
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Gagal memuat invoice.");
      }
      setInvoice(data.invoice);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(dateString));
    } catch { return dateString; }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-[#FCFAF1] dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 ${poppins.className}`}>
        <div className="w-16 h-16 border-8 border-slate-900 dark:border-zinc-700 border-t-amber-400 animate-spin" />
        <p className="font-black italic uppercase tracking-widest text-slate-500 dark:text-zinc-400 animate-pulse">Mempersiapkan Struk...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className={`min-h-screen bg-[#FCFAF1] dark:bg-zinc-950 flex flex-col items-center justify-center p-4 ${poppins.className}`}>
        <div className="bg-white dark:bg-zinc-900 border-8 border-slate-900 dark:border-zinc-700 p-8 max-w-md w-full text-center shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color,#6D4AFF)]">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-black italic uppercase -skew-x-6 tracking-tighter mb-2 text-slate-900 dark:text-zinc-50">TERJADI KESALAHAN</h2>
          <p className="font-bold text-slate-500 dark:text-zinc-400 text-sm mb-6 uppercase tracking-wider">{error || "Data invoice tidak ditemukan."}</p>
          <div className="flex flex-col gap-3">
            <button onClick={fetchInvoice} className="w-full bg-amber-400 dark:bg-amber-500 border-4 border-slate-900 dark:border-zinc-700 text-slate-900 dark:text-zinc-950 py-3 font-black italic uppercase text-xs tracking-wider shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(109,74,255,0.4)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all flex items-center justify-center gap-2">
              <RefreshCw size={14} /> COBA LAGI
            </button>
            <button onClick={() => router.back()} className="w-full bg-white dark:bg-zinc-850 border-4 border-slate-900 dark:border-zinc-700 text-slate-900 dark:text-zinc-50 py-3 font-black italic uppercase text-xs tracking-wider shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(109,74,255,0.4)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all">
              KEMBALI
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status_pembayaran === "paid";
  const isPending = invoice.status_pembayaran === "pending";
  const isExpired = invoice.status_pembayaran === "expired" || invoice.status_pembayaran === "failed";
  const isFree = invoice.breakdown.total_bayar === 0;

  return (
    <div className={`min-h-screen bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 py-10 px-4 sm:px-6 md:px-12 transition-colors duration-300 ${poppins.className}`}>
      
      {/* Navigation */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 no-print">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => router.push("/explore")} 
            className="flex items-center gap-2 border-4 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-4 py-2.5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(109,74,255,0.4)] font-black italic uppercase text-xs tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all"
          >
            <Home size={14} strokeWidth={3} /> HALAMAN UTAMA
          </button>
          <button 
            onClick={() => router.push("/explore/tickets")} 
            className="flex items-center gap-2 border-4 border-slate-900 dark:border-zinc-700 bg-[#6D4AFF] text-white px-4 py-2.5 shadow-[4px_4px_0_0_#000] font-black italic uppercase text-xs tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all"
          >
            <Ticket size={14} strokeWidth={3} /> TIKET SAYA
          </button>
        </div>
        <button 
          onClick={() => window.print()} 
          className="flex items-center justify-center gap-2 border-4 border-slate-900 dark:border-zinc-700 bg-amber-400 dark:bg-amber-500 text-slate-900 dark:text-zinc-950 px-6 py-2.5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(109,74,255,0.4)] font-black italic uppercase text-xs tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all"
        >
          <Printer size={16} strokeWidth={3} /> CETAK STRUK
        </button>
      </div>

      <main className="max-w-4xl mx-auto print-container">
        <div className="bg-white dark:bg-zinc-900 border-8 border-slate-900 dark:border-zinc-700 p-6 sm:p-10 shadow-[12px_12px_0_0_#000] dark:shadow-[12px_12px_0_0_var(--primary-color,#6D4AFF)] print-card relative overflow-hidden transition-colors duration-300">
          
          {/* Status ribbon */}
          <div className="absolute top-0 right-0 w-36 h-36 overflow-hidden pointer-events-none no-print">
            {isPaid && <div className="bg-emerald-400 text-slate-900 font-black text-center text-[10px] uppercase py-1.5 rotate-45 translate-x-9 translate-y-8 border-2 border-slate-900 w-[160px]">LUNAS ✓</div>}
            {isPending && <div className="bg-amber-400 text-slate-900 font-black text-center text-[10px] uppercase py-1.5 rotate-45 translate-x-9 translate-y-8 border-2 border-slate-900 w-[160px] animate-pulse">PENDING ⏳</div>}
            {isExpired && <div className="bg-red-500 text-white font-black text-center text-[10px] uppercase py-1.5 rotate-45 translate-x-9 translate-y-8 border-2 border-slate-900 w-[160px]">BATAL ✗</div>}
          </div>

          {/* ─── HEADER ─── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b-8 border-slate-900 dark:border-zinc-700 pb-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-[#6D4AFF] p-1.5 border-2 border-slate-900 dark:border-zinc-700 shadow-[2px_2px_0_0_#000] -rotate-6">
                  <Ticket className="text-amber-400" size={18} strokeWidth={3} />
                </div>
                <span className="text-3xl font-black italic uppercase tracking-tighter -skew-x-12 text-slate-900 dark:text-zinc-50">TIKETIN.</span>
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest italic">BUKTI PEMBAYARAN RESMI / INVOICE</p>
            </div>
            <div className="text-left sm:text-right font-black uppercase italic text-xs space-y-1">
              <p><span className="text-slate-400 dark:text-zinc-500">ORDER ID:</span> <span className="bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-100 px-2 py-0.5 font-mono text-sm not-italic shadow-[2px_2px_0_0_#6D4AFF] dark:shadow-[2px_2px_0_0_rgba(109,74,255,0.4)]">{invoice.order_id}</span></p>
              <p><span className="text-slate-400 dark:text-zinc-500">TGL TRANSAKSI:</span> <span className="text-slate-900 dark:text-zinc-100">{formatDate(invoice.transaction_time || invoice.created_at)}</span></p>
              <p>
                <span className="text-slate-400 dark:text-zinc-500">STATUS:</span>{" "}
                {isPaid && <span className="text-emerald-600 dark:text-emerald-400 font-black">● LUNAS</span>}
                {isPending && <span className="text-amber-600 dark:text-amber-400 font-black animate-pulse">● MENUNGGU</span>}
                {isExpired && <span className="text-red-600 dark:text-red-400 font-black">● BATAL</span>}
              </p>
            </div>
          </div>

          {/* ─── INFO CARDS ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left uppercase font-bold text-xs">
            <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 border-4 border-slate-900 dark:border-zinc-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(109,74,255,0.4)] space-y-2">
              <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500"><CreditCard size={13} /><span className="font-black">METODE BAYAR</span></div>
              <p className="font-black text-sm italic text-[#6D4AFF] dark:text-purple-400">{isFree ? "GRATIS" : invoice.payment_method}</p>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 border-4 border-slate-900 dark:border-zinc-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(109,74,255,0.4)] space-y-2">
              <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500"><ShieldCheck size={13} /><span className="font-black">MIDTRANS TX ID</span></div>
              <p className="font-mono text-[9px] break-all select-all font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800/70 px-1 py-0.5">{invoice.midtrans_transaction_id}</p>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 border-4 border-slate-900 dark:border-zinc-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(109,74,255,0.4)] space-y-2">
              <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500"><User size={13} /><span className="font-black">PELANGGAN</span></div>
              <p className="font-black text-sm text-slate-900 dark:text-zinc-100 leading-tight truncate">{invoice.buyer.name}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 truncate lowercase">{invoice.buyer.email}</p>
            </div>
          </div>

          {/* ─── EVENT DETAILS ─── */}
          <div className="border-4 border-slate-900 dark:border-zinc-700 p-5 bg-[#FCFAF1] dark:bg-zinc-950/40 mb-8 shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_rgba(109,74,255,0.4)]">
            <h3 className="text-base font-black italic uppercase -skew-x-3 mb-4 text-[#6D4AFF] dark:text-purple-400 border-b-2 border-dashed border-slate-900 dark:border-zinc-700 pb-2 flex items-center gap-2">
              <Calendar size={14} /> RINCIAN EVENT
            </h3>
            <div className="flex flex-col sm:flex-row gap-5">
              {invoice.event.image_url && (
                <div className="w-full sm:w-28 h-24 border-2 border-slate-900 dark:border-zinc-700 shadow-[3px_3px_0_0_#000] overflow-hidden shrink-0 no-print">
                  <img src={invoice.event.image_url} alt="Poster" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="space-y-2 uppercase font-bold text-xs flex-grow text-left">
                <p className="text-xl font-black italic -skew-x-2 text-slate-900 dark:text-zinc-50 leading-none mb-2">{invoice.event.title}</p>
                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-450"><Calendar size={12} className="text-slate-900 dark:text-zinc-100 shrink-0" /><span>{invoice.event.date}</span></div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-450"><MapPin size={12} className="text-slate-900 dark:text-zinc-100 shrink-0" /><span className="break-words">{invoice.event.location}</span></div>
              </div>
            </div>
          </div>

          {/* ─── TICKET TABLE ─── */}
          <div className="border-4 border-slate-900 dark:border-zinc-700 mb-8 overflow-hidden shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_rgba(109,74,255,0.4)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 dark:bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="p-4">DESKRIPSI TIKET</th>
                  <th className="p-4 text-center">QTY</th>
                  <th className="p-4 text-right">HARGA/PCS</th>
                  <th className="p-4 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200 dark:divide-zinc-800 font-bold uppercase text-xs">
                <tr className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">
                  <td className="p-4">
                    <p className="font-black italic text-sm text-slate-900 dark:text-zinc-100">{invoice.ticket.category_name}</p>
                    <p className="text-[9px] text-slate-400 dark:text-zinc-500 tracking-wider">OFFICIAL ELECTRONIC TICKET</p>
                  </td>
                  <td className="p-4 text-center font-black text-sm">{invoice.ticket.qty}</td>
                  <td className="p-4 text-right">{formatRupiah(invoice.ticket.price)}</td>
                  <td className="p-4 text-right font-black text-sm">{formatRupiah(invoice.breakdown.original_subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ─── BOTTOM: QR + BILLING BREAKDOWN ─── */}
          <div className="flex flex-col md:flex-row justify-between items-stretch gap-8 pt-2">
            
            {/* QR Code & Verified */}
            <div className="flex-1 flex flex-row items-center gap-5 border-4 border-slate-900 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/40 p-4 shadow-[4px_4px_0_0_#6D4AFF]">
              <div className="bg-white p-2 border-2 border-slate-900 dark:border-zinc-700 shadow-[2px_2px_0_0_#000] shrink-0">
                <QRCodeSVG value={invoice.order_id} size={76} />
              </div>
              <div className="text-left">
                <p className="font-black italic text-xs uppercase tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" strokeWidth={3} /> VERIFIED RECEIPT
                </p>
                <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-tight mt-1 leading-normal">
                  Struk ini diterbitkan otomatis oleh sistem Tiketin.id dan merupakan bukti transaksi yang sah.
                </p>
              </div>
            </div>

            {/* Billing Breakdown */}
            <div className="w-full md:w-80 space-y-2.5 font-bold uppercase text-xs text-left">
              
              {/* Subtotal asli */}
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>SUBTOTAL ({invoice.ticket.qty} TIKET)</span>
                <span>{formatRupiah(invoice.breakdown.original_subtotal)}</span>
              </div>

              {/* Diskon Voucher */}
              {invoice.breakdown.discount > 0 && (
                <div className="flex justify-between text-red-500 dark:text-red-400 font-black">
                  <span>DISKON {invoice.breakdown.voucher_code ? `(${invoice.breakdown.voucher_code})` : ""}</span>
                  <span>- {formatRupiah(invoice.breakdown.discount)}</span>
                </div>
              )}

              {/* Subtotal setelah diskon */}
              {invoice.breakdown.discount > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-zinc-400 border-t border-dashed border-slate-300 dark:border-zinc-700 pt-1">
                  <span>SETELAH DISKON</span>
                  <span>{formatRupiah(invoice.breakdown.after_discount)}</span>
                </div>
              )}

              {/* PPN & Platform fee — hanya transaksi berbayar */}
              {invoice.breakdown.total_bayar > 0 && (
                <>
                  <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                    <span>PPN (11%)</span>
                    <span>{formatRupiah(invoice.breakdown.tax)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-zinc-400 border-b-2 border-dashed border-slate-300 dark:border-zinc-700 pb-3">
                    <span>BIAYA LAYANAN / PLATFORM</span>
                    <span>{formatRupiah(invoice.breakdown.platform_fee)}</span>
                  </div>
                </>
              )}

              {/* GRAND TOTAL */}
              <div className="flex justify-between items-end pt-1">
                <div>
                  <p className="text-[9px] font-black text-slate-400 dark:text-zinc-500 tracking-wider">TOTAL BAYAR</p>
                  <p className="text-2xl font-black italic text-[#6D4AFF] dark:text-purple-400 tracking-tighter leading-none">
                    {formatRupiah(invoice.breakdown.total_bayar)}
                  </p>
                  {invoice.breakdown.total_bayar > 0 && (
                    <p className="text-[8px] text-slate-400 dark:text-zinc-550 font-bold mt-0.5">Sudah termasuk PPN 11% + biaya platform</p>
                  )}
                </div>
                {isPaid && <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-2 border-emerald-500 px-3 py-1 font-black italic text-[10px] tracking-wider shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#10B981]">LUNAS</span>}
                {isPending && <span className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-2 border-amber-500 px-3 py-1 font-black italic text-[10px] tracking-wider shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#F59E0B] animate-pulse">PENDING</span>}
                {isExpired && <span className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-2 border-red-500 px-3 py-1 font-black italic text-[10px] tracking-wider shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#EF4444]">BATAL</span>}
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 no-print border-t-4 border-dashed border-slate-900 dark:border-zinc-700 pt-6">
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => router.push("/explore")} 
                className="flex items-center gap-2 border-4 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-4 py-2.5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(109,74,255,0.4)] font-black italic uppercase text-xs tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all"
              >
                <Home size={14} strokeWidth={3} /> HALAMAN UTAMA
              </button>
              <button 
                onClick={() => router.push("/explore/tickets")} 
                className="flex items-center gap-2 border-4 border-slate-900 dark:border-zinc-700 bg-[#6D4AFF] text-white px-4 py-2.5 shadow-[4px_4px_0_0_#000] font-black italic uppercase text-xs tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all"
              >
                <Ticket size={14} strokeWidth={3} /> TIKET SAYA
              </button>
            </div>
            <button 
              onClick={() => window.print()} 
              className="flex items-center justify-center gap-2 border-4 border-slate-900 dark:border-zinc-700 bg-amber-400 dark:bg-amber-500 text-slate-900 dark:text-zinc-950 px-6 py-2.5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(109,74,255,0.4)] font-black italic uppercase text-xs tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all"
            >
              <Printer size={16} strokeWidth={3} /> CETAK STRUK
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
