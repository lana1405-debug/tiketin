"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Poppins } from "next/font/google";
import { Zap, ShieldCheck, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "900"] });

export default function GateScanner() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [passkey, setPasskey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [scanStatus, setScanStatus] = useState<{status: 'idle' | 'success' | 'warning' | 'error', msg: string}>({status: 'idle', msg: ''});
  const [isUnlocking, setIsUnlocking] = useState(false);

  const scanLock = useRef(false);

  const handleUnlock = async () => {
    if (!passkey) {
      alert("Isi dulu passkey-nya, ");
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
        startScanner();
      } else {
        alert("PASSKEY SALAH,  Coba inget-inget lagi.");
      }
    } catch (err: any) {
      console.error("Gagal unlock:", err);
      alert("ERROR DATABASE: " + err.message);
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
      // 1. Ambil data tiket dulu buat ngecek status aslinya
      const { data: ticket, error: fetchError } = await supabase
        .from("tiket")
        .select("status_checkin")
        .eq("ticket_code", decodedText)
        .eq("event_id", eventId)
        .single();

      if (fetchError || !ticket) {
        // TIKET GAK ADA DI DATABASE (MERAH)
        setScanStatus({ status: 'error', msg: "TIKET TIDAK VALID / PALSU!" });
      } else if (ticket.status_checkin === true) {
        // TIKET SUDAH PERNAH DI SCAN (KUNING)
        setScanStatus({ status: 'warning', msg: "PERINGATAN: TIKET SUDAH PERNAH DIGUNAKAN!" });
      } else {
        // TIKET VALID & BELUM MASUK (HIJAU)
        const { error: updateError } = await supabase
          .from("tiket")
          .update({ status_checkin: true })
          .eq("ticket_code", decodedText);

        if (updateError) throw updateError;
        setScanStatus({ status: 'success', msg: `BERHASIL! SILAKAN MASUK.` });
      }
    } catch (err: any) {
      console.error("Error scan:", err);
      setScanStatus({ status: 'error', msg: "KONEKSI BERMASALAH!" });
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
      <div className="max-w-xl mx-auto space-y-8 pt-10">
        
        <div className="text-center space-y-2">
          <div className="inline-block bg-[#6D4AFF] p-3 border-4 border-slate-900 -rotate-6 shadow-[4px_4px_0_0_#000]">
            <Zap className="text-amber-400" size={32} strokeWidth={3} />
          </div>
          <h1 className="text-4xl font-black italic uppercase -skew-x-6">GATE SYSTEM</h1>
          <p className="font-bold text-slate-500 uppercase text-xs tracking-widest">SCANNER ARENA</p>
        </div>

        {!isAuthorized ? (
          <div className="bg-white border-8 border-slate-900 p-8 shadow-[12px_12px_0_0_#000] space-y-6">
            <div className="space-y-2 text-center">
              <ShieldCheck className="mx-auto text-[#6D4AFF]" size={48} />
              <h2 className="text-xl font-black italic uppercase">STAFF ONLY</h2>
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
          <div className="space-y-6">
            <div id="reader" className="w-full min-h-[300px] bg-white border-8 border-slate-900 shadow-[12px_12px_0_0_#6D4AFF]"></div>
            
            {/* LOGIKA WARNA NOTIFIKASI BARU */}
            {scanStatus.msg && (
              <div className={`p-6 border-4 border-slate-900 font-black italic uppercase flex items-center gap-4 animate-bounce ${
                scanStatus.status === 'success' 
                  ? 'bg-emerald-400' 
                  : scanStatus.status === 'warning'
                    ? 'bg-amber-400' 
                    : scanStatus.status === 'error'
                      ? 'bg-red-500 text-white'
                      : 'bg-white'
              }`}>
                {scanStatus.status === 'success' && <CheckCircle2 size={32} />}
                {scanStatus.status === 'warning' && <AlertCircle size={32} />}
                {scanStatus.status === 'error' && <XCircle size={32} />}
                <span className="text-lg leading-tight">{scanStatus.msg}</span>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white p-4 font-black uppercase italic shadow-[4px_4px_0_0_#6D4AFF]"
            >
              RESET SCANNER
            </button>
          </div>
        )}
      </div>
    </div>
  );
}