"use client";

import { useState, useEffect } from "react";
import { Wrench, MapPin, Phone, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

interface CachedMechanic {
  id: string;
  name: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  address?: string | null;
  isPremium?: boolean;
  responseTime?: number | null;
}

export default function OfflinePage() {
  const [mechanics, setMechanics] = useState<CachedMechanic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Try cache first, then network
      if ("caches" in window) {
        const cache = await caches.open("road-rescue-mechanics-v1");
        const cached = await cache.match("/api/mechanics/public");
        if (cached) {
          const data = await cached.json();
          if (Array.isArray(data) && data.length > 0) {
            setMechanics(data);
            setLoading(false);
            return;
          }
        }
      }
      // Try localStorage fallback
      const stored = localStorage.getItem("road-rescue-mechanics");
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (Array.isArray(data)) setMechanics(data);
        } catch { /* ignore */ }
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <div className="flex-1 max-w-lg mx-auto px-4 pt-8 pb-12 w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">You&apos;re Offline</h1>
          <p className="text-white/50 text-sm">
            No internet connection. Here are mechanics you can still reach.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-white/30" />
          </div>
        ) : mechanics.length === 0 ? (
          <div className="glass rounded-2xl p-8 border border-white/8 text-center">
            <Wrench className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm mb-1">No cached mechanic data.</p>
            <p className="text-white/25 text-xs">
              Connect to the internet and visit the mechanics page to cache their info.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-medium text-sm transition-colors"
            >
              Try Reconnecting
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-white/40 mb-2">
              {mechanics.length} mechanic{mechanics.length !== 1 ? "s" : ""} cached — call them directly
            </p>
            {mechanics.map((m) => (
              <div key={m.id} className="glass rounded-2xl p-4 border border-white/8">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${m.isPremium ? "bg-amber-500/20 border border-amber-500/30 text-amber-400" : "bg-blue-500/20 border border-blue-500/30 text-blue-400"}`}>
                      {(m.name ?? "M")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{m.name ?? "Mechanic"}</p>
                      {m.isPremium && <p className="text-xs text-amber-400">Premium</p>}
                    </div>
                  </div>
                  {m.responseTime && (
                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                      ~{m.responseTime}min
                    </span>
                  )}
                </div>
                {m.phone && (
                  <a
                    href={`tel:${m.phone}`}
                    className="flex items-center gap-2 w-full py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-medium text-sm justify-center mt-2 hover:bg-green-500/20 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Call {m.phone}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
