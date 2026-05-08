"use client";

import { useEffect, useRef, useState } from "react";

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

interface PremiumMapProps {
  requests: NearbyRequest[];
  mechanicLat: number;
  mechanicLng: number;
  serviceRadius: number;
}

export default function PremiumMap({ requests, mechanicLat, mechanicLng, serviceRadius }: PremiumMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import("leaflet").Map | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (leafletMapRef.current) return;

      const center: [number, number] = [mechanicLat || 6.5244, mechanicLng || 3.3792];

      const map = L.map(mapRef.current!, {
        center,
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      setTimeout(() => map.invalidateSize(), 100);

      // Mechanic marker
      const mechanicIcon = L.divIcon({
        html: `<div style="width:20px;height:20px;border-radius:50%;background:#f59e0b;border:3px solid white;box-shadow:0 0 12px #f59e0b88;display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:50%;background:white;"></div></div>`,
        className: "",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([mechanicLat || 6.5244, mechanicLng || 3.3792], { icon: mechanicIcon })
        .bindPopup("<b>You</b><br/>Premium Mechanic")
        .addTo(map);

      // Service radius circle
      L.circle([mechanicLat || 6.5244, mechanicLng || 3.3792], {
        radius: (serviceRadius || 10) * 1000,
        color: "#f59e0b",
        fillColor: "#f59e0b",
        fillOpacity: 0.08,
        weight: 2,
        dashArray: "6 4",
      }).addTo(map);

      // Driver markers
      requests.forEach((req) => {
        const icon = L.divIcon({
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:2px solid white;box-shadow:0 0 6px #ef444466;"></div>`,
          className: "",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const issueLabel = req.issueType.replace(/_/g, " ");
        L.marker([req.latitude, req.longitude], { icon })
          .bindPopup(
            `<div style="font-size:13px;line-height:1.5;">
              <b>${req.driver.name ?? req.driver.email}</b><br/>
              ${issueLabel}<br/>
              <span style="color:#ef4444;font-weight:600;">STRANDED</span>
            </div>`
          )
          .addTo(map);
      });

      leafletMapRef.current = map;
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) {
    return <div className="w-full h-full rounded-xl bg-white/5 border border-white/10 animate-pulse" />;
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10 w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 z-[400] flex flex-wrap gap-3 p-2 rounded-lg bg-black/70 backdrop-blur-sm text-xs">
        <div className="flex items-center gap-1.5 text-white">
          <div className="w-3 h-3 rounded-full bg-amber-400 border border-white" />
          You
        </div>
        <div className="flex items-center gap-1.5 text-white">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-white" />
          Stranded Driver
        </div>
        <div className="flex items-center gap-1.5 text-white/60">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-amber-400/60" />
          {serviceRadius} km radius
        </div>
      </div>
    </div>
  );
}
