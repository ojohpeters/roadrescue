"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Shield, MapPin, Clock, Phone, Navigation, Wrench,
  Loader2, CheckCircle2, Settings, Star, Users, LocateFixed,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { PremiumMechanicProfile } from "@/types";
import { ISSUE_TYPES } from "@/types";

const PremiumMap = dynamic(() => import("@/components/map/PremiumMap"), { ssr: false });

interface NearbyRequest {
  id: string;
  status: string;
  description: string;
  issueType: string;
  latitude: number;
  longitude: number;
  address: string | null;
  createdAt: string;
  driverId: string;
  mechanicId: string | null;
  driver: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
  };
}

export default function PremiumMechanicDashboard() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<PremiumMechanicProfile | null>(null);
  const [requests, setRequests] = useState<NearbyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"map" | "settings">("map");
  const [saving, setSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    isPremium: true,
    isAvailable: true,
    serviceRadius: 10,
    responseTime: 30,
    latitude: 0,
    longitude: 0,
    address: "",
    phone: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/mechanics/premium");
      if (!res.ok) return;
      const data = await res.json();
      setProfile(data.profile);
      setRequests(data.requests ?? []);
      if (data.profile) {
        setSettingsForm({
          isPremium: data.profile.isPremium ?? true,
          isAvailable: data.profile.isAvailable ?? true,
          serviceRadius: data.profile.serviceRadius ?? 10,
          responseTime: data.profile.responseTime ?? 30,
          latitude: data.profile.latitude ?? 0,
          longitude: data.profile.longitude ?? 0,
          address: data.profile.address ?? "",
          phone: data.profile.phone ?? "",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setSettingsForm((p) => ({ ...p, latitude, longitude }));
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          setSettingsForm((p) => ({ ...p, address: data.display_name ?? "" }));
        } catch { /* ignore */ }
      },
      () => { /* ignore */ },
      { timeout: 30000, enableHighAccuracy: true }
    );
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch("/api/mechanics/premium", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((p) => p ? { ...p, ...data } : null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function acceptJob(requestId: string) {
    const res = await fetch(`/api/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    if (res.ok) {
      setRequests((p) => p.filter((r) => r.id !== requestId));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-8">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <div>
              <h1 className="text-2xl font-bold">Premium Mechanic</h1>
              <p className="text-white/50 text-sm">
                {profile?.isAvailable
                  ? `${requests.length} stranded driver${requests.length !== 1 ? "s" : ""} near you`
                  : "You are currently unavailable"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8 mb-6">
          {(["map", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all flex items-center justify-center gap-2 ${
                view === tab ? "bg-amber-500 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {tab === "map" ? <><MapPin className="w-4 h-4" /> Stranded Drivers</> : <><Settings className="w-4 h-4" /> Settings</>}
            </button>
          ))}
        </div>

        {/* MAP VIEW */}
        {view === "map" && (
          <div className="space-y-4">
            {/* Map */}
            <div className="glass rounded-2xl p-3 border border-white/8 h-[400px]">
              {profile && (
                <PremiumMap
                  requests={requests}
                  mechanicLat={settingsForm.latitude}
                  mechanicLng={settingsForm.longitude}
                  serviceRadius={settingsForm.serviceRadius}
                />
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Radius", value: `${settingsForm.serviceRadius} km`, icon: MapPin, color: "text-blue-400" },
                { label: "Response", value: `${settingsForm.responseTime} min`, icon: Clock, color: "text-green-400" },
                { label: "Available", value: profile?.isAvailable ? "Yes" : "No", icon: CheckCircle2, color: profile?.isAvailable ? "text-green-400" : "text-red-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass rounded-xl p-4 border border-white/8 text-center">
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                  <p className="text-xs text-white/40">{label}</p>
                  <p className="text-sm font-bold">{value}</p>
                </div>
              ))}
            </div>

            {/* Stranded drivers list */}
            <h2 className="font-semibold flex items-center gap-2 mt-6 mb-3">
              <Users className="w-4 h-4 text-amber-400" />
              Stranded Drivers Nearby
            </h2>
            {requests.length === 0 ? (
              <div className="glass rounded-2xl p-8 border border-white/8 text-center">
                <Users className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No stranded drivers in your service area.</p>
                <p className="text-white/25 text-xs mt-1">Expand your radius or move to a busier area.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.filter((r) => r.status === "PENDING").map((req) => (
                  <div key={req.id} className="glass rounded-2xl p-5 border border-white/8 hover:border-amber-500/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                          <span className="text-amber-400 font-bold text-sm">
                            {(req.driver.name ?? "D")[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{req.driver.name ?? "Driver"}</p>
                          <p className="text-xs text-white/40">{ISSUE_TYPES.find((i) => i.value === req.issueType)?.label ?? req.issueType}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-white/60 mb-2 line-clamp-1">{req.description}</p>

                    {req.address && (
                      <p className="text-xs text-white/40 flex items-start gap-1 mb-3">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {req.address.slice(0, 60)}
                      </p>
                    )}

                    <div className="flex gap-2">
                      {req.driver.phone && (
                        <a
                          href={`tel:${req.driver.phone}`}
                          className="flex-1 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-green-500/20 transition-colors"
                        >
                          <Phone className="w-4 h-4" /> Call
                        </a>
                      )}
                      <button
                        onClick={() => acceptJob(req.id)}
                        className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <Navigation className="w-4 h-4" /> Go to Driver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS VIEW */}
        {view === "settings" && (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="glass rounded-2xl p-5 border border-white/8">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Premium Profile
              </h2>

              <div className="space-y-4">
                {/* Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Premium Status</p>
                    <p className="text-xs text-white/40">Show as premium mechanic</p>
                  </div>
                  <button
                    onClick={() => setSettingsForm((p) => ({ ...p, isPremium: !p.isPremium }))}
                    className={`w-12 h-7 rounded-full transition-colors relative ${settingsForm.isPremium ? "bg-amber-500" : "bg-white/10"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${settingsForm.isPremium ? "left-6" : "left-1"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Availability</p>
                    <p className="text-xs text-white/40">Accept new jobs</p>
                  </div>
                  <button
                    onClick={() => setSettingsForm((p) => ({ ...p, isAvailable: !p.isAvailable }))}
                    className={`w-12 h-7 rounded-full transition-colors relative ${settingsForm.isAvailable ? "bg-green-500" : "bg-white/10"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${settingsForm.isAvailable ? "left-6" : "left-1"}`} />
                  </button>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+234 800 000 0000"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
                  />
                </div>

                {/* Service Radius */}
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Service Radius (km)</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={settingsForm.serviceRadius}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, serviceRadius: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
                  />
                </div>

                {/* Response Time */}
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Max Response Time (minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={settingsForm.responseTime}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, responseTime: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Your Location</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Current address"
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
                    />
                    <button
                      onClick={detectLocation}
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                      title="Detect location"
                    >
                      <LocateFixed className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={settingsForm.latitude || ""}
                      onChange={(e) => setSettingsForm((p) => ({ ...p, latitude: Number(e.target.value) }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={settingsForm.longitude || ""}
                      onChange={(e) => setSettingsForm((p) => ({ ...p, longitude: Number(e.target.value) }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
