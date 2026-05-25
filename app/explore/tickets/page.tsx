"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, ChevronLeft, Calendar, MapPin,
  Download, ShieldCheck, Zap, Ticket as TicketIcon, Loader2, CreditCard, Star, Clock, X,
  MessageSquare, Trophy, Receipt, Share2, AlertCircle, User
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/components/ui/toast-brutal";
import NotificationBell from "@/components/NotificationBell";
import ChatDrawer from "@/components/ChatDrawer";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const GLOBAL_STYLES = `
  .noise::after {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:999; opacity:.04;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }
  .brutal-shadow-card {
    box-shadow: 6px 6px 0px 0px #6D4AFF, 12px 12px 0px 0px #000, 18px 18px 0px 0px #FBBF24 !important;
    transition: all 0.3s ease;
  }
  .brutal-shadow-card:hover {
    box-shadow: 8px 8px 0px 0px #FBBF24, 16px 16px 0px 0px #000, 24px 24px 0px 0px #6D4AFF !important;
    transform: translate(-4px, -4px);
  }
  .dark .brutal-shadow-card {
    box-shadow: 6px 6px 0px 0px var(--primary-color, #6D4AFF), 12px 12px 0px 0px #fff, 18px 18px 0px 0px #FBBF24 !important;
  }
  .dark .brutal-shadow-card:hover {
    box-shadow: 8px 8px 0px 0px #FBBF24, 16px 16px 0px 0px #fff, 24px 24px 0px 0px var(--primary-color, #6D4AFF) !important;
  }
  .ticket-stub-divider {
    background-image: linear-gradient(to bottom, #0f172a 50%, transparent 50%);
    background-size: 4px 16px;
    background-repeat: repeat-y;
  }
  .dark .ticket-stub-divider {
    background-image: linear-gradient(to bottom, #fff 50%, transparent 50%);
  }
  .ticket-stub-divider-horizontal {
    background-image: linear-gradient(to right, #0f172a 50%, transparent 50%);
    background-size: 16px 4px;
    background-repeat: repeat-x;
  }
  .dark .ticket-stub-divider-horizontal {
    background-image: linear-gradient(to right, #fff 50%, transparent 50%);
  }
`;

// ─── Countdown Hook ──────────────────────────────────────────────────────────
function useCountdown(targetDateStr: string) {
  const calculate = useCallback(() => {
    const now = new Date().getTime();
    const target = new Date(targetDateStr + "T00:00:00").getTime();
    const diff = target - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds };
  }, [targetDateStr]);

  const [countdown, setCountdown] = useState(calculate);

  useEffect(() => {
    setCountdown(calculate());
    const interval = setInterval(() => setCountdown(calculate()), 1000);
    return () => clearInterval(interval);
  }, [calculate]);

  return countdown;
}

// ─── Countdown Display ────────────────────────────────────────────────────────
function CountdownBadge({ dateStr }: { dateStr: string }) {
  const countdown = useCountdown(dateStr);
  if (!countdown) return null;

  return (
    <div className="flex items-center gap-1.5 bg-[#6D4AFF] border-2 border-slate-900 dark:border-zinc-700 px-3 py-1.5 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_var(--primary-color)] w-full">
      <Clock size={12} strokeWidth={3} className="text-amber-400 shrink-0" />
      <div className="flex gap-2 text-white">
        {countdown.days > 0 && (
          <span className="font-black italic text-[10px] uppercase">
            <span className="text-amber-400">{countdown.days}</span>H
          </span>
        )}
        <span className="font-black italic text-[10px] uppercase">
          <span className="text-amber-400">{String(countdown.hours).padStart(2,'0')}</span>j
        </span>
        <span className="font-black italic text-[10px] uppercase">
          <span className="text-amber-400">{String(countdown.minutes).padStart(2,'0')}</span>m
        </span>
        <span className="font-black italic text-[10px] uppercase">
          <span className="text-amber-400">{String(countdown.seconds).padStart(2,'0')}</span>d
        </span>
        <span className="font-black italic text-[10px] uppercase text-purple-200 ml-1">MENUJU HARI H</span>
      </div>
    </div>
  );
}

const stubVariants = {
  aktif: {
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    scale: 1,
  },
  tearing: {
    y: [0, -15, 300],
    x: [0, 10, 80],
    rotate: [0, -8, 25],
    opacity: [1, 1, 0],
    scale: [1, 1.05, 0.9],
    transition: {
      duration: 1.2,
      times: [0, 0.15, 1],
      ease: [0.25, 1, 0.5, 1] as any
    }
  }
};

