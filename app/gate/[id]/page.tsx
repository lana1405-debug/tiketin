"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import { Zap, ShieldCheck, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast-brutal";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "700", "900"] });

interface ScanLogItem {
  id: string;
  time: string;
  code: string;
  category: string;
  status: 'success' | 'warning' | 'error';
  msg: string;
}

export default function GateScanner() {
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  
  const [passkey, setPasskey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [scanStatus, setScanStatus] = useState<{status: 'idle' | 'success' | 'warning' | 'error', msg: string}>({status: 'idle', msg: ''});
  const [isUnlocking, setIsUnlocking] = useState(false);

  // ⚡ Live stats & Log states
  const [stats, setStats] = useState({ checkedIn: 0, total: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const [scanLog, setScanLog] = useState<ScanLogItem[]>([]);

  const scanLock = useRef(false);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      // 1. Ambil total checked in
      const { count: checkedInCount, error: err1 } = await supabase
        .from("tiket")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status_checkin", true);

      if (err1) throw err1;

      // 2. Ambil total tiket terjual
      const { count: totalCount, error: err2 } = await supabase
        .from("tiket")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId);

      if (err2) throw err2;

      setStats({
        checkedIn: checkedInCount || 0,
        total: totalCount || 0
      });
    } catch (err) {
      console.error("Gagal mengambil statistik check-in:", err);
    } finally {
      setLoadingStats(false);
    }
  }, [eventId]);

  const handleUnlock = async () => {
    if (!passkey) {
      toast("Isi dulu passkey-nya, Man!", "warning");
      return;
    }

    setIsUnlocking(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("gate_passkey")
        .eq("id", eventId)
        .single();
        
      if (error) throw error;

      if (data && data.gate_passkey === passkey) {
        setIsAuthorized(true);
        toast("Kunci Gate Terbuka! Kamera Diaktifkan. 🚀", "success");
        fetchStats();
        startScanner();
      } else {
        toast("PASSKEY SALAH, Coba inget-inget lagi.", "error");
      }
    } catch (err: any) {
      console.error("Gagal unlock:", err);
      toast("ERROR DATABASE: " + err.message, "error");
    } finally {
      setIsUnlocking(false);
    }
  };

  const startScanner = () => {
    setTimeout(async () => {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");
        const scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            videoConstraints: { facingMode: "environment" }
          },
          false
        );
        scanner.render(onScanSuccess, (err) => {});
      } catch (error) {
        console.error("Gagal buka kamera:", error);
      }
    }, 500);
  };

  const onScanSuccess = async (decodedText: string) => {
    if (scanLock.current) return;
    scanLock.current = true;

    setScanStatus({ status: 'idle', msg: 'MENGECEK DATABASE...' });

    try {
      // 1. Ambil data tiket beserta tanggal mulai & selesai event
      const { data: ticket, error: fetchError } = await supabase
        .from("tiket")
        .select(`
          id, 
          status_checkin, 
          last_scanned_date, 
          seat_info,
          events (
            date,
            end_date
          )
        `)
        .eq("ticket_code", decodedText)
        .eq("event_id", eventId)
        .single();

      if (fetchError || !ticket) {
        const errorMsg = "TIKET TIDAK VALID / PALSU!";
        setScanStatus({ status: 'error', msg: errorMsg });
        
        // Catat ke log scan
        const logItem: ScanLogItem = {
          id: `${Date.now()}-${Math.random()}`,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          code: decodedText,
          category: "TIDAK VALID",
          status: 'error',
          msg: "PALSU / SALAH EVENT"
        };
        setScanLog((prev) => [logItem, ...prev.slice(0, 4)]);
        toast("Scan gagal: " + errorMsg, "error");
        return;
      }

      // Format tanggal lokal (YYYY-MM-DD)
      const getLocalDateString = (d: Date = new Date()) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Helper function tambah hari menggunakan tanggal lokal
      const addDays = (dateStr: string, days: number): string => {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + days);
        return getLocalDateString(date);
      };

      // Format tanggal hari ini (YYYY-MM-DD)
      const hariIni = getLocalDateString();
      const seatUpper = (ticket.seat_info || "").toUpperCase();

      // Gunakan Regex /(?:DAY|HARI)\s*([1-9])/ untuk parsing hari harian secara dinamis
      const match = seatUpper.match(/(?:DAY|HARI)\s*([1-9])/);
      const specificDayNum = match ? parseInt(match[1]) : null;
      const isDaySpecific = specificDayNum !== null;

      // Multi-day pass if it contains DAY/TERUSAN/PASS but is NOT a specific single day pass
      const isMultiDayPass = 
        (seatUpper.includes("DAY") || 
         seatUpper.includes("TERUSAN") || 
         seatUpper.includes("PASS")) && !isDaySpecific;

      // ⚡ LOGIKA PEMBATASAN TANGGAL SINGLE-DAY TIKET SPESIFIK
      let restrictedDate: string | null = null;
      if (isDaySpecific && (ticket.events as any)?.date) {
        restrictedDate = addDays((ticket.events as any).date, specificDayNum - 1);
      }

      if (restrictedDate && hariIni !== restrictedDate) {
        const errorMsg = `VALID UNTUK HARI ${specificDayNum} (${restrictedDate})!`;
        setScanStatus({ 
          status: 'error', 
          msg: `TIKET HANYA VALID UNTUK HARI ${specificDayNum} (TGL: ${restrictedDate})! HARI INI: ${hariIni}` 
        });
        
        // Catat ke log scan
        const logItem: ScanLogItem = {
          id: `${Date.now()}-${Math.random()}`,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          code: decodedText,
          category: ticket.seat_info,
          status: 'error',
          msg: errorMsg
        };
        setScanLog((prev) => [logItem, ...prev.slice(0, 4)]);
        toast("Scan gagal: " + errorMsg, "error");
        return;
      }

      // ⚡ LOGIKA PERCABANGAN (SINGLE-DAY vs MULTI-DAY)
      if (isMultiDayPass) {
        // TIKET TERUSAN (MULTI-DAY PASS)
        if (ticket.status_checkin === true) {
          const warnMsg = "TIKET SUDAH HANGUS / DIPAKAI!";
          setScanStatus({ status: 'warning', msg: `PERINGATAN: ${warnMsg}` });
          
          const logItem: ScanLogItem = {
            id: `${Date.now()}-${Math.random()}`,
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            code: decodedText,
            category: ticket.seat_info,
            status: 'warning',
            msg: "TERPAKAI"
          };
          setScanLog((prev) => [logItem, ...prev.slice(0, 4)]);
          toast(warnMsg, "warning");
        } else if (ticket.last_scanned_date === hariIni) {
          // Udah masuk hari ini
          const warnMsg = "SUDAH CHECK-IN HARI INI!";
          setScanStatus({ status: 'warning', msg: `${warnMsg} 1 TIKET 1 ORANG.` });

          const logItem: ScanLogItem = {
            id: `${Date.now()}-${Math.random()}`,
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            code: decodedText,
            category: ticket.seat_info,
            status: 'warning',
            msg: "DUPLIKAT HARI INI"
          };
          setScanLog((prev) => [logItem, ...prev.slice(0, 4)]);
          toast(warnMsg, "warning");
        } else {
          // Boleh masuk -> Update last_scanned_date jadi hari ini
          // Jika hari ini adalah hari terakhir event atau setelahnya, set status_checkin = true
          const lastDayOfEvent = (ticket.events as any)?.end_date || (ticket.events as any)?.date;
          const isLastDayOrLater = lastDayOfEvent ? hariIni >= lastDayOfEvent : true;

          const updatePayload: any = { 
            last_scanned_date: hariIni,
            checked_in_at: new Date().toISOString()
          };
          if (isLastDayOrLater) {
            updatePayload.status_checkin = true;
          }

          const { error: updateError } = await supabase
            .from("tiket")
            .update(updatePayload)
            .eq("id", ticket.id);

          if (updateError) throw updateError;
          
          const successMsg = `BERHASIL! (MULTI-DAY PASS${isLastDayOrLater ? ' - HARI H' : ''})`;
          setScanStatus({ 
            status: 'success', 
            msg: successMsg
          });

          const logItem: ScanLogItem = {
            id: `${Date.now()}-${Math.random()}`,
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            code: decodedText,
            category: ticket.seat_info,
            status: 'success',
            msg: isLastDayOrLater ? "BERHASIL (FINAL)" : "BERHASIL (OK)"
          };
          setScanLog((prev) => [logItem, ...prev.slice(0, 4)]);
          toast("Check-in sukses!", "success");
          fetchStats();
        }
      } else {
        // TIKET NORMAL (DAILY PASS)
        if (ticket.status_checkin === true) {
          const warnMsg = "TIKET SUDAH HANGUS / DIPAKAI!";
          setScanStatus({ status: 'warning', msg: `PERINGATAN: ${warnMsg}` });

          const logItem: ScanLogItem = {
            id: `${Date.now()}-${Math.random()}`,
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            code: decodedText,
            category: ticket.seat_info,
            status: 'warning',
            msg: "SUDAH CHECK-IN"
          };
          setScanLog((prev) => [logItem, ...prev.slice(0, 4)]);
          toast(warnMsg, "warning");
        } else {
          const { error: updateError } = await supabase
            .from("tiket")
            .update({ 
              status_checkin: true,
              checked_in_at: new Date().toISOString()
            })
            .eq("id", ticket.id);

          if (updateError) throw updateError;
          
          setScanStatus({ status: 'success', msg: `BERHASIL! SILAKAN MASUK.` });

          const logItem: ScanLogItem = {
            id: `${Date.now()}-${Math.random()}`,
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            code: decodedText,
            category: ticket.seat_info,
            status: 'success',
            msg: "BERHASIL (OK)"
          };
          setScanLog((prev) => [logItem, ...prev.slice(0, 4)]);
          toast("Check-in sukses! Selamat menikmati event.", "success");
          fetchStats();
        }
      }
    } catch (err: any) {
      console.error("Error scan:", err);
      setScanStatus({ status: 'error', msg: "KONEKSI BERMASALAH!" });
      toast("Koneksi bermasalah: " + err.message, "error");
    } finally {
      // Cooldown 3 detik biar gak spam
      setTimeout(() => {
        scanLock.current = false;
        setScanStatus({ status: 'idle', msg: '' });
      }, 3000);
    }
  };

  return (
    <div className={`min-h-screen bg-[#FCFAF1] text-slate-900 p-6 ${poppins.className}`}>
      <div className="max-w-4xl mx-auto space-y-8 pt-10">
        
        <div className="text-center space-y-2">
          <div className="inline-block bg-[#6D4AFF] p-3 border-4 border-slate-900 -rotate-6 shadow-[4px_4px_0_0_#000]">
            <Zap className="text-amber-400" size={32} strokeWidth={3} />
          </div>
          <h1 className="text-4xl font-black italic uppercase -skew-x-6">GATE SYSTEM</h1>
          <p className="font-bold text-slate-500 uppercase text-xs tracking-widest">LIVE EVENT CHECK-IN SCANNER</p>
        </div>

        {!isAuthorized ? (
          <div className="max-w-xl mx-auto bg-white border-8 border-slate-900 p-8 shadow-[12px_12px_0_0_#000] space-y-6">
            <div className="space-y-2 text-center">
              <ShieldCheck className="mx-auto text-[#6D4AFF]" size={48} />
              <h2 className="text-xl font-black italic uppercase">STAFF ACCESS ONLY</h2>
              <p className="text-xs font-bold text-slate-400 uppercase">Input Gate Passkey</p>
            </div>
            <input 
              type="password"
              placeholder="ENTER PASSKEY"
              className="w-full p-4 border-4 border-slate-900 font-black text-center text-2xl uppercase outline-none focus:bg-amber-50"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              disabled={isUnlocking}
            />
            <button 
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="w-full bg-amber-400 border-4 border-slate-900 p-4 font-black uppercase italic shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:translate-y-1 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isUnlocking ? <Loader2 className="animate-spin" size={20} /> : "UNLOCK SCANNER"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* LEFT: SCANNER BOX */}
            <div className="space-y-6">
              <div id="reader" className="w-full min-h-[300px] bg-white border-8 border-slate-900 shadow-[8px_8px_0_0_rgba(0,0,0,1)]"></div>
              
              {scanStatus.msg && (
                <div className={`p-6 border-4 border-slate-900 font-black italic uppercase flex items-center gap-4 animate-pulse ${
                  scanStatus.status === 'success' 
                    ? 'bg-emerald-400 text-black' 
                    : scanStatus.status === 'warning'
                      ? 'bg-amber-400 text-black' 
                      : scanStatus.status === 'error'
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-black'
                }`}>
                  {scanStatus.status === 'success' && <CheckCircle2 size={32} strokeWidth={3} />}
                  {scanStatus.status === 'warning' && <AlertCircle size={32} strokeWidth={3} />}
                  {scanStatus.status === 'error' && <XCircle size={32} strokeWidth={3} />}
                  <span className="text-xs sm:text-sm leading-tight">{scanStatus.msg}</span>
                </div>
              )}
              
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-slate-900 text-white p-4 font-black uppercase italic shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-slate-800 transition-colors"
              >
                RESET SCANNER
              </button>
            </div>

            {/* RIGHT: STATS & LOGS */}
            <div className="space-y-6">
              {/* STATS PANEL */}
              <div className="bg-white border-8 border-slate-900 p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-left">
                <div className="bg-black text-white px-3 py-1 inline-block -skew-x-12 mb-4">
                  <h3 className="font-black italic uppercase text-xs">GATE LIVE STATS</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CHECK-IN RATE</p>
                      <p className="text-4xl font-black italic -skew-x-3 text-[#6D4AFF]">
                        {stats.checkedIn} <span className="text-slate-400 text-xl font-normal normal-case">/</span> {stats.total}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PERSENTASE</p>
                      <p className="text-2xl font-black text-emerald-500">
                        {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar brutalist */}
                  <div className="w-full h-8 bg-slate-100 border-4 border-slate-900 relative overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400 border-r-4 border-slate-900 transition-all duration-500" 
                      style={{ width: `${stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* LOG PANEL */}
              <div className="bg-white border-8 border-slate-900 p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-left flex flex-col min-h-[250px]">
                <div className="bg-[#6D4AFF] text-white px-3 py-1 inline-block -skew-x-12 mb-4 self-start">
                  <h3 className="font-black italic uppercase text-xs">LOG SCAN TERAKHIR</h3>
                </div>

                {scanLog.length > 0 ? (
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[240px]">
                    {scanLog.map((log) => (
                      <div key={log.id} className="flex justify-between items-center border-2 border-slate-900 p-2 text-xs">
                        <div className="text-left">
                          <span className="font-mono bg-slate-100 border border-slate-300 px-1 py-0.5 mr-1 font-bold">{log.time}</span>
                          <span className="font-black uppercase italic text-[10px] text-[#6D4AFF]">{log.category}</span>
                          <p className="font-mono text-[9px] text-slate-400 uppercase truncate max-w-[120px]">{log.code}</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-black italic uppercase text-[9px] px-1.5 py-0.5 border border-slate-900 ${
                            log.status === 'success' 
                              ? 'bg-emerald-400 text-black' 
                              : log.status === 'warning' 
                                ? 'bg-amber-400 text-black' 
                                : 'bg-red-500 text-white'
                          }`}>
                            {log.msg}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-300 p-8">
                    <p className="font-black italic text-xs text-slate-300 uppercase">BELUM ADA SCAN TIKET MASUK</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}