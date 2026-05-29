"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  X, Send, Loader2, MessageSquare, Car, 
  Plus, Phone, Clock, ArrowRight, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  userProfile: {
    id: string;
    full_name: string;
    avatar_url: string;
  } | null;
}

interface ChatMessage {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  avatar_url: string;
  message: string;
  type: "text" | "ride";
  created_at: string;
  badge?: {
    id: string;
    name: string;
    icon: string;
  };
}



const getBadgePillStyles = (badgeId: string) => {
  switch (badgeId) {
    case "legend":
      return "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 border-yellow-600 font-extrabold shadow-[1px_1px_0_0_#000] rotate-[-1deg]";
    case "gold":
      return "bg-yellow-400 text-black border-yellow-600 shadow-[1px_1px_0_0_#000]";
    case "silver":
      return "bg-slate-200 text-slate-800 border-slate-400 dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600 shadow-[1px_1px_0_0_#000]";
    case "newbie":
      return "bg-[#6D4AFF]/10 dark:bg-[#6D4AFF]/20 text-[#6D4AFF] dark:text-[#a58dff] border-[#6D4AFF]/30";
    case "festival":
      return "bg-rose-500 text-white border-rose-700 shadow-[1.5px_1.5px_0_0_#000] rotate-[1deg]";
    case "critic":
      return "bg-cyan-500 text-white border-cyan-700 shadow-[1.5px_1.5px_0_0_#000] rotate-[-1deg]";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
  }
};

const getBubbleStyles = (isMe: boolean, badgeId?: string) => {
  if (isMe) {
    if (badgeId === "legend") {
      return "bg-[#6D4AFF] text-white border-amber-400 dark:border-amber-400 shadow-[4px_4px_0_0_#FBBF24] rounded-br-none";
    }
    if (badgeId === "gold") {
      return "bg-[#6D4AFF] text-white border-yellow-500 shadow-[3.5px_3.5px_0_0_#EAB308] rounded-br-none";
    }
    if (badgeId === "festival") {
      return "bg-[#FF5E3A] text-white border-slate-900 shadow-[3.5px_3.5px_0_0_#FCD34D] rounded-br-none";
    }
    if (badgeId === "critic") {
      return "bg-[#06B6D4] text-white border-slate-900 shadow-[3.5px_3.5px_0_0_#0891B2] rounded-br-none";
    }
    return "bg-[#6D4AFF] text-white border-slate-900 shadow-[2.5px_2.5px_0_0_#000] rounded-br-none";
  } else {
    if (badgeId === "legend") {
      return "bg-slate-900 text-white dark:bg-zinc-900 border-amber-400 shadow-[4px_4px_0_0_#FBBF24] rounded-bl-none";
    }
    if (badgeId === "gold") {
      return "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border-yellow-500 shadow-[3.5px_3.5px_0_0_#EAB308] rounded-bl-none";
    }
    if (badgeId === "festival") {
      return "bg-[#FFF5F2] dark:bg-zinc-900/90 text-slate-900 dark:text-zinc-100 border-[#FF5E3A] shadow-[3.5px_3.5px_0_0_#FF5E3A] rounded-bl-none";
    }
    if (badgeId === "critic") {
      return "bg-cyan-50 dark:bg-zinc-900/90 text-slate-900 dark:text-zinc-100 border-[#06B6D4] shadow-[3.5px_3.5px_0_0_#06B6D4] rounded-bl-none";
    }
    return "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border-slate-900 dark:border-zinc-800 shadow-[2.5px_2.5px_0_0_#000] rounded-bl-none";
  }
};

