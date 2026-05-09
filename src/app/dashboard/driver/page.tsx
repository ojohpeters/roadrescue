"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MapPin, Loader2, AlertCircle, CheckCircle2, Car, ChevronRight, X, Shield } from "lucide-react";
import dynamic from "next/dynamic";
import type { RequestWithUsers } from "@/types";
import { ISSUE_TYPES, STATUS_LABELS, STATUS_COLORS } from "@/types";

const DriverMap = dynamic(() => import("@/components/map/DriverMap"), { ssr: false });
const TrackingMap = dynamic(() => import("@/components/map/TrackingMap"), { ssr: false });

type GeoState = "idle" | "detecting" | "found" | "error";

export default function DriverDashboard() {
  const { data: session } = useSession();
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [form, setForm] = useState({ issueType: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeRequest, setActiveRequest] = useState<RequestWithUsers | null>(null);
  const [history, setHistory] = useState<RequestWithUsers[]>([]);
  const [view, setView] = useState<"request" | "tracking" | "history">("request");

  const fetchRequests = useCallback(async () => {
    const res = await fetch("/api/requests");
    if (!res.ok) return;
    const data: RequestWithUsers[] = await res.json();
    if (!Array.isArray(data)) return;
    const active = data.find((r) => ["PENDING", "ACCEPTED", "ON_THE_WAY"].includes(r.status));
    if (active) {
      setActiveRequest(active);
      setView("tracking");
    } else if (activeRequest) {
      // was active, now done
      setActiveRequest(null);
      setView("request");
    }
    setHistory(data.filter((r) => ["COMPLETED", "CANCELLED"].includes(r.status)));
  }, [activeRequest]);

  // Initial fetch
  useEffect(() => { fetchRequests(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 5 seconds when there's an active request
  useEffect(() => {
    if (!activeRequest) return;
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [activeRequest, fetchRequests]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) { setGeoState("error"); return; }
    setGeoState("detecting");

    function onSuccess(pos: GeolocationPosition) {
      const { latitude, longitude } = pos.coords;
      setLat(latitude); setLng(longitude); setGeoState("found");
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      )
        .then((r) => r.json())
        .then((d) => setAddress(d.display_name ?? ""))
        .catch(() => {});
    }

    function onError() {
      // Fallback: high accuracy may fail indoors/slow GPS, retry without it
      navigator.geolocation.getCurrentPosition(onSuccess, () => setGeoState("error"), {
        timeout: 15000,
        enableHighAccuracy: false,
      });
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      timeout: 10000,
      enableHighAccuracy: true,
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lat || !lng) { setError("Please set your location first."); return; }
    if (!form.issueType) { setError("Please select an issue type."); return; }
    setError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, latitude: lat, longitude: lng, address }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit"); return; }
      setActiveRequest(data);
      setView("tracking");
    } finally { setSubmitting(false); }
  }

  async function cancelRequest() {
    if (!activeRequest) return;
    await fetch(`/api/requests/${activeRequest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setActiveRequest(null);
    setView("request");
    fetchRequests();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-8">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Hi, {session?.user?.name?.split(" ")[0] ?? "Driver"}</h1>
          <p className="text-white/50 text-sm mt-0.5">
            {activeRequest ? "Your request is active" : "Need help? Request a mechanic now."}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8 mb-6">
          {(["request", "tracking", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              disabled={tab === "tracking" && !activeRequest}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                view === tab ? "bg-orange-500 text-white" : "text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              }`}
            >{tab}</button>
          ))}
        </div>

        {/* REQUEST FORM */}
        {view === "request" && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5 border border-white/8">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400" /> Your Location
              </h2>
              {geoState === "idle" && (
                <button onClick={detectLocation} className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" /> Detect My Location
                </button>
              )}
              {geoState === "detecting" && (
                <div className="flex items-center justify-center gap-2 py-4 text-white/50 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Detecting location...
                </div>
              )}
              {geoState === "error" && (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4" /> Could not auto-detect. Tap the map to pin your location.</p>
                  <button onClick={detectLocation} className="text-xs text-orange-400 underline">Try again</button>
                </div>
              )}
              {(geoState === "found" || lat !== null) && (
                <p className="flex items-center gap-2 text-green-400 text-sm mb-3">
                  <CheckCircle2 className="w-4 h-4" />
                  {address ? address.slice(0, 70) + "…" : `${lat?.toFixed(5)}, ${lng?.toFixed(5)}`}
                </p>
              )}
              <DriverMap
                latitude={lat} longitude={lng}
                onLocationSelect={(la, lo) => { setLat(la); setLng(lo); setGeoState("found"); }}
              />
            </div>

            <div className="glass rounded-2xl p-5 border border-white/8">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Car className="w-4 h-4 text-orange-400" /> Describe the Problem
              </h2>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Issue Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ISSUE_TYPES.map((issue) => (
                      <button key={issue.value} type="button"
                        onClick={() => setForm((p) => ({ ...p, issueType: issue.value }))}
                        className={`py-2.5 px-3 rounded-xl border text-sm text-left transition-all ${
                          form.issueType === issue.value ? "border-orange-500/50 bg-orange-500/10 text-orange-300" : "border-white/10 hover:border-white/20 text-white/70"
                        }`}
                      >{issue.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Additional Details</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Any extra details to help the mechanic..."
                    rows={3} required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 text-sm resize-none"
                  />
                </div>
                <button type="submit" disabled={submitting || !lat}
                  className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending Request...</> : <>Request Help Now <ChevronRight className="w-5 h-5" /></>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TRACKING */}
        {view === "tracking" && activeRequest && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5 border border-white/8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">Request Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[activeRequest.status]}`}>
                    {STATUS_LABELS[activeRequest.status]}
                  </span>
                </div>
                {activeRequest.status === "PENDING" && (
                  <button onClick={cancelRequest}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors">
                    <X className="w-3 h-3" /> Cancel
                  </button>
                )}
              </div>
              {(["PENDING", "ACCEPTED", "ON_THE_WAY", "COMPLETED"] as const).map((s, i) => {
                const idx = ["PENDING","ACCEPTED","ON_THE_WAY","COMPLETED"].indexOf(activeRequest.status);
                const done = i <= idx;
                return (
                  <div key={s} className="flex items-center gap-3 mb-2 last:mb-0">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${done ? "border-orange-500 bg-orange-500" : "border-white/20"}`}>
                      {done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`text-sm ${done ? "text-white" : "text-white/30"}`}>{STATUS_LABELS[s]}</span>
                  </div>
                );
              })}
            </div>

            {activeRequest.mechanic && (
                    <div className="glass rounded-2xl p-5 border border-white/8">
                <p className="text-xs text-white/40 mb-3">Your Mechanic</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-sm">{(activeRequest.mechanic.name ?? "M")[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium flex items-center gap-2">
                      {activeRequest.mechanic.name ?? "Mechanic"}
                      {activeRequest.mechanic.isPremium && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Shield className="w-3 h-3" /> Premium
                        </span>
                      )}
                    </p>
                    {activeRequest.mechanic.phone && (
                      <a href={`tel:${activeRequest.mechanic.phone}`} className="text-sm text-orange-400 hover:underline">{activeRequest.mechanic.phone}</a>
                    )}
                  </div>
                </div>
              </div>
            )}
            <TrackingMap request={activeRequest} />
          </div>
        )}

        {/* HISTORY */}
        {view === "history" && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="glass rounded-2xl p-8 border border-white/8 text-center text-white/40 text-sm">No completed requests yet.</div>
            ) : history.map((req) => (
              <div key={req.id} className="glass rounded-2xl p-4 border border-white/8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{ISSUE_TYPES.find((i) => i.value === req.issueType)?.label ?? req.issueType}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status]}`}>{STATUS_LABELS[req.status]}</span>
                </div>
                <p className="text-xs text-white/40">{new Date(req.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
