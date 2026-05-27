"use client";

import React, { useEffect, useState } from "react";
import { Bell, Info, CheckCircle2, AlertTriangle, Check, BellOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { playNotification } from "@/lib/soundEffects";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId?: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      // Fetch latest 10 notifications
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);

      // Fetch unread count (not limited to 10)
      const { count, error: countError } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (countError) throw countError;
      setUnreadCount(count || 0);
    } catch (err) {
      console.error("Gagal memuat notifikasi:", err);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // Setup realtime subscription
    const channel = supabase
      .channel(`realtime:notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Play notification sound if new message is inserted
          if (payload.eventType === "INSERT") {
            playNotification();
          }
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Gagal menandai dibaca:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Gagal menandai semua dibaca:", err);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins}m lalu`;
    if (diffHours < 24) return `${diffHours}jam lalu`;
    return `${diffDays}h lalu`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="text-emerald-500 shrink-0" size={16} strokeWidth={3} />;
      case "warning":
        return <AlertTriangle className="text-amber-500 shrink-0" size={16} strokeWidth={3} />;
      default:
        return <Info className="text-blue-500 shrink-0" size={16} strokeWidth={3} />;
    }
  };

  if (!userId) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        className="border-4 border-slate-900 shadow-[4px_4px_0_0_#000] dark:border-zinc-700 dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)] rounded-none opacity-50"
      >
        <Bell className="h-[1.2rem] w-[1.2rem]" strokeWidth={3} />
      </Button>
    );
  }

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-4 border-slate-900 shadow-[4px_4px_0_0_#000] dark:border-zinc-700 dark:shadow-[4px_4px_0_0_var(--primary-color,#6D4AFF)] rounded-none bg-white dark:bg-zinc-900 cursor-pointer relative hover:scale-105 active:scale-95 transition-all"
        >
          <motion.div
            animate={unreadCount > 0 ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
            transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
          >
            <Bell className="h-[1.2rem] w-[1.2rem] text-slate-900 dark:text-zinc-50" strokeWidth={3} />
          </motion.div>
          {unreadCount > 0 && (
            <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white border-2 border-slate-900 dark:border-zinc-700 rounded-none text-[10px] font-black h-6 min-w-6 px-1 flex items-center justify-center shadow-[2px_2px_0_0_#000]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 sm:w-96 mt-2 border-4 border-slate-900 dark:border-zinc-700 rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_var(--primary-color)] p-2 bg-white dark:bg-zinc-900 z-[60]">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel className="font-black italic uppercase text-sm tracking-tight text-slate-900 dark:text-zinc-50">
            Notifikasi
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[10px] font-black italic uppercase text-rose-500 hover:text-rose-600 transition-colors border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 shadow-[2px_2px_0_0_#F43F5E] cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
            >
              Baca Semua
            </button>
          )}
        </div>

        <DropdownMenuSeparator className="bg-slate-900 dark:bg-zinc-700 h-1 my-1" />

        <div className="max-h-80 overflow-y-auto space-y-1 py-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-500">
              <BellOff size={28} strokeWidth={2} className="animate-bounce" />
              <span className="font-black italic uppercase text-xs">Belum ada notifikasi</span>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group border-2 border-slate-900 dark:border-zinc-700 p-3 flex gap-3 transition-colors ${
                  notification.is_read
                    ? "bg-slate-50/50 dark:bg-zinc-900/30 text-slate-500 dark:text-zinc-400"
                    : "bg-white dark:bg-zinc-800/80 text-slate-950 dark:text-zinc-50 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_var(--primary-color)] mb-1"
                }`}
              >
                {getIcon(notification.type)}
                <div className="flex-1 space-y-1 text-left min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className={`text-xs font-black uppercase leading-tight truncate ${
                      notification.is_read ? "text-slate-500" : "text-slate-950 dark:text-zinc-50"
                    }`}>
                      {notification.title}
                    </p>
                    <span className="text-[9px] font-black text-slate-400 shrink-0">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium leading-normal break-words line-clamp-2">
                    {notification.message}
                  </p>
                  {!notification.is_read && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={(e) => markAsRead(notification.id, e)}
                        className="text-[9px] font-black uppercase italic bg-emerald-400 hover:bg-emerald-500 text-slate-950 border-2 border-slate-900 px-1.5 py-0.5 flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-[1.5px_1.5px_0_0_#000]"
                      >
                        <Check size={10} strokeWidth={4} /> Tandai Dibaca
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
