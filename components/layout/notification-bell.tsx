"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, DollarSign, ShieldAlert, Zap } from "lucide-react";

interface Notification {
  id: string; type: string; message: string; read: boolean; createdAt: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  spend_threshold: DollarSign,
  injection_detected: ShieldAlert,
  rate_exceeded: Zap,
};
const TYPE_COLOR: Record<string, string> = {
  spend_threshold: "#ffaa00",
  injection_detected: "#ff4444",
  rate_exceeded: "#00aaff",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const d = await res.json();
        setNotifications(d.notifications ?? []);
        setUnread(d.unread ?? 0);
      }
    } catch {}
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(n => n.map(x => ({ ...x, read: true })));
      setUnread(0);
    } catch {}
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => { setOpen(v => !v); if (!open && unread > 0) markAllRead(); }}
        className="relative p-2 text-[#333333] hover:text-[#888888] hover:bg-[#111111] rounded-lg transition-all">
        <Bell size={15} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff4444] rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#141414]">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {notifications.some(n => !n.read) && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-[#555555] hover:text-[#888888] transition-colors">
                <Check size={11} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="text-[#222222] mx-auto mb-2" />
                <p className="text-xs text-[#444444]">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const Icon = TYPE_ICON[n.type] ?? Bell;
                const color = TYPE_COLOR[n.type] ?? "#666666";
                return (
                  <div key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-[#0d0d0d] last:border-0 ${!n.read ? "bg-[#111111]" : ""}`}>
                    <div className="p-1.5 rounded-lg shrink-0 mt-0.5" style={{ background: `${color}14` }}>
                      <Icon size={12} style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#cccccc] leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-[#333333] mt-1 font-mono">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 bg-[#00ff88] rounded-full shrink-0 mt-1.5" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
