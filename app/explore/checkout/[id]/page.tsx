"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Poppins } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Ticket, Calendar, MapPin, 
  CreditCard, Loader2, Zap, ShieldCheck, AlertOctagon, Tag, CheckCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast-brutal";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const GLOBAL_STYLES = `
  .noise::after {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:999; opacity:.04;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }
  .brutal-shadow-btn {
    box-shadow: 4px 4px 0px 0px #6D4AFF, 8px 8px 0px 0px #000, 12px 12px 0px 0px #FBBF24 !important;
    transition: all 0.2s ease;
  }
  .brutal-shadow-btn:active {
    box-shadow: 2px 2px 0px 0px #6D4AFF, 4px 4px 0px 0px #000, 6px 6px 0px 0px #FBBF24 !important;
    transform: translate(2px, 2px);
  }
  .brutal-shadow-card {
    box-shadow: 8px 8px 0px 0px #6D4AFF, 16px 16px 0px 0px #000 !important;
  }
`;

const CheckoutSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#FCFAF1] text-slate-900 noise animate-pulse">
      {/* Sticky Header */}
      <nav className="w-full bg-white border-b-8 border-slate-900 h-20 flex items-center px-6 md:px-12 sticky top-0 z-50 shadow-[0_8px_0_0_#000]">
        <div className="flex items-center gap-2 border-2 border-slate-200 p-2 bg-slate-100 w-32 h-10">
          <div className="w-4 h-4 bg-slate-300 rounded animate-pulse" />
          <div className="h-4 bg-slate-300 rounded w-16 animate-pulse" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 sm:px-12 pt-12 pb-32">
        {/* Title skeleton */}
        <div className="mb-12">
          <div className="h-14 bg-slate-300 rounded-lg w-3/4 mb-4 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
        </div>

        {/* Urgency banner skeleton */}
        <div className="bg-slate-200 border-4 border-slate-900 p-4 mb-8 shadow-[6px_6px_0_0_#000] -skew-x-2 min-h-[50px] flex items-center justify-center">
          <div className="h-4 bg-slate-300 rounded w-2/3 animate-pulse" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* Left Column */}
          <div className="flex-1 space-y-8">
            <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#000] flex flex-col overflow-hidden">
              {/* Event Image skeleton */}
              <div className="h-64 bg-slate-200 relative border-b-4 border-slate-900">
                <div className="absolute top-4 left-4 bg-slate-300 border-2 border-slate-900 w-24 h-6 shadow-[2px_2px_0_0_#000]" />
              </div>
              
              {/* Event Details skeleton */}
              <div className="p-8 space-y-6">
                <div className="h-8 bg-slate-300 rounded w-3/4 animate-pulse" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-16 bg-slate-100 border-2 border-slate-900 shadow-[4px_4px_0_0_#000] flex items-center p-4">
                    <div className="w-6 h-6 bg-slate-300 rounded-full mr-4 animate-pulse" />
                    <div className="h-4 bg-slate-300 rounded w-2/3 animate-pulse" />
                  </div>
                  <div className="h-16 bg-slate-100 border-2 border-slate-900 shadow-[4px_4px_0_0_#000] flex items-center p-4">
                    <div className="w-6 h-6 bg-slate-300 rounded-full mr-4 animate-pulse" />
                    <div className="h-4 bg-slate-300 rounded w-2/3 animate-pulse" />
                  </div>
                </div>

                <div className="border-t-4 border-slate-900 pt-6 space-y-2">
                  <div className="h-4 bg-slate-300 rounded w-1/4 animate-pulse" />
                  <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
                  <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Ticket Tier skeleton */}
            <div className="bg-white border-4 border-slate-900 p-8 shadow-[8px_8px_0_0_#000]">
              <div className="h-6 bg-slate-300 rounded w-1/3 mb-6 animate-pulse" />
              <div className="space-y-4">
                <div className="border-4 border-slate-300 p-5 bg-white h-24 flex items-center justify-between">
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-6 h-6 rounded-full bg-slate-300 shrink-0 animate-pulse" />
                    <div className="space-y-2 w-full">
                      <div className="h-5 bg-slate-300 rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-6 bg-slate-300 rounded w-24 shrink-0 animate-pulse" />
                </div>
                <div className="border-4 border-slate-300 p-5 bg-white h-24 flex items-center justify-between">
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-6 h-6 rounded-full bg-slate-300 shrink-0 animate-pulse" />
                    <div className="space-y-2 w-full">
                      <div className="h-5 bg-slate-300 rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-6 bg-slate-300 rounded w-24 shrink-0 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-[450px]">
            <div className="bg-white border-4 border-slate-900 p-8 shadow-[8px_8px_0_0_#000] flex flex-col sticky top-24">
              {/* Expiry Timer skeleton */}
              <div className="bg-slate-200 border-4 border-slate-900 p-4 mb-6 shadow-[4px_4px_0_0_#000] h-14 flex items-center justify-between">
                <div className="h-4 bg-slate-300 rounded w-1/3 animate-pulse" />
                <div className="w-20 h-8 bg-slate-300 rounded shadow-[2px_2px_0_0_#000] animate-pulse" />
              </div>

              {/* Summary title skeleton */}
              <div className="h-8 bg-slate-300 rounded w-1/2 mb-8 border-b-4 border-slate-900 pb-4 animate-pulse" />

              {/* Qty selector skeleton */}
              <div className="h-20 bg-slate-50 border-2 border-slate-900 shadow-[4px_4px_0_0_#000] p-4 flex items-center justify-between mb-8">
                <div className="space-y-2">
                  <div className="h-3 bg-slate-300 rounded w-16 animate-pulse" />
                  <div className="h-3 bg-slate-200 rounded w-20 animate-pulse" />
                </div>
                <div className="w-28 h-10 bg-slate-200 border-2 border-slate-300 animate-pulse" />
              </div>

              {/* Billing table skeleton */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between">
                  <div className="h-3 bg-slate-200 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse" />
                  <div className="h-3 bg-slate-200 rounded w-1/5 animate-pulse" />
                </div>
              </div>

              {/* Total billing skeleton */}
              <div className="border-t-4 border-slate-900 pt-6 mb-8 space-y-2">
                <div className="h-3 bg-slate-300 rounded w-1/4 animate-pulse" />
                <div className="h-10 bg-slate-300 rounded w-1/2 animate-pulse" />
              </div>

              {/* Button skeleton */}
              <div className="w-full bg-slate-200 border-4 border-slate-900 p-6 h-20 shadow-[4px_4px_0_0_#000] -skew-x-6 animate-pulse" />
              
              {/* Trust badge skeleton */}
              <div className="h-4 bg-slate-100 rounded w-2/3 mx-auto mt-8 animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alreadyBought, setAlreadyBought] = useState(0);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // ⚡ Live Viewer & Urgency Alerts
  const [liveViewers, setLiveViewers] = useState(12);
  const [alertIndex, setAlertIndex] = useState(0);

  // ⏳ Expiry Timer & Alert Modals States
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showUnpaidModal, setShowUnpaidModal] = useState<boolean>(false);

  useEffect(() => {
    if (!eventId || !user) return;

    const sessionKey = `checkout_start_${user.id}_${eventId}`;
    const savedStart = sessionStorage.getItem(sessionKey);
    let startTime = Date.now();

    if (savedStart) {
      const parsedStart = parseInt(savedStart, 10);
      if (Date.now() - parsedStart > 600 * 1000) {
        sessionStorage.setItem(sessionKey, String(startTime));
      } else {
        startTime = parsedStart;
      }
    } else {
      sessionStorage.setItem(sessionKey, String(startTime));
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 600 - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsExpired(true);
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [eventId, user]);

  useEffect(() => {
    if (!eventId) return;
    const channel = supabase.channel(`checkout_presence_${eventId}`);
    
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const userCount = Object.keys(state).length;
        setLiveViewers(Math.max(1, userCount));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    const intervalAlerts = setInterval(() => {
      setAlertIndex((prev) => (prev + 1) % 3);
    }, 5000);

    return () => {
      channel.unsubscribe();
      clearInterval(intervalAlerts);
    };
  }, [eventId]);

  // Voucher states
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherError, setVoucherError] = useState("");
  const [isVoucherChecking, setIsVoucherChecking] = useState(false);

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

    fetchData();

    return () => { 
      document.head.removeChild(style); 
      document.head.removeChild(script); 
    };
  }, [eventId]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUser(session.user);

    const { data: eventData } = await supabase.from("events").select("*").eq("id", eventId).single();
    if (eventData) setEvent(eventData);

    const { data: catData } = await supabase.from("ticket_categories").select("*").eq("event_id", eventId).order("price", { ascending: true });
    if (catData && catData.length > 0) {
      setCategories(catData);
      
      const paramCatId = searchParams ? searchParams.get("category_id") : null;
      const paramQty = searchParams ? searchParams.get("qty") : null;
      const categoryExists = catData.some((c: any) => c.id === paramCatId);
      
      if (paramCatId && categoryExists) {
        setSelectedCatId(paramCatId);
        if (paramQty) {
          setQty(Math.max(1, Number(paramQty)));
        }
      } else {
        const availableCat = catData.find((c: any) => c.stock > 0) || catData[0];
        setSelectedCatId(availableCat.id);
      }
    }

    const { data: userTickets } = await supabase
      .from("tiket")
      .select("id, transaksi!inner(user_id)")
      .eq("event_id", eventId)
      .eq("transaksi.user_id", session.user.id);
      
    const boughtCount = userTickets ? userTickets.length : 0;
    setAlreadyBought(boughtCount);

    const { data: bookedData } = await supabase
      .from("tiket")
      .select("seat_info")
      .eq("event_id", eventId);
    if (bookedData) {
      setBookedSeats(bookedData.map((t: any) => t.seat_info).filter(Boolean));
    }

    setIsLoading(false);
  };

  const selectedCategory = categories.find(c => c.id === selectedCatId);
  const maxBuyPerUser = event?.max_buy || 0;
  const availableUserQuota = Math.max(0, maxBuyPerUser - alreadyBought);
  const stockAvailable = selectedCategory ? selectedCategory.stock : 0;
  const absoluteMaxQty = Math.min(availableUserQuota, stockAvailable);

  // Voucher Calculations
  const originalTotal = (selectedCategory?.price || 0) * qty;
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discount_type === "percentage") {
      discountAmount = Math.floor(originalTotal * (appliedVoucher.discount_value / 100));
    } else if (appliedVoucher.discount_type === "fixed") {
      discountAmount = appliedVoucher.discount_value;
    }
  }
  const totalBayar = Math.max(0, originalTotal - discountAmount);

  useEffect(() => {
    if (absoluteMaxQty === 0) {
      setQty(0);
    } else {
      if (qty === 0) {
        setQty(1);
      } else if (qty > absoluteMaxQty) {
        setQty(absoluteMaxQty);
      }
    }
  }, [selectedCatId, absoluteMaxQty]);

  useEffect(() => {
    setSelectedSeats([]);
  }, [selectedCatId, qty]);

  // Seating configuration parsing
  const isSeatingEnabled = !!event?.description?.includes("--seating-enabled:");
  let seatingRows = 5;
  let seatingCols = 8;
  if (isSeatingEnabled) {
    const match = event.description.match(/--seating-enabled:(\d+)x(\d+)--/);
    if (match) {
      seatingRows = parseInt(match[1], 10);
      seatingCols = parseInt(match[2], 10);
    }
  }

  // Sort categories descending by price (VIP first)
  const sortedCategories = [...categories].sort((a, b) => b.price - a.price);

  const getCategoryForRow = (rowChar: string) => {
    if (categories.length === 0) return null;

    // Check if categories have custom row specifications like "VIP [A-B]"
    const customMatch = categories.find(cat => {
      const match = cat.name.match(/(.+) \[(.+)\]/);
      if (match) {
        const spec = match[2].toUpperCase().trim();
        const rowsList: string[] = [];
        const parts = spec.split(",");
        parts.forEach((part: string) => {
          if (part.includes("-")) {
            const [start, end] = part.split("-");
            const startCode = start.trim().charCodeAt(0);
            const endCode = end.trim().charCodeAt(0);
            if (!isNaN(startCode) && !isNaN(endCode)) {
              for (let code = Math.min(startCode, endCode); code <= Math.max(startCode, endCode); code++) {
                rowsList.push(String.fromCharCode(code));
              }
            }
          } else {
            rowsList.push(part.trim());
          }
        });
        return rowsList.includes(rowChar);
      }
      return false;
    });

    if (customMatch) return customMatch;

    const rowIndex = rowChar.charCodeAt(0) - 65; // A=0, B=1, ...
    if (rowIndex < 0 || rowIndex >= seatingRows) return null;

    const numCategories = sortedCategories.length;
    const rowsPerCategory = Math.ceil(seatingRows / numCategories);
    const catIndex = Math.min(numCategories - 1, Math.floor(rowIndex / rowsPerCategory));
    return sortedCategories[catIndex];
  };

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) return;
    setIsVoucherChecking(true);
    setVoucherError("");
    setAppliedVoucher(null);

    try {
      const res = await fetch("/api/payment/validate-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCodeInput.trim(), event_id: event.id })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setVoucherError(data.error || "KODE VOUCHER TIDAK VALID!");
        return;
      }

      setAppliedVoucher(data.voucher);
      setVoucherError("");
    } catch (err) {
      console.error(err);
      setVoucherError("GAGAL MEMVERIFIKASI VOUCHER.");
    } finally {
      setIsVoucherChecking(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput("");
    setVoucherError("");
  };

  const handleCheckout = async () => {
    if (!user || !event || !selectedCategory || qty <= 0 || isExpired) return;
    
    if (isSeatingEnabled && selectedSeats.length < qty) {
      toast(`⚠️ Pilih ${qty} kursi terlebih dahulu! Baru ${selectedSeats.length} kursi terpilih.`, "warning");
      return;
    }

    setShowConfirmModal(true);
  };

  const executeCheckout = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);

    try {
      const seatSuffix = isSeatingEnabled && selectedSeats.length > 0
        ? `-SEAT-${selectedSeats.join('_')}`
        : "";
      const orderId = appliedVoucher 
        ? `INV-${Date.now().toString().slice(-6)}${seatSuffix}-VCHR-${appliedVoucher.code.toUpperCase()}`
        : `INV-${Date.now().toString().slice(-6)}${seatSuffix}`;

      // ⚡ HANDLE GRATIS (totalBayar = 0) — bypass Midtrans
      if (totalBayar === 0) {
        const { data: txData, error: txError } = await supabase
          .from("transaksi")
          .insert({
            user_id: user.id,
            order_id: orderId,
            total_qty: qty,
            total_bayar: 0,
            status_pembayaran: "paid",
            snap_token: null,
            event_id: event.id,
            category_id: selectedCategory.id
          })
          .select()
          .single();

        if (txError) throw txError;

        const ticketsToInsert = Array.from({ length: qty }).map((_, idx) => ({
          transaksi_id: txData.id,
          event_id: event.id,
          ticket_category_id: selectedCategory.id,
          ticket_code: `TKT-${orderId}-${idx}`,
          seat_info: isSeatingEnabled ? `${selectedCategory.name} - ${selectedSeats[idx]}` : selectedCategory.name,
          status_checkin: false
        }));
        await supabase.from("tiket").insert(ticketsToInsert);

        await supabase.rpc('decrement_ticket_stock', { cat_id: selectedCategory.id, qty });

        if (appliedVoucher) {
          await supabase.from("vouchers")
            .update({ uses_count: (appliedVoucher.uses_count || 0) + 1 })
            .eq("id", appliedVoucher.id);
        }

        const earnedPoints = qty * 50;
        const { data: profile } = await supabase.from("profiles").select("points").eq("id", user.id).single();
        const newPoints = (profile?.points || 0) + earnedPoints;
        await supabase.from("profiles").update({ points: newPoints }).eq("id", user.id);

        // Kirim Notifikasi
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: "Tiket Berhasil Dibeli! 🎫",
          message: `Pembelian ${qty} tiket untuk event ${event.title} sukses. Selamat menikmati!`,
          type: "success",
          is_read: false
        });

        toast(`Tiket GRATIS berhasil! +${earnedPoints} Poin! 🎉`, "success", 4000);
        router.push("/explore/tickets");
        return;
      }

      // ⚡ NORMAL FLOW — Midtrans
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          gross_amount: totalBayar,
          first_name: user.user_metadata?.full_name || "User",
          email: user.email,
          item_name: `${event.title} - ${selectedCategory.name}`,
          item_id: selectedCategory.id,
          quantity: qty
        })
      });

      const data = await response.json();
      if (!data.token) throw new Error(data.error || "Gagal dapet token!");

      const { data: txData, error: txError } = await supabase
        .from("transaksi")
        .insert({
          user_id: user.id,
          order_id: orderId,
          total_qty: qty,
          total_bayar: totalBayar,
          status_pembayaran: "pending",
          snap_token: data.token,
          event_id: event.id,
          category_id: selectedCategory.id
        })
        .select()
        .single();

      if (txError) throw txError;

      // @ts-ignore
      window.snap.pay(data.token, {
        onSuccess: async function (result: any) {
          try {
            await fetch("/api/payment/status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order_id: orderId })
            });
            
            const earnedPoints = qty * 50;
            toast(`Pembayaran berhasil! +${earnedPoints} Poin! 🎉`, "success", 4000);
            router.push("/explore/tickets"); 
          } catch (err) {
            console.error("Gagal sinkron status pembayaran:", err);
            toast("Sistem sedang memproses tiket Anda, cek Tiket Saya secara berkala!", "warning");
            router.push("/explore/tickets");
          }
        },
        onPending: () => { 
          toast("Pembayaran tertunda — selesaikan dalam 24 jam!", "warning");
          router.push("/explore/tickets");
        },
        onError: () => { 
          toast("Pembayaran gagal! Coba lagi.", "error"); 
          setIsProcessing(false); 
        },
        onClose: () => { 
          setIsProcessing(false);
          setShowUnpaidModal(true);
        }
      });

    } catch (error: any) {
      toast(`Gagal checkout! ${error.message}`, "error");
      setIsProcessing(false);
    }
  };

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  if (isLoading) return <CheckoutSkeleton />;

  return (
    <div className={`min-h-screen bg-[#FCFAF1] text-slate-900 noise ${poppins.className}`}>
      
      <nav className="w-full bg-white border-b-8 border-slate-900 h-20 flex items-center px-6 md:px-12 sticky top-0 z-50 shadow-[0_8px_0_0_#000]">
        <button onClick={() => router.back()} className="flex items-center gap-2 group border-2 border-transparent p-2 hover:border-slate-900 hover:bg-amber-400 transition-all">
          <ChevronLeft size={24} strokeWidth={4} />
          <span className="text-xl font-black italic uppercase tracking-tighter -skew-x-12 leading-none">KEMBALI</span>
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 sm:px-12 pt-12 pb-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-5xl md:text-7xl font-black italic uppercase -skew-x-6 drop-shadow-[4px_4px_0_#6D4AFF]">
            SECURE <span className="text-amber-400 drop-shadow-[4px_4px_0_#000]">TICKETS.</span>
          </h1>
          <p className="font-bold text-slate-500 mt-2 uppercase tracking-widest text-sm flex items-center gap-2 italic text-left">
            <Zap size={16} className="fill-amber-400 text-amber-400" /> Selesaikan pembayaran & dapet 50 poin/tiket!
          </p>
        </motion.div>

        {/* Neo-Brutalist Dynamic Urgency Alert Banner */}
        <div className="bg-[#FF3B30] text-white border-4 border-slate-900 p-4 mb-8 shadow-[6px_6px_0_0_#000] -skew-x-2 font-black uppercase text-xs sm:text-sm tracking-wider flex items-center justify-center gap-3 overflow-hidden min-h-[50px] text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={alertIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2"
            >
              {alertIndex === 0 && (
                <span>🔥 {liveViewers} orang sedang memilih tiket event ini sekarang!</span>
              )}
              {alertIndex === 1 && (
                <span>⚠️ BEBERAPA KATEGORI TIKET TERSISA SEDIKIT, SEGERA AMANKAN TEMPAT ANDA!</span>
              )}
              {alertIndex === 2 && (
                <span>⚡ DAPATKAN +50 POIN REWARD UNTUK SETIAP TIKET YANG ANDA BELI!</span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          <div className="flex-1 space-y-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white border-4 border-slate-900 brutal-shadow-card flex flex-col overflow-hidden text-left">
              <div className="h-64 bg-slate-900 relative border-b-4 border-slate-900">
                {event.image_url ? (
                   <img src={event.image_url} alt={event.title} className="w-full h-full object-cover opacity-70" />
                ) : <div className="w-full h-full bg-slate-200" />}
                <div className="absolute top-4 left-4 bg-amber-400 border-2 border-slate-900 px-3 py-1 font-black text-[10px] uppercase shadow-[2px_2px_0_0_#000] -rotate-2">
                  {event.category}
                </div>
              </div>
              <div className="p-8">
                <h2 className="text-3xl font-black italic uppercase -skew-x-6 tracking-tighter mb-6 underline decoration-4 decoration-[#6D4AFF]">{event.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 uppercase font-bold text-xs mb-8">
                  <div className="flex items-center gap-4 bg-slate-50 p-4 border-2 border-slate-900 shadow-[4px_4px_0_0_#000]">
                    <Calendar size={24} className="text-[#6D4AFF]"/>
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 p-4 border-2 border-slate-900 shadow-[4px_4px_0_0_#000]">
                    <MapPin size={24} className="text-amber-500"/>
                    <span>{event.location}</span>
                  </div>
                </div>

                {/* ⚡ MENAMPILKAN DESKRIPSI EVENT */}
                {event.description && (
                  <div className="border-t-4 border-slate-900 pt-6">
                    <h3 className="text-lg font-black italic uppercase text-slate-400 mb-2">Details</h3>
                    <div className="font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {event.description.replace(/--seating-enabled:\d+x\d+--/g, "").trim()}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <div className="bg-white border-4 border-slate-900 p-8 brutal-shadow-card text-left">
              <h3 className="text-2xl font-black italic uppercase -skew-x-6 tracking-tighter mb-6 flex items-center gap-3">
                <Tag size={28} className="text-[#6D4AFF]" /> PILIH TIER TIKET
              </h3>
              <div className="space-y-4">
                {(() => {
                  const getStockBadge = (stock: number) => {
                    if (stock === 0) {
                      return (
                        <span className="bg-slate-200 text-slate-700 border-2 border-slate-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0_0_rgba(0,0,0,1)] inline-block">
                          ⚫ HABIS / SOLD OUT
                        </span>
                      );
                    }
                    if (stock <= 20) {
                      return (
                        <span className="bg-red-500 text-white border-2 border-slate-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0_0_rgba(0,0,0,1)] inline-block animate-pulse">
                          🔴 HAMPIR HABIS! SEGERA AMANKAN!
                        </span>
                      );
                    }
                    if (stock <= 100) {
                      return (
                        <span className="bg-amber-400 text-black border-2 border-slate-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0_0_rgba(0,0,0,1)] inline-block">
                          🟡 STOK TERBATAS
                        </span>
                      );
                    }
                    return (
                      <span className="bg-emerald-400 text-black border-2 border-slate-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0_0_rgba(0,0,0,1)] inline-block">
                        🟢 STOK AMAN
                      </span>
                    );
                  };

                  return categories.map((cat) => (
                    <label key={cat.id} className={`block w-full border-4 p-5 cursor-pointer transition-all ${selectedCatId === cat.id ? "border-slate-900 bg-amber-400 shadow-[6px_6px_0_0_#000] translate-x-1 translate-y-1" : "border-slate-300 bg-white hover:border-slate-900"}`}>
                      <div className="flex items-center justify-between font-black">
                        <div className="flex items-center gap-4">
                          <input type="radio" name="ticketCategory" checked={selectedCatId === cat.id} onChange={() => setSelectedCatId(cat.id)} disabled={cat.stock <= 0} className="w-6 h-6 accent-slate-900 cursor-pointer" />
                          <div>
                            <p className="font-black italic uppercase text-xl leading-none">{cat.name}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Sisa Stok: {cat.stock} Pcs</p>
                              {getStockBadge(cat.stock)}
                            </div>
                          </div>
                        </div>
                        <p className="font-black italic text-2xl tracking-tighter">{formatRupiah(cat.price)}</p>
                      </div>
                    </label>
                  ));
                })()}
              </div>
            </div>

            {/* SEATING MAP SELECTOR */}
            {isSeatingEnabled && selectedCategory && qty > 0 && (
              <div className="bg-white border-4 border-slate-900 p-8 brutal-shadow-card text-left mt-8">
                <h3 className="text-2xl font-black italic uppercase -skew-x-6 tracking-tighter mb-2 flex items-center gap-3">
                  🎟️ PILIH KURSI ({selectedSeats.length}/{qty})
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 italic">
                  Silakan pilih {qty} kursi di area {selectedCategory.name.replace(/\s*\[.+\]/, "").toUpperCase()} (Baris berwarna putih).
                </p>
                <div className="bg-amber-400 border-3 border-slate-900 p-3 mb-6 shadow-[3px_3px_0_0_#000] font-black uppercase text-[10px] sm:text-xs tracking-wider flex items-center gap-2 italic text-slate-950">
                  <span>⚠️</span>
                  <span>LAYOUT ACARA BELUM TENTU SEPERTI DIGAMBAR (HANYA GAMBARAN). UNTUK HARI H AKAN DIARAHKAN OLEH PANITIA ACARA.</span>
                </div>

                {/* Seating Grid Map container */}
                <div className="border-4 border-slate-900 bg-slate-100 dark:bg-zinc-900 p-6 flex flex-col items-center gap-8 overflow-x-auto rounded-2xl shadow-[4px_4px_0_0_#000] min-w-full">
                  {/* Stage indicator */}
                  <div className="w-full max-w-md bg-slate-900 text-white font-black text-center py-2.5 uppercase tracking-widest -skew-x-3 text-xs border-4 border-black shadow-[3px_3px_0_0_#000]">
                    💻 STAGE / PANGGUNG UTAMA
                  </div>

                  {/* Seat grid */}
                  <div className="flex flex-col gap-3 min-w-max pb-2">
                    {Array.from({ length: seatingRows }).map((_, rIdx) => {
                      const rowChar = String.fromCharCode(65 + rIdx); // A, B, C...
                      const rowCategory = getCategoryForRow(rowChar);
                      const isMyCategory = rowCategory?.id === selectedCategory.id;

                      return (
                        <div key={rowChar} className="flex items-center gap-4">
                          {/* Row label left */}
                          <span className="w-6 text-center font-black text-base text-slate-900 dark:text-zinc-100">{rowChar}</span>

                          {/* Row seats */}
                          <div className="flex gap-2">
                            {Array.from({ length: seatingCols }).map((_, cIdx) => {
                              const seatNum = cIdx + 1;
                              const seatId = `${rowChar}${seatNum}`;
                              const fullSeatLabel = `${rowCategory?.name || 'REGULAR'} - ${seatId}`;
                              
                              // Check if seat is booked
                              const isBooked = bookedSeats.some(
                                s => s === fullSeatLabel || s === seatId || s.endsWith(`- ${seatId}`)
                              );

                              // Check if seat is selected
                              const isSelected = selectedSeats.includes(seatId);

                              // Seat styling
                              let seatClass = "w-9 h-9 border-3 text-[10px] font-black flex items-center justify-center transition-all ";
                              if (isBooked) {
                                seatClass += "bg-[#FF3B30] text-white border-slate-900 cursor-not-allowed shadow-none select-none opacity-80";
                              } else if (!isMyCategory) {
                                seatClass += "bg-slate-200/50 text-slate-400 border-slate-300 dark:border-zinc-800 cursor-not-allowed shadow-none";
                              } else if (isSelected) {
                                seatClass += "bg-amber-400 hover:bg-amber-300 text-slate-900 border-slate-900 shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5";
                              } else {
                                seatClass += "bg-white hover:bg-emerald-300 text-slate-900 border-slate-900 shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5";
                              }

                              return (
                                <button
                                  key={seatId}
                                  type="button"
                                  disabled={isBooked || !isMyCategory}
                                  onClick={() => {
                                    if (selectedSeats.includes(seatId)) {
                                      setSelectedSeats(prev => prev.filter(s => s !== seatId));
                                    } else {
                                      if (selectedSeats.length < qty) {
                                        setSelectedSeats(prev => [...prev, seatId]);
                                      } else {
                                        // rolling selection
                                        setSelectedSeats(prev => [...prev.slice(1), seatId]);
                                      }
                                    }
                                  }}
                                  className={`${seatClass} rounded-lg`}
                                  title={isBooked ? `Kursi ${seatId} (Terisi)` : !isMyCategory ? `Kursi ${seatId} (${rowCategory?.name.replace(/\s*\[.+\]/, "") || 'Kategori Lain'})` : `Pilih Kursi ${seatId}`}
                                >
                                  {isBooked ? "✕" : seatId}
                                </button>
                              );
                            })}
                          </div>

                          {/* Row label right */}
                          <span className="w-6 text-center font-black text-base text-slate-900 dark:text-zinc-100">{rowChar}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-5 justify-center border-t-2 border-dashed border-black/20 pt-4 w-full text-[10px] font-black uppercase text-slate-700 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-white border-2 border-black rounded-md" />
                      <span>Tersedia ({selectedCategory.name.replace(/\s*\[.+\]/, "")})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-amber-400 border-2 border-black rounded-md" />
                      <span>Dipilih</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-[#FF3B30] border-2 border-black rounded-md" />
                      <span>Terisi (Booked)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-slate-200/50 border-2 border-slate-350 rounded-md" />
                      <span>Tier Lain (Disabled)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[450px]">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white border-4 border-slate-900 p-8 brutal-shadow-card flex flex-col h-full sticky top-24 text-left">
              {/* Neo-Brutalist Expiry Timer Box */}
              <div className={`border-4 border-slate-900 p-4 mb-6 shadow-[4px_4px_0_0_#000] font-black uppercase text-xs sm:text-sm tracking-wider flex items-center justify-between gap-3 ${
                timeLeft <= 120 ? "bg-[#FF3B30] text-white animate-pulse" : "bg-amber-400 text-slate-900"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏳</span>
                  <span>SISA WAKTU:</span>
                </div>
                <span className="font-mono text-lg tracking-widest bg-white text-black border-2 border-black px-2.5 py-0.5 shadow-[2px_2px_0_0_#000] shrink-0">
                  {(() => {
                    const mins = Math.floor(timeLeft / 60);
                    const secs = timeLeft % 60;
                    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
                  })()}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-8 border-b-4 border-slate-900 pb-4">
                <Ticket size={32} strokeWidth={3} className="text-[#6D4AFF]" />
                <h3 className="text-3xl font-black italic uppercase -skew-x-6 tracking-tighter">SUMMARY</h3>
              </div>

              <AnimatePresence mode="wait">
                {availableUserQuota === 0 ? (
                  <motion.div key="limit" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-red-500 text-white border-4 border-black p-5 mb-8 rotate-1 flex items-start gap-3 shadow-[6px_6px_0_0_#000]">
                    <AlertOctagon size={32} strokeWidth={3} className="shrink-0" />
                    <div>
                      <p className="font-black italic uppercase text-lg leading-tight">LIMIT HABIS!</p>
                      <p className="text-[10px] font-bold uppercase mt-1 italic">Maks beli {maxBuyPerUser} tiket/akun. udah beli {alreadyBought}.</p>
                    </div>
                  </motion.div>
                ) : stockAvailable === 0 ? (
                  <motion.div key="soldout" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 text-white border-4 border-black p-5 mb-8 -rotate-1 text-center">
                    <p className="font-black italic uppercase text-lg">TIKET SOLD OUT!</p>
                  </motion.div>
                ) : (
                  <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center justify-between mb-8 bg-slate-50 p-4 border-2 border-slate-900 shadow-[4px_4px_0_0_#000]">
                      <div>
                        <span className="font-black uppercase text-[10px] text-slate-400 block tracking-widest italic">JUMLAH BELI</span>
                        <span className="font-black text-emerald-500 text-[10px] uppercase italic">Sisa Jatah: {availableUserQuota}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 bg-white border-4 border-slate-900 font-black text-2xl hover:bg-amber-400 transition-colors">-</button>
                        <span className="font-black text-2xl w-8 text-center">{qty}</span>
                        <button onClick={() => setQty(Math.min(absoluteMaxQty, qty + 1))} className="w-10 h-10 bg-white border-4 border-slate-900 font-black text-2xl hover:bg-amber-400 transition-colors">+</button>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8 font-black uppercase italic text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>{selectedCategory?.name} x {qty}</span>
                        <span>{formatRupiah((selectedCategory?.price || 0) * qty)}</span>
                      </div>
                      {appliedVoucher && (
                        <div className="flex justify-between text-red-500 bg-red-50 p-2 border-2 border-red-200">
                          <span>DISKON ({appliedVoucher.code})</span>
                          <span>- {formatRupiah(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-emerald-500 bg-emerald-50 p-2 border-2 border-emerald-200">
                        <span>ESTIMASI REWARDS</span>
                        <span>+ {qty * 50} PTS</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* VOUCHER PROMO BOX */}
              {availableUserQuota > 0 && stockAvailable > 0 && (
                <div className="border-t-4 border-slate-900 pt-6 mb-6">
                  <span className="font-black uppercase text-[10px] text-slate-400 block tracking-widest italic mb-2">VOUCHER PROMO</span>
                  {!appliedVoucher ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={voucherCodeInput} 
                        onChange={(e) => setVoucherCodeInput(e.target.value)} 
                        placeholder="KODE VOUCHER" 
                        className="flex-1 bg-white border-2 border-slate-900 p-2 font-bold uppercase placeholder-slate-400 text-xs focus:outline-none" 
                      />
                      <button 
                        onClick={handleApplyVoucher} 
                        disabled={isVoucherChecking} 
                        className="bg-amber-400 hover:bg-amber-300 text-slate-900 border-2 border-slate-900 px-4 py-2 font-black text-xs italic uppercase shadow-[2px_2px_0_0_#000]"
                      >
                        {isVoucherChecking ? "CEK..." : "APPLY"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-100 border-2 border-emerald-500 p-3 font-bold text-xs">
                      <div>
                        <span className="text-emerald-700 font-black">{appliedVoucher.code.toUpperCase()} TERAPLIKASI!</span>
                        <p className="text-[10px] text-emerald-600 mt-0.5">
                          Potongan: {appliedVoucher.discount_type === "percentage" ? `${appliedVoucher.discount_value}%` : formatRupiah(appliedVoucher.discount_value)}
                        </p>
                      </div>
                      <button 
                        onClick={handleRemoveVoucher} 
                        className="bg-red-500 text-white border-2 border-slate-900 px-2 py-1 text-[10px] font-black uppercase hover:bg-red-600 transition-colors"
                      >
                        BATAL
                      </button>
                    </div>
                  )}
                  {voucherError && (
                    <p className="text-[10px] font-black text-red-500 mt-2 uppercase italic">{voucherError}</p>
                  )}
                </div>
              )}

              <div className="mt-auto border-t-4 border-slate-900 pt-6 mb-8">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">TOTAL TAGIHAN</p>
                <p className="text-5xl font-black text-[#6D4AFF] italic tracking-tighter leading-none drop-shadow-[2px_2px_0_#FBBF24]">
                  {formatRupiah(totalBayar)}
                </p>
              </div>

              <button 
                onClick={handleCheckout} 
                disabled={
                  isProcessing || 
                  absoluteMaxQty === 0 || 
                  isExpired || 
                  (isSeatingEnabled && selectedSeats.length !== qty)
                } 
                className={`w-full border-4 border-slate-900 p-6 font-black text-2xl italic uppercase brutal-shadow-btn -skew-x-6 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                  totalBayar === 0 && absoluteMaxQty > 0
                    ? "bg-emerald-400 text-slate-900 hover:bg-emerald-300" 
                    : "bg-amber-400 text-slate-900 hover:bg-amber-300"
                }`}
              >
                {isProcessing 
                  ? <><Loader2 className="animate-spin" size={28} strokeWidth={4} /> PROSES...</> 
                  : stockAvailable === 0
                    ? "SOLD OUT"
                    : absoluteMaxQty === 0 
                      ? "LIMIT HABIS"
                      : isExpired
                        ? "WAKTU HABIS"
                        : isSeatingEnabled && selectedSeats.length !== qty
                          ? `PILIH KURSINYA DULU (Kurang ${qty - selectedSeats.length})`
                          : totalBayar === 0 
                            ? <><CheckCircle size={28} strokeWidth={3} /> KLAIM GRATIS!</>
                            : <><CreditCard size={28} strokeWidth={3} /> BAYAR SEKARANG</>
                }
              </button>

              <div className="mt-8 flex items-center justify-center gap-3 text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                <ShieldCheck size={20} strokeWidth={3} /> TRANSAKSI ENKRIPSI 100% AMAN
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* TIMEOUT EXPIRED MODAL */}
      <AnimatePresence>
        {isExpired && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-[#FCFAF1] border-8 border-slate-900 p-8 max-w-md w-full relative z-[60] shadow-[12px_12px_0_0_#000] -rotate-1 text-slate-900 text-center"
            >
              <div className="w-20 h-20 bg-red-500 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 rotate-12 shadow-[4px_4px_0_0_#000]">
                <span className="text-4xl text-white">⏳</span>
              </div>
              <h3 className="text-3xl font-black italic -skew-x-6 uppercase tracking-tighter mb-2 text-red-500 drop-shadow-[1px_1px_0px_#000]">
                WAKTU HABIS! ⏳
              </h3>
              <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-6 leading-relaxed">
                Sesi pemesanan tiket Anda telah kedaluwarsa (melebihi 10 menit). Silakan ulangi pemesanan Anda dari halaman explore.
              </p>
              
              <button
                onClick={() => {
                  if (user && eventId) {
                    sessionStorage.removeItem(`checkout_start_${user.id}_${eventId}`);
                  }
                  router.push("/explore");
                }}
                className="w-full bg-[#FF3B30] text-white border-4 border-black py-3 font-black text-sm uppercase tracking-wider shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-red-600"
              >
                KEMBALI KE EXPLORE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#FCFAF1] border-8 border-slate-900 p-8 max-w-md w-full relative z-[60] shadow-[12px_12px_0_0_#000] -rotate-1 text-slate-900 text-center"
            >
              <div className="w-20 h-20 bg-[#6D4AFF] border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 rotate-12 shadow-[4px_4px_0_0_#000]">
                <span className="text-4xl text-white">🎟️</span>
              </div>
              <h3 className="text-3xl font-black italic -skew-x-6 uppercase tracking-tighter mb-2 text-[#6D4AFF] drop-shadow-[1px_1px_0px_#000]">
                KONFIRMASI PEMESANAN
              </h3>
              <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-6 leading-relaxed">
                Apakah Anda yakin untuk membeli tiket ini? Dengan melanjutkan, transaksi Anda akan otomatis tercatat sebagai tagihan aktif di sistem kami.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={executeCheckout}
                  className="flex-1 bg-[#6D4AFF] text-white border-4 border-black py-3 font-black text-sm uppercase tracking-wider shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-violet-700"
                >
                  YA, LANJUTKAN
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-white text-slate-900 border-4 border-black py-3 font-black text-sm uppercase tracking-wider shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-slate-100"
                >
                  BATAL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UNPAID ALERT MODAL */}
      <AnimatePresence>
        {showUnpaidModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUnpaidModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#FCFAF1] border-8 border-slate-900 p-8 max-w-md w-full relative z-[60] shadow-[12px_12px_0_0_#000] rotate-1 text-slate-900 text-center"
            >
              <div className="w-20 h-20 bg-amber-400 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 -rotate-12 shadow-[4px_4px_0_0_#000]">
                <span className="text-4xl text-black">⏳</span>
              </div>
              <h3 className="text-3xl font-black italic -skew-x-6 uppercase tracking-tighter mb-2 text-amber-500 drop-shadow-[1px_1px_0px_#000]">
                PEMBAYARAN DITUNDA
              </h3>
              <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-6 leading-relaxed">
                Anda belum menyelesaikan pembayaran. Tagihan untuk pemesanan ini telah terdaftar di sistem. Anda dapat membayar atau menyelesaikan transaksi kapan saja melalui menu "Tiket Saya" atau "Riwayat Pembayaran".
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowUnpaidModal(false);
                    router.push("/explore/tickets");
                  }}
                  className="w-full bg-amber-400 text-slate-900 border-4 border-black py-3 font-black text-sm uppercase tracking-wider shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-amber-500"
                >
                  LIHAT TIKET SAYA
                </button>
                <button
                  onClick={() => {
                    setShowUnpaidModal(false);
                  }}
                  className="w-full bg-white text-slate-900 border-4 border-black py-3 font-black text-sm uppercase tracking-wider shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-slate-100"
                >
                  TUTUP
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}