export default function ChatDrawer({ isOpen, onClose, eventId, eventTitle, userProfile }: ChatDrawerProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "RIDE">("ALL");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [useMock, setUseMock] = useState(false);



  // Form Tebengan States
  const [showRideForm, setShowRideForm] = useState(false);
  const [rideRoute, setRideRoute] = useState("");
  const [rideSlots, setRideSlots] = useState(2);
  const [ridePhone, setRidePhone] = useState("");
  const [rideNotes, setRideNotes] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helper to scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Load local storage fallback messages
  const getLocalMessages = useCallback((): ChatMessage[] => {
    const key = `mock_chats_${eventId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [eventId]);

  const saveLocalMessage = useCallback((msg: ChatMessage) => {
    const key = `mock_chats_${eventId}`;
    const current = getLocalMessages();
    const next = [...current, msg];
    localStorage.setItem(key, JSON.stringify(next));
    setMessages(next);
    scrollToBottom();
  }, [eventId, getLocalMessages]);

  // Load messages from Supabase or localStorage fallback
  const fetchMessages = useCallback(async (quiet = false) => {
    if (!eventId) return;
    if (!quiet) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", `chat_messages_${eventId}`)
        .maybeSingle();

      if (error) {
        if (!quiet) {
          console.warn("Supabase site_settings error, switching to Mock Local Storage:", error.message);
          setUseMock(true);
          setMessages(getLocalMessages());
        }
      } else if (data && data.value) {
        setUseMock(false);
        const newChats = data.value as ChatMessage[];
        setMessages((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(newChats)) return prev;
          // Smooth scroll to bottom on new messages
          setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 50);
          return newChats;
        });
      } else {
        setUseMock(false);
        setMessages([]);
      }
    } catch (err) {
      if (!quiet) {
        console.warn("Failed to fetch from supabase, fallback to local storage:", err);
        setUseMock(true);
        setMessages(getLocalMessages());
      }
    } finally {
      if (!quiet) {
        setIsLoading(false);
        scrollToBottom();
      }
    }
  }, [eventId, getLocalMessages]);

  // Real-time subscription & polling setup
  useEffect(() => {
    if (!isOpen || !eventId) return;

    fetchMessages();

    // 1. Subscribe to all changes (INSERT, UPDATE, DELETE) on site_settings
    let channel: any = null;
    if (!useMock) {
      channel = supabase
        .channel(`chat_messages_${eventId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "site_settings",
            filter: `key=eq.chat_messages_${eventId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              const newValue = payload.new?.value;
              if (Array.isArray(newValue)) {
                const newChats = newValue as ChatMessage[];
                setMessages((prev) => {
                  if (JSON.stringify(prev) === JSON.stringify(newChats)) return prev;
                  return newChats;
                });
                scrollToBottom();
              }
            } else if (payload.eventType === "DELETE") {
              setMessages([]);
            }
          }
        )
        .subscribe();
    }

    // 2. Polling Fallback (Guaranteed sync every 2.5 seconds)
    const pollInterval = setInterval(() => {
      fetchMessages(true);
    }, 2500);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      clearInterval(pollInterval);
    };
  }, [isOpen, eventId, useMock, fetchMessages]);



  const handleSendMessage = async (e?: React.FormEvent, type: "text" | "ride" = "text", customMessage?: string) => {
    if (e) e.preventDefault();
    
    const rawContent = customMessage || inputValue;
    if (!rawContent.trim() || !userProfile) return;

    setIsSending(true);

    let badgeObj = undefined;
    const activeBadgeSaved = localStorage.getItem(`tiketin_active_badge_${userProfile.id}`);
    if (activeBadgeSaved) {
      try {
        badgeObj = JSON.parse(activeBadgeSaved);
      } catch (e) {
        // ignore
      }
    }

    const messagePayload: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      event_id: eventId,
      user_id: userProfile.id,
      user_name: userProfile.full_name,
      avatar_url: userProfile.avatar_url || "",
      message: rawContent,
      type: type,
      created_at: new Date().toISOString(),
      badge: badgeObj,
    };

    if (useMock) {
      // Local Storage Mock logic
      saveLocalMessage(messagePayload);
      setInputValue("");
      setIsSending(false);
    } else {
      try {
        // Fetch current array
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", `chat_messages_${eventId}`)
          .maybeSingle();

        const currentChats = data && Array.isArray(data.value) ? data.value : [];
        const updatedChats = [...currentChats, messagePayload];

        // Limit history to 150 messages
        if (updatedChats.length > 150) {
          updatedChats.shift();
        }

        const { error } = await supabase
          .from("site_settings")
          .upsert({
            key: `chat_messages_${eventId}`,
            value: updatedChats,
          });

        if (error) {
          console.warn("Supabase upsert failed, logging to Local Storage instead:", error.message);
          setUseMock(true);
          saveLocalMessage(messagePayload);
        } else {
          setInputValue("");
        }
      } catch (err) {
        console.warn("Supabase error inserting message:", err);
      } finally {
        setIsSending(false);
        scrollToBottom();
      }
    }
  };

  const handleCreateRidePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rideRoute || !ridePhone) return;

    const ridePayload = {
      route: rideRoute,
      slots: rideSlots,
      phone: ridePhone,
      notes: rideNotes,
    };

    // Serialize object to string
    const serializedMessage = JSON.stringify(ridePayload);
    handleSendMessage(undefined, "ride", serializedMessage);

    // Reset Form
    setRideRoute("");
    setRideSlots(2);
    setRidePhone("");
    setRideNotes("");
    setShowRideForm(false);
    setActiveTab("RIDE");
  };

  // Format WhatsApp Link
  const getWhatsAppUrl = (phone: string, route: string) => {
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Halo! Saya tertarik dengan tawaran tebengan Anda untuk rute: ${route} di aplikasi Tiketin. Apakah masih ada slot kosong?`
    )}`;
  };

  // Filter messages based on tab
  const filteredMessages = messages.filter((msg) => {
    if (activeTab === "RIDE") return msg.type === "ride";
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 150 }}
            className="relative w-full max-w-md h-full bg-[#FCFAF1] dark:bg-zinc-950 border-l-8 border-slate-900 dark:border-zinc-800 shadow-[-10px_0_0_0_rgba(0,0,0,0.15)] flex flex-col z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b-4 border-slate-900 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center">
              <div className="text-left">
                <h3 className="text-lg font-black italic uppercase -skew-x-6 text-slate-900 dark:text-white leading-none">
                  CHAT KOMUNITAS
                </h3>
                <p className="text-[9px] font-black uppercase text-[#6D4AFF] dark:text-[#8a6eff] tracking-wider mt-1.5 truncate max-w-[280px]">
                  🚀 {eventTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 border-3 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white hover:bg-red-500 hover:text-white shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all rounded-xl"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            {/* Mode Fallback Alert */}
            {useMock && (
              <div className="bg-amber-400 border-b-4 border-slate-900 p-2.5 px-4 flex items-center gap-2 text-slate-900 font-bold text-[9.5px] uppercase tracking-wider text-left">
                <AlertCircle size={14} className="shrink-0" />
                <span>Mode Offline: Percakapan disimpan secara lokal di browser Anda.</span>
              </div>
            )}

            {/* Tabs & Buttons */}
            <div className="p-4 border-b-4 border-slate-900 dark:border-zinc-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-zinc-900/50">
              <div className="flex border-3 border-slate-900 dark:border-zinc-700 rounded-xl overflow-hidden shadow-[2px_2px_0_0_#000]">
                <button
                  onClick={() => { setActiveTab("ALL"); setShowRideForm(false); }}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeTab === "ALL"
                      ? "bg-[#6D4AFF] text-white"
                      : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400"
                  }`}
                >
                  💬 SEMUA
                </button>
                <button
                  onClick={() => { setActiveTab("RIDE"); setShowRideForm(false); }}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeTab === "RIDE"
                      ? "bg-[#6D4AFF] text-white"
                      : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400"
                  }`}
                >
                  🚗 TEBENGAN
                </button>
              </div>

              <button
                onClick={() => setShowRideForm(!showRideForm)}
                className="px-3 py-2 bg-amber-400 hover:bg-white text-slate-900 border-3 border-slate-900 dark:border-zinc-700 font-black uppercase text-[10px] shadow-[2.5px_2.5px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all rounded-xl flex items-center gap-1.5"
              >
                {showRideForm ? <MessageSquare size={12} strokeWidth={3} /> : <Car size={12} strokeWidth={3} />}
                {showRideForm ? "LIHAT CHAT" : "POST TEBENGAN"}
              </button>
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50 dark:bg-zinc-950/30 brutal-scroll relative flex flex-col">


              {showRideForm ? (
                /* Ride Share Form */
                <form onSubmit={handleCreateRidePost} className="space-y-4 bg-white dark:bg-zinc-900 border-4 border-slate-900 dark:border-zinc-800 p-5 shadow-[4px_4px_0_0_#000] rounded-2xl text-left my-auto">
                  <h4 className="text-sm font-black uppercase italic -skew-x-3 text-[#6D4AFF] mb-2 flex items-center gap-1.5">
                    <Car size={16} strokeWidth={3} /> TAWARKAN TEBENGAN
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">RUTE / TUJUAN PERJALANAN</label>
                    <input
                      required
                      placeholder="Contoh: Dago ke Lapangan Siliwangi"
                      value={rideRoute}
                      onChange={(e) => setRideRoute(e.target.value)}
                      className="w-full h-11 border-3 border-slate-900 dark:border-zinc-700 rounded-xl px-3 font-bold text-xs uppercase bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">SLOT KOSONG</label>
                      <select
                        value={rideSlots}
                        onChange={(e) => setRideSlots(Number(e.target.value))}
                        className="w-full h-11 border-3 border-slate-900 dark:border-zinc-700 rounded-xl px-3 font-bold text-xs bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <option key={num} value={num}>
                            {num} Kursi
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">NO. WHATSAPP (AKTIF)</label>
                      <input
                        required
                        type="tel"
                        placeholder="Contoh: 0812345678"
                        value={ridePhone}
                        onChange={(e) => setRidePhone(e.target.value)}
                        className="w-full h-11 border-3 border-slate-900 dark:border-zinc-700 rounded-xl px-3 font-bold text-xs bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">CATATAN TAMBAHAN</label>
                    <textarea
                      placeholder="Contoh: Berangkat jam 16.00 dari McD, patungan bensin."
                      value={rideNotes}
                      onChange={(e) => setRideNotes(e.target.value)}
                      rows={2}
                      className="w-full border-3 border-slate-900 dark:border-zinc-700 rounded-xl p-3 font-bold text-xs bg-[#FCFAF1] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 bg-amber-400 hover:bg-[#6D4AFF] hover:text-white text-slate-900 border-3 border-slate-900 font-black uppercase text-xs tracking-wider shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all rounded-xl"
                  >
                    POSTING SEKARANG
                  </button>
                </form>
              ) : (
                /* Chat Messages list */
                <div className="space-y-4 flex-1">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-slate-500 text-xs font-bold italic">
                      <Loader2 className="animate-spin text-[#6D4AFF]" size={28} />
                      MEMBUKA OBROLAN...
                    </div>
                  ) : filteredMessages.length > 0 ? (
                    filteredMessages.map((msg) => {
                      const isMe = msg.user_id === userProfile?.id;
                      let rideData = null;

                      if (msg.type === "ride") {
                        try {
                          rideData = JSON.parse(msg.message);
                        } catch (e) {
                          // fallback
                        }
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 items-end text-left ${isMe ? "flex-row-reverse" : "flex-row"}`}
                        >
                          {/* Avatar */}
                          {!isMe && (
                            <div className="h-7 w-7 rounded-full border-2 border-slate-900 dark:border-zinc-700 bg-[#6D4AFF] text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_#000] overflow-hidden select-none">
                              {msg.avatar_url ? (
                                <img src={msg.avatar_url} alt={msg.user_name} className="w-full h-full object-cover" />
                              ) : (
                                msg.user_name ? msg.user_name.charAt(0).toUpperCase() : "U"
                              )}
                            </div>
                          )}

                          <div className={`max-w-[75%] space-y-1`}>
                            {/* User name & Time */}
                            <div className={`flex items-center gap-1.5 text-[8.5px] font-black uppercase text-slate-400 ${isMe ? "justify-end" : "justify-start"} flex-wrap`}>
                              <span>{isMe ? "SAYA" : msg.user_name}</span>
                              {msg.badge && (
                                <span className={`text-[7px] font-black uppercase tracking-wider px-1 py-0.5 border rounded-sm flex items-center gap-0.5 ${getBadgePillStyles(msg.badge.id)}`}>
                                  <span>{msg.badge.icon}</span>
                                  <span className="text-[6.5px]">{msg.badge.name}</span>
                                </span>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Clock size={8} />
                                {new Date(msg.created_at).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            {/* Message bubble */}
                            {msg.type === "ride" && rideData ? (
                              /* Ride Sharing Message Card styling */
                              <div className="bg-amber-300 dark:bg-amber-400 border-3 border-slate-900 text-slate-900 p-4 shadow-[3px_3px_0_0_#000] rounded-2xl space-y-2 flex flex-col">
                                <span className="bg-slate-900 text-amber-400 font-black text-[7.5px] uppercase tracking-widest px-2 py-0.5 border border-white self-start flex items-center gap-1 rounded">
                                  <Car size={9} strokeWidth={3} /> TAWARAN TEBENGAN
                                </span>
                                <div className="text-xs space-y-1">
                                  <p className="font-black uppercase tracking-tight text-slate-950 flex items-center gap-1 leading-snug">
                                    <ArrowRight size={10} strokeWidth={3} className="text-[#6D4AFF]" /> Rute: {rideData.route}
                                  </p>
                                  <p className="font-extrabold text-slate-900 text-[10px]">
                                    Sisa Kursi: <span className="underline decoration-2 font-black text-slate-950">{rideData.slots} Kursi</span>
                                  </p>
                                  {rideData.notes && (
                                    <p className="italic text-[10px] font-semibold text-slate-800 bg-white/40 p-1.5 border border-dashed border-slate-800 rounded">
                                      "{rideData.notes}"
                                    </p>
                                  )}
                                </div>
                                <a
                                  href={getWhatsAppUrl(rideData.phone, rideData.route)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full py-2 bg-slate-900 hover:bg-[#6D4AFF] text-white font-black text-[9px] uppercase tracking-wider border-2 border-slate-900 hover:border-slate-900 transition-all flex items-center justify-center gap-1 rounded-xl shadow-[1.5px_1.5px_0_0_#fff]"
                                >
                                  <Phone size={10} strokeWidth={3} /> HUBUNGI VIA WA
                                </a>
                              </div>
                            ) : (
                              /* Text Message bubble */
                              <div
                                className={`p-3.5 border-3 text-xs font-semibold leading-relaxed break-words transition-all ${getBubbleStyles(isMe, msg.badge?.id)}`}
                              >
                                {msg.message}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-zinc-600 gap-3 my-auto">
                      <MessageSquare size={36} strokeWidth={2} />
                      <p className="font-black italic text-sm uppercase">BELUM ADA OBROLAN</p>
                      <p className="text-[10px] font-bold uppercase max-w-[240px] text-center">
                        {activeTab === "RIDE" 
                          ? "Jadilah orang pertama yang menawarkan tebengan bareng penonton lain!"
                          : "Jadilah orang pertama yang menyapa penonton lain di grup chat resmi event ini!"
                        }
                      </p>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Input Footer Area */}
            {!showRideForm && (
              <div className="p-4 bg-white dark:bg-zinc-900 border-t-4 border-slate-900 dark:border-zinc-800">
                <form onSubmit={handleSendMessage} className="flex gap-2.5 items-center">
                  <input
                    disabled={!userProfile || isSending}
                    placeholder={userProfile ? "Tulis sesuatu di sini..." : "Login untuk berkontribusi..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 h-12 px-4 border-3 border-slate-900 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-bold text-xs uppercase outline-none focus:bg-[#FCFAF1] rounded-xl"
                  />
                  <button
                    disabled={isSending || !inputValue.trim()}
                    type="submit"
                    className="h-12 w-12 bg-amber-400 hover:bg-[#6D4AFF] text-slate-900 hover:text-white border-3 border-slate-900 dark:border-zinc-700 flex items-center justify-center shadow-[2.5px_2.5px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all shrink-0 rounded-xl disabled:opacity-40 disabled:hover:bg-amber-400 disabled:hover:text-slate-900 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[2.5px_2.5px_0_0_#000]"
                  >
                    {isSending ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Send size={16} strokeWidth={3} />
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
