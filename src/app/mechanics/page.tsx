"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield, Phone, MapPin, Clock, Wrench, WifiOff, ArrowLeft, RefreshCw, CheckCircle2,
} from "lucide-react";
import type { PublicMechanic } from "@/types";

const STORAGE_KEY = "road-rescue-mechanics";

export default function MechanicsDirectoryPage() {
  const [mechanics, setMechanics] = useState<PublicMechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/mechanics/public", { cache: "no-store" });
      if (!res.ok) throw new Error("bad response");
      const data: PublicMechanic[] = await res.json();
      if (Array.isArray(data)) {
        setMechanics(data);
        setOffline(false);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
      }
    } catch {
      // Offline / network failure — fall back to the last cached list
      setOffline(true);
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          if (Array.isArray(data)) setMechanics(data);
        }
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const onOnline = () => load();
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const premium = mechanics.filter((m) => m.isPremium);
  const others = mechanics.filter((m) => !m.isPremium);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-12">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-white/5 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" /> Premium Mechanics
            </h1>
            <p className="text-xs text-white/40">Call a verified mechanic directly — anytime</p>
          </div>
          <button
            onClick={load}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-white/50 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5">
        {offline && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-5">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            You&apos;re offline — showing the last saved list. Calls still work.
          </div>
        )}

        <p className="text-sm text-white/50 mb-5">
          No mechanic available in the app? These premium mechanics can be reached directly by phone.
          This page works offline once loaded.
        </p>

        {loading && mechanics.length === 0 ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-white/30" />
          </div>
        ) : mechanics.length === 0 ? (
          <div className="glass rounded-2xl p-8 border border-white/8 text-center">
            <Wrench className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No mechanics available yet.</p>
            <p className="text-white/25 text-xs mt-1">Check back shortly.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {premium.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400/80 mb-3 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Premium — call directly
                </h2>
                <div className="space-y-3">
                  {premium.map((m) => <MechanicCard key={m.id} m={m} premium />)}
                </div>
              </section>
            )}

            {others.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                  Available now
                </h2>
                <div className="space-y-3">
                  {others.map((m) => <MechanicCard key={m.id} m={m} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MechanicCard({ m, premium = false }: { m: PublicMechanic; premium?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-4 border ${premium ? "border-amber-500/20" : "border-white/8"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${premium ? "bg-amber-500/20 border border-amber-500/30 text-amber-400" : "bg-blue-500/20 border border-blue-500/30 text-blue-400"}`}>
            {(m.name ?? "M")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{m.name ?? "Mechanic"}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {premium && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                  <Shield className="w-2.5 h-2.5" /> Premium
                </span>
              )}
              {m.isAvailable && (
                <span className="inline-flex items-center gap-1 text-[11px] text-green-400">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Available
                </span>
              )}
            </div>
          </div>
        </div>
        {m.responseTime != null && (
          <span className="flex items-center gap-1 text-xs text-white/40 flex-shrink-0">
            <Clock className="w-3 h-3" /> ~{m.responseTime}min
          </span>
        )}
      </div>

      {m.address && (
        <p className="text-xs text-white/40 flex items-start gap-1 mb-3">
          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" /> {m.address}
        </p>
      )}

      {m.phone ? (
        <a
          href={`tel:${m.phone}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm transition-colors"
        >
          <Phone className="w-4 h-4" /> Call {m.phone}
        </a>
      ) : (
        <p className="text-center text-xs text-white/30 py-2">No phone number on file</p>
      )}
    </div>
  );
}