export default function MyTicketsPage() {
  const router = useRouter();
  const today = getLocalDateString();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // ⚡ Tiga Tab Baru
  const [activeTab, setActiveTab] = useState("AKTIF"); // "PENDING", "AKTIF", "TERPAKAI"
  const [mounted, setMounted] = useState(false);
  const [isProcessingPay, setIsProcessingPay] = useState<string | null>(null);

  // ⚡ Cancel transaction states
  const [txToCancel, setTxToCancel] = useState<any | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // ⚡ State buat notifikasi check-in real-time
  const [scannedTicketNotification, setScannedTicketNotification] = useState<{
    isOpen: boolean;
    eventTitle: string;
    ticketCode: string;
    seatInfo: string;
    scanTime: string;
  } | null>(null);

  // ⚡ State untuk animasi sobek tiket real-time
  const [animatingTearId, setAnimatingTearId] = useState<string | null>(null);
  const [pendingNotification, setPendingNotification] = useState<{
    isOpen: boolean;
    eventTitle: string;
    ticketCode: string;
    seatInfo: string;
    scanTime: string;
    dbUpdate: {
      ticket_code: string;
      last_scanned_date: string | null;
      checked_in_at: string | null;
    };
  } | null>(null);

  const ticketsRef = useRef<any[]>([]);

  useEffect(() => {
    ticketsRef.current = tickets;
  }, [tickets]);

  // ⚡ STATE UNTUK REVIEW/ULASAN
  const [reviewedEvents, setReviewedEvents] = useState<Set<string>>(new Set());
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; eventId: string | null; eventTitle: string }>({
    isOpen: false,
    eventId: null,
    eventTitle: ""
  });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // ⚡ Group Chat States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatEventId, setChatEventId] = useState("");
  const [chatEventTitle, setChatEventTitle] = useState("");

  const handleOpenEventChat = (eventId: string, eventTitle: string) => {
    setChatEventId(eventId);
    setChatEventTitle(eventTitle);
    setChatOpen(true);
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(style);

    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
    const script = document.createElement("script");
    script.src = snapScript;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    document.head.appendChild(script);

    setMounted(true);
    
    // Set status offline di awal
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      toast("Kembali online! Mensinkronisasikan tiket... ⚡", "success", 3000);
      fetchUserAndTickets();
    };
    const handleOffline = () => {
      setIsOffline(true);
      toast("Koneksi terputus. Mode offline aktif. 📴", "warning", 3000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    fetchUserAndTickets();

    return () => { 
      document.head.removeChild(style); 
      document.head.removeChild(script);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!userProfile) return;

    // Subskripsi Real-time untuk Check-in tiket
    const channel = supabase
      .channel(`user-tickets-${userProfile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tiket"
        },
        (payload) => {
          const updatedTicket = payload.new;

          // Cari tiket lokal berdasarkan ticket_code
          const localTicket = ticketsRef.current.find(t => t.id === updatedTicket.ticket_code);

          // Jika status check-in berubah menjadi true dan sebelumnya belum terpakai di UI
          if (localTicket && localTicket.status !== "TERPAKAI" && updatedTicket.status_checkin === true) {
            const checkInDate = updatedTicket.checked_in_at ? new Date(updatedTicket.checked_in_at) : new Date();
            const scanTimeFormatted = checkInDate.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric"
            }) + " pukul " + checkInDate.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit"
            });

            // Simpan info notifikasi untuk dipicu setelah animasi sobek selesai
            setPendingNotification({
              isOpen: true,
              eventTitle: localTicket.title,
              ticketCode: localTicket.id,
              seatInfo: localTicket.seat,
              scanTime: scanTimeFormatted,
              dbUpdate: {
                ticket_code: updatedTicket.ticket_code,
                last_scanned_date: updatedTicket.last_scanned_date,
                checked_in_at: updatedTicket.checked_in_at
              }
            });

            // Mulai pemicu animasi sobek di UI
            setAnimatingTearId(updatedTicket.ticket_code);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile]);

  // Fungsi callback setelah karcis sobek selesai beranimasi
  const handleTearComplete = useCallback((ticketId: string) => {
    if (pendingNotification && pendingNotification.ticketCode === ticketId) {
      setScannedTicketNotification({
        isOpen: true,
        eventTitle: pendingNotification.eventTitle,
        ticketCode: pendingNotification.ticketCode,
        seatInfo: pendingNotification.seatInfo,
        scanTime: pendingNotification.scanTime
      });

      const { dbUpdate } = pendingNotification;

      // Update status karcis lokal ke TERPAKAI
      setTickets(prev =>
        prev.map(t =>
          t.id === dbUpdate.ticket_code
            ? { 
                ...t, 
                status: "TERPAKAI", 
                status_checkin: true, 
                last_scanned_date: dbUpdate.last_scanned_date, 
                checked_in_at: dbUpdate.checked_in_at 
              }
            : t
        )
      );

      // Reset state animasi
      setAnimatingTearId(null);
      setPendingNotification(null);

      toast("Karcis Anda berhasil disobek oleh petugas gate! 🎟️", "success", 4000);
    } else {
      setAnimatingTearId(null);
    }
  }, [pendingNotification, toast]);

  const fetchUserAndTickets = async () => {
    setIsLoading(true);
    
    if (!navigator.onLine) {
      const lastUserId = localStorage.getItem("tiketin_last_user_id");
      if (lastUserId) {
        const cachedProfile = localStorage.getItem(`tiketin_cached_profile_${lastUserId}`);
        const cachedTickets = localStorage.getItem(`tiketin_cached_tickets_${lastUserId}`);
        if (cachedProfile) setUserProfile(JSON.parse(cachedProfile));
        if (cachedTickets) setTickets(JSON.parse(cachedTickets));
        toast("Koneksi offline. Menampilkan tiket lokal. 📴", "warning", 3000);
      } else {
        toast("Kamu sedang offline dan tidak ada data tiket tersimpan di perangkat ini.", "error", 4000);
      }
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      localStorage.setItem("tiketin_last_user_id", session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        localStorage.setItem(`tiketin_cached_profile_${session.user.id}`, JSON.stringify(profile));
      }

      // Fetch user reviews
      const { data: userReviews } = await supabase
        .from("reviews")
        .select("event_id")
        .eq("user_id", session.user.id);

      const reviewedSet = new Set<string>();
      if (userReviews) {
        userReviews.forEach((r: any) => reviewedSet.add(r.event_id));
      }
      setReviewedEvents(reviewedSet);

      const { data: ticketData, error } = await supabase
        .from("tiket")
        .select(`
          id,
          ticket_code,
          seat_info,
          status_checkin,
          last_scanned_date,
          checked_in_at,
          events (
            id,
            title,
            date,
            end_date,
            location,
            category,
            image_url,
            price
          ),
          transaksi!inner (
            id,
            status_pembayaran,
            total_bayar,
            user_id
          )
        `)
        .eq("transaksi.user_id", session.user.id)
        .order("created_at", { ascending: false });

      const formattedTickets: any[] = [];

      if (!error && ticketData) {
        ticketData.forEach((t: any) => {
          let currentStatus = "AKTIF";
          if (t.status_checkin === true) {
            currentStatus = "TERPAKAI";
          }
          formattedTickets.push({
            id: t.ticket_code,
            event_id: t.events.id,
            transaksi_id: t.transaksi.id,
            title: t.events.title,
            date: t.events.date,
            end_date: t.events.end_date,
            location: t.events.location,
            category: t.events.category,
            price: t.transaksi.total_bayar,
            status: currentStatus,
            seat: t.seat_info || "GENERAL ADMISSION",
            image: t.events.image_url,
            status_checkin: t.status_checkin,
            last_scanned_date: t.last_scanned_date,
            checked_in_at: t.checked_in_at
          });
        });
      }

      // ⚡ FETCH PENDING TRANSAKSI yang belum punya tiket
      const { data: pendingTx } = await supabase
        .from("transaksi")
        .select(`
          id,
          order_id,
          total_bayar,
          total_qty,
          created_at,
          event_id,
          snap_token,
          category_id,
          events (
            id,
            title,
            date,
            end_date,
            location,
            category,
            image_url,
            price
          )
        `)
        .eq("user_id", session.user.id)
        .eq("status_pembayaran", "pending")
        .order("created_at", { ascending: false });

      if (pendingTx) {
        const existingTxIds = new Set(formattedTickets.map(t => t.transaksi_id));
        pendingTx.forEach((tx: any) => {
          if (existingTxIds.has(tx.id)) return;
          if (!tx.events) return;

          formattedTickets.push({
            id: `PENDING-${tx.order_id}`,
            event_id: tx.events.id,
            transaksi_id: tx.id,
            title: tx.events.title,
            date: tx.events.date,
            end_date: tx.events.end_date,
            location: tx.events.location,
            category: tx.events.category,
            price: tx.total_bayar,
            status: "PENDING",
            seat: `${tx.total_qty}x Tiket`,
            image: tx.events.image_url,
            status_checkin: false,
            last_scanned_date: null,
            checked_in_at: null,
            snap_token: tx.snap_token,
            category_id: tx.category_id,
            total_qty: tx.total_qty,
            order_id: tx.order_id
          });
        });
      }

      setTickets(formattedTickets);
      localStorage.setItem(`tiketin_cached_tickets_${session.user.id}`, JSON.stringify(formattedTickets));
    } catch (err) {
      console.error("Gagal sinkronisasi data dari server, memakai fallback cache:", err);
      const lastUserId = localStorage.getItem("tiketin_last_user_id");
      if (lastUserId) {
        const cachedProfile = localStorage.getItem(`tiketin_cached_profile_${lastUserId}`);
        const cachedTickets = localStorage.getItem(`tiketin_cached_tickets_${lastUserId}`);
        if (cachedProfile) setUserProfile(JSON.parse(cachedProfile));
        if (cachedTickets) setTickets(JSON.parse(cachedTickets));
        toast("Gagal menghubungi server. Menggunakan versi offline.", "warning", 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayPending = async (ticket: any) => {
    if (isOffline) {
      toast("Gagal melakukan pembayaran. Anda sedang offline! 📴", "error");
      return;
    }
    if (!ticket.snap_token) {
      router.push(`/explore/checkout/${ticket.event_id}`);
      return;
    }
    
    setIsProcessingPay(ticket.transaksi_id);
    
    // @ts-ignore
    window.snap.pay(ticket.snap_token, {
      onSuccess: async function (result: any) {
        try {
          toast("Sinkronisasi pembayaran...", "info", 2000);
          
          const response = await fetch("/api/payment/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: ticket.order_id })
          });
          
          const resData = await response.json();
          if (resData.success) {
            toast("Pembayaran berhasil! Tiket Anda telah aktif! 🎉", "success", 4000);
            fetchUserAndTickets();
          } else {
            throw new Error(resData.error || "Gagal verifikasi");
          }
        } catch (err: any) {
          console.error(err);
          toast("Gagal memverifikasi status pembayaran. Coba refresh halaman!", "warning");
          fetchUserAndTickets();
        } finally {
          setIsProcessingPay(null);
        }
      },
      onPending: () => {
        toast("Pembayaran tertunda — selesaikan pembayaran Anda!", "warning");
        setIsProcessingPay(null);
      },
      onError: () => {
        toast("Pembayaran gagal! Coba lagi.", "error");
        setIsProcessingPay(null);
      },
      onClose: () => {
        setIsProcessingPay(null);
      }
    });
  };

  const handleCancelConfirm = async () => {
    if (isOffline) {
      toast("Gagal membatalkan pesanan. Anda sedang offline! 📴", "error");
      return;
    }
    if (!txToCancel) return;
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from("transaksi")
        .update({ status_pembayaran: "expired" })
        .eq("id", txToCancel.transaksi_id);

      if (error) throw error;

      toast("Pesanan berhasil dibatalkan.", "success");
      setTxToCancel(null);
      await fetchUserAndTickets();
    } catch (err: any) {
      console.error(err);
      toast("Gagal membatalkan pesanan. Coba lagi.", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // ─── Download E-Ticket sebagai PNG ────────────────────────────────────────
  const handleDownloadTicket = async (ticket: any) => {
    const qrEl = document.getElementById(`qr-${ticket.id}`);
    if (!qrEl) { toast("Gagal menemukan QR Code.", "error"); return; }

    toast("Menyiapkan e-ticket...", "info", 2000);

    try {
      // Buat canvas untuk render tiket
      const canvas = document.createElement("canvas");
      const W = 700, H = 360;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      // Background cream
      ctx.fillStyle = "#FCFAF1";
      ctx.fillRect(0, 0, W, H);

      // Border hitam
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, W - 6, H - 6);

      // Stripe kiri ungu
      ctx.fillStyle = "#6D4AFF";
      ctx.fillRect(0, 0, 12, H);

      // Header band hitam
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(12, 0, W - 12, 60);

      // Teks TIKETIN
      ctx.fillStyle = "#FBBF24";
      ctx.font = "bold italic 28px Arial";
      ctx.fillText("TIKETIN", 30, 40);

      // Badge kategori
      ctx.fillStyle = "#6D4AFF";
      ctx.fillRect(W - 160, 12, 140, 36);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px Arial";
      ctx.fillText(ticket.category?.toUpperCase() || "EVENT", W - 150, 34);

      // Judul event
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold italic 24px Arial";
      const title = ticket.title?.toUpperCase() || "";
      const maxW = W - 200;
      let truncated = title;
      while (ctx.measureText(truncated).width > maxW && truncated.length > 3) {
        truncated = truncated.slice(0, -1);
      }
      if (truncated !== title) truncated += "...";
      ctx.fillText(truncated, 28, 100);

      // Tanggal & Lokasi
      ctx.font = "bold 12px Arial";
      ctx.fillStyle = "#64748b";
      ctx.fillText(`📅 ${ticket.date}`, 28, 130);
      ctx.fillText(`📍 ${ticket.location}`, 28, 152);

      // Seat
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold italic 14px Arial";
      ctx.fillText(`KURSI: ${ticket.seat}`, 28, 185);

      // Ticket ID
      ctx.fillStyle = "#6D4AFF";
      ctx.font = "bold 11px Arial";
      ctx.fillText(`ID: ${ticket.id}`, 28, 210);

      // Pemesan Name & Email
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px Arial";
      ctx.fillText(`PEMESAN: ${userProfile?.full_name?.toUpperCase() || "GUEST"}`, 28, 235);

      ctx.fillStyle = "#64748b";
      ctx.font = "bold 11px Arial";
      ctx.fillText(`EMAIL: ${userProfile?.email?.toUpperCase() || "N/A"}`, 28, 256);

      // Garis pembatas tiket (zigzag)
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W - 170, 60);
      ctx.lineTo(W - 170, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // QR Code via SVG to Image
      const svgEl = (qrEl.tagName && qrEl.tagName.toLowerCase() === "svg") ? qrEl : (qrEl.querySelector("svg") || qrEl);
      if (svgEl) {
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            // QR background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(W - 162, 70, 148, 148);
            ctx.strokeStyle = "#0f172a";
            ctx.lineWidth = 3;
            ctx.strokeRect(W - 162, 70, 148, 148);
            ctx.drawImage(img, W - 156, 76, 136, 136);
            URL.revokeObjectURL(svgUrl);
            resolve();
          };
          img.onerror = () => { URL.revokeObjectURL(svgUrl); resolve(); };
          img.src = svgUrl;
        });
      }

      // Footer
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, H - 50, W, 50);
      ctx.fillStyle = "#6D4AFF";
      ctx.font = "bold 10px Arial";
      ctx.fillText("tiketin.id — Platform Tiket Bandung #1", 28, H - 22);
      ctx.fillStyle = "#FBBF24";
      ctx.font = "bold italic 10px Arial";
      ctx.fillText("VALID TICKET — DO NOT SHARE", W - 220, H - 22);

      // Download
      const link = document.createElement("a");
      link.download = `tiketin-${ticket.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast(`E-Ticket "${ticket.title}" berhasil didownload!`, "success");
    } catch (err) {
      console.error("Download error:", err);
      toast("Gagal download e-ticket. Coba lagi!", "error");
    }
  };

  const openReviewModal = (eventId: string, eventTitle: string) => {
    setRating(5);
    setComment("");
    setReviewModal({ isOpen: true, eventId, eventTitle });
  };

  const handleSubmitReview = async () => {
    if (isOffline) {
      toast("Gagal mengirim ulasan. Anda sedang offline! 📴", "error");
      return;
    }
    if (!comment.trim()) {
      toast("Tulis komentar ulasan terlebih dahulu!", "warning");
      return;
    }
    if (rating < 1 || rating > 5) {
      toast("Rating harus antara 1-5 bintang!", "warning");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast("Silakan login kembali.", "error");
        return;
      }

      const { error } = await supabase
        .from("reviews")
        .insert({
          event_id: reviewModal.eventId,
          user_id: session.user.id,
          rating,
          comment: comment.trim()
        });

      if (error) {
        if (error.code === "23505") {
          toast("Kamu sudah pernah kasih ulasan untuk event ini!", "warning");
        } else {
          throw error;
        }
      } else {
        toast("Makasih! Ulasan kamu sudah terkirim 🎉", "success");
        setReviewModal({ isOpen: false, eventId: null, eventTitle: "" });
        setReviewedEvents(prev => {
          const next = new Set(prev);
          if (reviewModal.eventId) next.add(reviewModal.eventId);
          return next;
        });
      }
    } catch (err) {
      console.error("Gagal mengirim ulasan:", err);
      toast("Terjadi kesalahan saat mengirim ulasan.", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredTickets = tickets.filter(t => t.status === activeTab);

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka || 0);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 noise overflow-x-hidden ${poppins.className}`}>

      {/* ── HEADER ── */}
      <nav className="w-full bg-white dark:bg-zinc-900 border-b-8 border-slate-900 dark:border-zinc-700 sticky top-0 z-[50] shadow-[0_8px_0_0_rgba(0,0,0,1)] dark:shadow-[0_8px_0_0_var(--primary-color)] h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/explore" className="flex items-center gap-2 group text-slate-900 dark:text-zinc-50">
            <div className="h-10 w-10 bg-black flex items-center justify-center group-hover:-rotate-12 transition-transform shadow-[4px_4px_0_0_var(--primary-color)]">
              <ChevronLeft className="text-white" size={24} strokeWidth={3} />
            </div>
            <span className="text-xl font-black italic -skew-x-12 tracking-tighter uppercase ml-2">BACK TO </span>
          </Link>

          <div className="flex items-center gap-4">
            <NotificationBell userId={userProfile?.id} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group p-1 pr-3 transition-all text-slate-900 dark:text-zinc-50">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black uppercase border-2 border-slate-900 dark:border-zinc-700 mb-1 px-2 py-0.5 inline-block bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300">
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
                  <Avatar className="h-10 w-10 border-4 border-slate-900 dark:border-zinc-700 rounded-none -rotate-6 shadow-[4px_4px_0_0_var(--primary-color)] group-hover:rotate-0 transition-transform">
                    <AvatarImage src={userProfile?.avatar_url} />
                    <AvatarFallback className="bg-[#6D4AFF] text-white font-black">{userProfile?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 border-4 border-slate-900 dark:border-zinc-700 rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_var(--primary-color)] p-2 bg-white dark:bg-zinc-900 z-[60]">
                <DropdownMenuLabel className="font-black italic uppercase text-[10px] text-slate-400">Quick Access</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-900 dark:bg-zinc-750 h-0.5" />
                <DropdownMenuItem onClick={() => router.push("/explore/profile")} className="focus:bg-rose-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <User className="mr-2 h-4 w-4" /> Profil Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/verify")} className="focus:bg-amber-400 font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <ShieldCheck className="mr-2 h-4 w-4" /> {userProfile?.verification_status === "approved" ? "Status KTP (Lolos)" : "Verifikasi KTP"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/tickets")} className="focus:bg-blue-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <TicketIcon className="mr-2 h-4 w-4" /> Tiket Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/complaints")} className="focus:bg-emerald-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <MessageSquare className="mr-2 h-4 w-4" /> Pengaduan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/rewards")} className="focus:bg-purple-500 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <Trophy className="mr-2 h-4 w-4" /> Tukar Poin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/explore/history")} className="focus:bg-slate-900 focus:text-white font-black italic uppercase text-xs py-3 cursor-pointer text-slate-900 dark:text-zinc-100">
                  <Receipt className="mr-2 h-4 w-4" /> Riwayat Pembayaran
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-900 dark:bg-zinc-750 h-0.5" />
                <DropdownMenuItem
                  className="focus:bg-red-500 focus:text-white font-black italic uppercase text-xs py-3 text-red-500 dark:text-red-400 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 sm:px-12 pt-16 pb-40">

        {/* ── PAGE TITLE ── */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="bg-amber-400 border-4 border-slate-900 px-4 py-2 font-black uppercase text-[10px] shadow-[4px_4px_0_0_#000] -rotate-2 inline-flex items-center gap-2 mb-6 italic">
              <TicketIcon size={14} /> TICKET INVENTORY
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl md:text-8xl font-black -skew-x-12 italic uppercase leading-none pb-2 pt-2 pr-2 tracking-tighter drop-shadow-[6px_6px_0_#6D4AFF]">
              TIKET <span className="text-amber-400 drop-shadow-[4px_4px_0_#000] md:drop-shadow-[6px_6px_0_#000] dark:drop-shadow-[6px_6px_0_var(--primary-color)]">SAYA.</span>
            </h1>
          </div>
        </header>

        {/* ⚡ TABS */}
        <div className="overflow-x-auto w-full mb-12">
          <div className="flex bg-white dark:bg-zinc-900 border-4 border-slate-900 dark:border-zinc-700 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color)] p-1 w-max min-w-full sm:min-w-0">
          {["PENDING", "AKTIF", "TERPAKAI"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-initial shrink-0 whitespace-nowrap px-4 sm:px-6 py-3 font-black italic uppercase text-xs md:text-sm transition-all ${activeTab === tab
                ? (tab === "PENDING" ? "bg-amber-400 text-slate-900 border-2 border-slate-900" : tab === "AKTIF" ? "bg-[#6D4AFF] text-white border-2 border-[#6D4AFF]" : "bg-slate-900 text-white border-2 border-slate-900")
                : "bg-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
            >
              {tab === "PENDING" && "⏳ Belum Bayar"}
              {tab === "AKTIF" && "🎫 Aktif"}
              {tab === "TERPAKAI" && "🏁 Terpakai"}
            </button>
          ))}
          </div>
        </div>

        {/* ⚡ BANNER OFFLINE */}
        {isOffline && (
          <div className="mb-12 bg-amber-400 text-slate-900 border-4 border-slate-900 p-4 font-black italic uppercase shadow-[6px_6px_0_0_#000] flex items-center gap-3 animate-pulse rounded-2xl">
            <AlertCircle size={24} className="shrink-0 animate-bounce" />
            <div className="text-left leading-tight">
              <p className="text-sm font-black">MODE OFFLINE AKTIF 📴</p>
              <p className="text-[9.5px] font-bold mt-0.5">Menampilkan tiket dari penyimpanan lokal browser. Pembayaran pending dan pengisian ulasan dinonaktifkan.</p>
            </div>
          </div>
        )}

        {/* ── TICKET LIST ── */}
        <div className="space-y-16">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-[#6D4AFF]" size={48} strokeWidth={4} />
                <p className="font-black italic text-xl uppercase">Menyusun Arena Tiket...</p>
              </div>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((ticket, idx) => {
                // ⚡ LOGIKA DETEKSI MULTI-DAY & SCAN MENGGUNAKAN REGEX
                const seatUpper = ticket.seat.toUpperCase();

                // Match "DAY X" atau "HARI X"
                const match = seatUpper.match(/(?:DAY|HARI)\s*([1-9])/);
                const specificDayNum = match ? parseInt(match[1]) : null;
                const isDaySpecific = specificDayNum !== null;

                // Multi-day is if the ticket represents a multi-day pass (contains "DAY" or "TERUSAN" or "PASS" but is NOT a specific single day pass)
                const isMultiDay = (seatUpper.includes("DAY") || seatUpper.includes("TERUSAN") || seatUpper.includes("PASS")) && !isDaySpecific;

                const alreadyScannedToday = ticket.last_scanned_date === today;
                const isEventEnded = ticket.end_date ? ticket.end_date < today : ticket.date < today;
                const canReview = ticket.status !== "PENDING" && (ticket.status === "TERPAKAI" || isEventEnded) && !reviewedEvents.has(ticket.event_id);

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="w-full flex flex-col md:flex-row bg-white dark:bg-zinc-900 border-4 border-slate-900 dark:border-zinc-700 brutal-shadow-card group relative overflow-hidden"
                  >

                    {/* ⚡ OVERLAY TERPAKAI */}
                    {ticket.status === "TERPAKAI" && (
                      <motion.div 
                        initial={{ scale: 3, rotate: -35, opacity: 0 }}
                        animate={{ scale: 1, rotate: -12, opacity: 1 }}
                        transition={{ type: "spring", damping: 10, stiffness: 100 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                      >
                        <div className="bg-slate-900 border-4 border-white px-6 py-2 text-3xl md:text-5xl font-black italic uppercase shadow-[8px_8px_0_0_#FBBF24] text-white">
                          USED / TERPAKAI
                        </div>
                      </motion.div>
                    )}

                    {/* KIRI: Info Event */}
                    <div className={`flex-1 flex flex-col sm:flex-row ${(ticket.status === "TERPAKAI" || isEventEnded) ? 'opacity-50 grayscale-[100%]' : ''}`}>
                      <div className="w-full sm:w-48 h-48 sm:h-full border-b-4 sm:border-b-0 sm:border-r-4 border-slate-900 dark:border-zinc-700 overflow-hidden relative bg-black shrink-0">
                        <img src={ticket.image} alt={ticket.title} className="w-full h-full object-contain grayscale-[30%] group-hover:grayscale-0 transition-all duration-500 opacity-80 group-hover:opacity-100" />

                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          <div className="bg-slate-900 text-white px-2 py-1 font-black text-[10px] tracking-widest uppercase border-2 border-white">
                            {ticket.category}
                          </div>
                          {isEventEnded && (
                            <div className="bg-red-500 text-white px-2 py-1 font-black text-[10px] tracking-widest uppercase border-2 border-white flex items-center gap-1 shadow-[2px_2px_0_0_#000] animate-pulse">
                              EVENT SELESAI
                            </div>
                          )}
                          {isMultiDay && (
                            <div className="bg-amber-400 text-slate-900 px-2 py-1 font-black text-[10px] tracking-widest uppercase border-2 border-slate-900 flex items-center gap-1 shadow-[2px_2px_0_0_#000]">
                              <Star size={10} fill="currentColor" /> MULTI-DAY
                            </div>
                          )}
                          {isDaySpecific && (
                            <div className="bg-blue-400 text-white px-2 py-1 font-black text-[10px] tracking-widest uppercase border-2 border-slate-900 flex items-center gap-1 shadow-[2px_2px_0_0_#000]">
                              <Calendar size={10} /> HARI {specificDayNum} ONLY
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-6 md:p-8 flex flex-col justify-center flex-grow text-left">
                        <h3 className="text-3xl md:text-4xl font-black italic uppercase -skew-x-6 tracking-tighter mb-4 leading-none text-slate-900 dark:text-zinc-50">
                          {ticket.title}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          <div className="flex items-center gap-3">
                            <div className="bg-amber-400 p-2 border-2 border-slate-900 dark:border-zinc-700 shadow-[2px_2px_0_0_#000]"><Calendar size={16} strokeWidth={3} /></div>
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest">TANGGAL</p>
                              <p className="text-sm font-black uppercase text-slate-900 dark:text-zinc-100">{ticket.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="bg-[#6D4AFF] text-white p-2 border-2 border-slate-900 dark:border-zinc-700 shadow-[2px_2px_0_0_#000]"><MapPin size={16} strokeWidth={3} /></div>
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest">LOKASI</p>
                              <p className="text-sm font-black uppercase text-slate-900 dark:text-zinc-100 line-clamp-1">{ticket.location}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PEMBATAS TIKET VERTIKAL (DESKTOP) */}
                    <motion.div 
                      animate={animatingTearId === ticket.id ? { opacity: 0, scaleY: 0.5 } : { opacity: 1, scaleY: 1 }}
                      transition={{ duration: 0.4 }}
                      className="hidden md:flex flex-col items-center justify-between relative w-8 shrink-0 bg-[var(--background)]"
                    >
                      <div className="w-6 h-6 rounded-full border-4 border-slate-900 dark:border-zinc-700 bg-[var(--background)] absolute -top-4 -translate-y-1/2 z-10" />
                      <div className="w-0.5 h-full ticket-stub-divider my-2" />
                      <div className="w-6 h-6 rounded-full border-4 border-slate-900 dark:border-zinc-700 bg-[var(--background)] absolute -bottom-4 translate-y-1/2 z-10" />
                    </motion.div>

                    {/* PEMBATAS TIKET HORIZONTAL (MOBILE) */}
                    <motion.div 
                      animate={animatingTearId === ticket.id ? { opacity: 0, scaleX: 0.5 } : { opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.4 }}
                      className="flex md:hidden items-center justify-between relative h-8 w-full bg-[var(--background)]"
                    >
                      <div className="w-6 h-6 rounded-full border-4 border-slate-900 dark:border-zinc-700 bg-[var(--background)] absolute -left-4 -translate-x-1/2 z-10" />
                      <div className="h-0.5 w-full ticket-stub-divider-horizontal mx-2" />
                      <div className="w-6 h-6 rounded-full border-4 border-slate-900 dark:border-zinc-700 bg-[var(--background)] absolute -right-4 translate-x-1/2 z-10" />
                    </motion.div>

                    {/* KANAN: QR Code & Aksi */}
                    <motion.div
                      variants={stubVariants}
                      animate={animatingTearId === ticket.id ? "tearing" : "aktif"}
                      onAnimationComplete={() => {
                        if (animatingTearId === ticket.id) {
                          handleTearComplete(ticket.id);
                        }
                      }}
                      className="w-full md:w-72 p-6 md:p-8 flex flex-col justify-center items-center text-center bg-white dark:bg-zinc-900 shrink-0 border-t-4 md:border-t-0 border-slate-900 dark:border-zinc-700 relative z-10"
                    >

                      {ticket.status === "PENDING" ? (
                        <div className="flex flex-col items-center justify-center h-full w-full space-y-4">
                          <div className="text-amber-500"><CreditCard size={48} strokeWidth={2} /></div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest mb-1">Total Tagihan</p>
                            <p className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-zinc-50">{formatRupiah(ticket.price)}</p>
                          </div>
                          <div className="w-full flex flex-col gap-2 mt-4">
                            <button 
                               onClick={() => handlePayPending(ticket)} 
                               disabled={isProcessingPay !== null || isOffline}
                               className={`w-full bg-[#6D4AFF] text-white font-black italic uppercase text-xs py-4 border-2 border-slate-900 dark:border-zinc-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 ${isOffline ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              {isProcessingPay === ticket.transaksi_id ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <CreditCard size={14} />
                              )}
                              BAYAR SEKARANG
                            </button>
                            
                            <button 
                              disabled={isOffline}
                              onClick={() => router.push(`/explore/checkout/${ticket.event_id}`)} 
                              className={`w-full bg-amber-400 text-slate-900 dark:text-zinc-100 font-black italic uppercase text-xs py-4 border-2 border-slate-900 dark:border-zinc-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all ${isOffline ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              PAKAI VOUCHER / EDIT TIKET
                            </button>
 
                            <button 
                              onClick={() => setTxToCancel(ticket)} 
                              disabled={isOffline}
                              className={`w-full bg-red-500 text-white font-black italic uppercase text-xs py-4 border-2 border-slate-900 dark:border-zinc-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all ${isOffline ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              BATALKAN PESANAN
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest mb-1">TICKET ID</p>
                          <p className="text-base font-black uppercase bg-slate-100 dark:bg-zinc-800 px-4 py-1 border-2 border-slate-900 dark:border-zinc-700 mb-6 text-slate-900 dark:text-zinc-100">{ticket.id}</p>

                          <div className="bg-white dark:bg-zinc-900 p-2 border-4 border-slate-900 dark:border-zinc-700 shadow-[4px_4px_0_0_#FBBF24] dark:shadow-[4px_4px_0_0_var(--primary-color)] mb-6 relative overflow-hidden flex items-center justify-center">
                            <QRCodeSVG
                              id={`qr-${ticket.id}`}
                              value={ticket.id}
                              size={120}
                              level="H"
                              includeMargin={false}
                              fgColor={(alreadyScannedToday || isEventEnded) ? "#cbd5e1" : "#0f172a"}
                            />
                            {isEventEnded && (
                              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                                <span className="font-black italic text-xl border-4 border-red-500 text-red-500 bg-white px-3 py-1 -rotate-12 shadow-[2px_2px_0_0_#000] tracking-widest uppercase">
                                  EXPIRED
                                </span>
                              </div>
                            )}
                          </div>

                          {/* ⚡ INDIKATOR STATUS SCAN HARIAN */}
                          <div className="w-full space-y-2">
                            <p className="text-sm font-black text-[#6D4AFF] italic uppercase">{ticket.seat}</p>

                            {isMultiDay && ticket.last_scanned_date && (
                              <div className={`mt-2 p-2 border-2 border-black flex items-center justify-center gap-2 text-[10px] font-black uppercase italic ${alreadyScannedToday ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                <Clock size={12} />
                                {alreadyScannedToday ? "Checked-in Today!" : `Last Scan: ${ticket.last_scanned_date}`}
                              </div>
                            )}

                            {alreadyScannedToday && (
                              <p className="text-[8px] font-bold text-red-500 uppercase tracking-tighter mt-1">QR disabled until tomorrow</p>
                            )}
                          </div>

                          {ticket.status === "AKTIF" && (
                            <>
                              {/* Countdown ke hari H */}
                              {!isEventEnded && (
                                <div className="mt-4">
                                  <CountdownBadge dateStr={ticket.date} />
                                </div>
                              )}
                              <button
                                onClick={() => handleDownloadTicket(ticket)}
                                className="mt-4 w-full bg-slate-900 text-white font-black italic uppercase text-xs py-3 border-2 border-slate-900 shadow-[4px_4px_0_0_#6D4AFF] hover:bg-amber-400 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                              >
                                <Download size={14} strokeWidth={3} /> E-TICKET
                              </button>
                              <button
                                onClick={() => handleOpenEventChat(ticket.event_id, ticket.title)}
                                className="mt-2.5 w-full bg-amber-400 text-slate-900 font-black italic uppercase text-xs py-3 border-2 border-slate-900 shadow-[4px_4px_0_0_#000] hover:bg-[#6D4AFF] hover:text-white transition-all flex items-center justify-center gap-2"
                              >
                                <MessageSquare size={14} strokeWidth={3} /> GRUP CHAT & TEBENGAN
                              </button>
                            </>
                          )}

                          {canReview && (
                            <button
                              disabled={isOffline}
                              onClick={() => openReviewModal(ticket.event_id, ticket.title)}
                              className={`mt-4 w-full bg-amber-400 text-slate-900 font-black italic uppercase text-xs py-3 border-2 border-slate-900 shadow-[4px_4px_0_0_#000] hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 ${isOffline ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <Star size={14} fill="currentColor" strokeWidth={3} /> BERI ULASAN
                            </button>
                          )}

                          {reviewedEvents.has(ticket.event_id) && (
                            <div className="mt-4 px-4 py-2 border-2 border-emerald-500 bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#10B981] w-full">
                              ✓ Ulasan Terkirim
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div className="py-32 text-center border-[8px] border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-full">
                <p className="text-5xl font-black italic uppercase text-slate-300 dark:text-zinc-700 mb-2">TIKET KOSONG!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ─── REVIEW MODAL ─── */}
      <AnimatePresence>
        {reviewModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmittingReview && setReviewModal({ isOpen: false, eventId: null, eventTitle: "" })}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="bg-[#FCFAF1] dark:bg-zinc-900 border-8 border-slate-900 dark:border-zinc-700 shadow-[12px_12px_0_0_#000] dark:shadow-[12px_12px_0_0_var(--primary-color)] w-full max-w-lg relative z-10 p-6 md:p-8 text-left"
            >
              {/* Close Button */}
              <button
                disabled={isSubmittingReview}
                onClick={() => setReviewModal({ isOpen: false, eventId: null, eventTitle: "" })}
                className="absolute top-4 right-4 z-30 h-10 w-10 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 hover:bg-red-500 dark:hover:bg-red-500 hover:text-white dark:hover:text-white border-4 border-slate-900 dark:border-zinc-700 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_var(--primary-color)] flex items-center justify-center font-black transition-all hover:rotate-90"
              >
                <X size={20} strokeWidth={3} />
              </button>

              <div className="space-y-6">
                <div>
                  <div className="bg-amber-400 border-4 border-slate-900 px-3 py-1 font-black uppercase text-[10px] shadow-[3px_3px_0_0_#000] -rotate-1 inline-flex items-center gap-1.5 italic mb-3">
                    <Star size={12} fill="currentColor" /> SHARE YOUR EXPERIENCE
                  </div>
                  <h2 className="text-2xl font-black italic uppercase -skew-x-6 tracking-tighter leading-tight break-words pr-10">
                    Beri Ulasan
                  </h2>
                  <p className="text-xs font-black uppercase text-slate-400 mt-1">{reviewModal.eventTitle}</p>
                </div>

                {/* Star Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Rating Bintang</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`h-12 w-12 border-4 border-slate-900 dark:border-zinc-700 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_var(--primary-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#000] transition-all flex items-center justify-center ${star <= rating ? "bg-amber-400 text-slate-900" : "bg-white dark:bg-zinc-800 text-slate-200 dark:text-zinc-650"
                          }`}
                      >
                        <Star size={24} fill={star <= rating ? "currentColor" : "none"} strokeWidth={2.5} />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-black italic uppercase tracking-wider text-amber-500 mt-1">
                    {rating === 5 && "⭐ LUAR BIASA! OVERPOWERED!"}
                    {rating === 4 && "⭐ BAGUS BANGET! PUAS!"}
                    {rating === 3 && "⭐ LUMAYAN OKE!"}
                    {rating === 2 && "⭐ KURANG MEMUASKAN."}
                    {rating === 1 && "⭐ MENGECEWAKAN. PERLU EVALUASI!"}
                  </p>
                </div>

                {/* Comment Text Area */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Komentar / Ulasan</label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ceritakan pengalaman gila kamu nonton event ini..."
                    className="w-full p-4 border-4 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-slate-900 dark:text-zinc-100 outline-none focus:bg-amber-50 dark:focus:bg-zinc-800 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] transition-all"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t-4 border-slate-900 dark:border-zinc-700 flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={() => setReviewModal({ isOpen: false, eventId: null, eventTitle: "" })}
                    className="px-6 py-3 border-4 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700 font-black italic uppercase text-xs shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={handleSubmitReview}
                    className="px-6 py-3 border-4 border-slate-900 dark:border-zinc-700 bg-[#6D4AFF] text-white hover:bg-slate-900 dark:hover:bg-zinc-800 font-black italic uppercase text-xs shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all flex items-center gap-2"
                  >
                    {isSubmittingReview ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        MENGIRIM...
                      </>
                    ) : (
                      "KIRIM ULASAN"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── CHECK-IN SUCCESS MODAL ─── */}
      <AnimatePresence>
        {scannedTicketNotification && scannedTicketNotification.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="bg-white dark:bg-zinc-900 border-8 border-slate-900 dark:border-zinc-700 shadow-[12px_12px_0_0_#000] dark:shadow-[12px_12px_0_0_var(--primary-color)] w-full max-w-md relative z-10 p-8 text-center space-y-6"
            >
              <div className="inline-block bg-emerald-400 p-4 border-4 border-slate-900 dark:border-zinc-700 -rotate-6 shadow-[4px_4px_0_0_#000] mx-auto">
                <ShieldCheck className="text-slate-900" size={48} strokeWidth={3} />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black italic uppercase -skew-x-6 tracking-tighter text-emerald-500">
                  CHECK-IN SUCCESS!
                </h2>
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Tiket Telah Digunakan</p>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-850 border-4 border-slate-900 dark:border-zinc-700 p-4 text-left space-y-3 font-bold">
                <p className="text-lg font-black italic uppercase border-b-2 border-slate-900 dark:border-zinc-700 pb-2 text-slate-900 dark:text-zinc-100">
                  {scannedTicketNotification.eventTitle}
                </p>
                <div className="text-xs space-y-1 text-slate-600 dark:text-zinc-400">
                  <p className="uppercase"><span className="text-slate-400 dark:text-zinc-500">Kode:</span> {scannedTicketNotification.ticketCode}</p>
                  <p className="uppercase"><span className="text-slate-400 dark:text-zinc-500">Seat:</span> {scannedTicketNotification.seatInfo}</p>
                  <p className="uppercase"><span className="text-slate-400 dark:text-zinc-500">Waktu:</span> {scannedTicketNotification.scanTime}</p>
                </div>
              </div>

              <button
                onClick={() => setScannedTicketNotification(null)}
                className="w-full bg-slate-900 dark:bg-zinc-800 hover:bg-[#6D4AFF] text-white font-black italic uppercase text-sm py-4 border-4 border-slate-900 dark:border-zinc-700 shadow-[4px_4px_0_0_#FBBF24] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                MANTAP, MASUK KONSER! 🎸
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── CANCEL CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {txToCancel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isCancelling && setTxToCancel(null)}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="bg-white dark:bg-zinc-900 border-8 border-slate-900 dark:border-zinc-700 shadow-[12px_12px_0_0_#000] dark:shadow-[12px_12px_0_0_var(--primary-color)] w-full max-w-md relative z-10 p-8 text-center space-y-6"
            >
              <div className="inline-block bg-red-500 text-white p-4 border-4 border-slate-900 dark:border-zinc-700 -rotate-6 shadow-[4px_4px_0_0_#000] mx-auto">
                <AlertCircle className="text-white" size={48} strokeWidth={3} />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black italic uppercase -skew-x-6 tracking-tighter text-slate-900 dark:text-zinc-50">
                  BATALKAN PESANAN?
                </h2>
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Aksi ini tidak dapat dibatalkan</p>
              </div>

              <div className="bg-[#FCFAF1] dark:bg-zinc-950 border-4 border-slate-900 dark:border-zinc-700 p-4 text-left space-y-2 font-bold">
                <p className="text-lg font-black italic uppercase border-b-2 border-slate-900 dark:border-zinc-700 pb-2 text-slate-900 dark:text-zinc-100">
                  {txToCancel.title}
                </p>
                <div className="text-xs space-y-1 text-slate-600 dark:text-zinc-400">
                  <p className="uppercase"><span className="text-slate-400 dark:text-zinc-500">Total:</span> {formatRupiah(txToCancel.price)}</p>
                  <p className="uppercase"><span className="text-slate-400 dark:text-zinc-500">Jumlah:</span> {txToCancel.seat}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setTxToCancel(null)}
                  className="w-1/2 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-750 text-slate-900 dark:text-zinc-100 font-black italic uppercase text-xs py-4 border-4 border-slate-900 dark:border-zinc-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all"
                >
                  TIDAK, KEMBALI
                </button>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleCancelConfirm}
                  className="w-1/2 bg-red-500 hover:bg-red-600 text-white font-black italic uppercase text-xs py-4 border-4 border-slate-900 dark:border-zinc-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all flex items-center justify-center gap-2"
                >
                  {isCancelling ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  YA, BATALKAN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 💬 CHAT DRAWER KOMUNITAS */}
      <ChatDrawer
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        eventId={chatEventId}
        eventTitle={chatEventTitle}
        userProfile={userProfile ? {
          id: userProfile.id,
          full_name: userProfile.full_name,
          avatar_url: userProfile.avatar_url || ""
        } : null}
      />
    </div>
  );
}