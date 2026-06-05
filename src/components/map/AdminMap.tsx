"use client";

import { useEffect, useRef, useState } from "react";
import type { RequestWithUsers } from "@/types";

interface AdminMapProps {
  requests: RequestWithUsers[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#eab308",
  ACCEPTED: "#3b82f6",
  ON_THE_WAY: "#a855f7",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
};

export default function AdminMap({ requests }: AdminMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Only requests with GPS coordinates can be plotted
      const mapped = requests.filter((r) => r.latitude != null && r.longitude != null);

      if (leafletMapRef.current) {
        // Clear and re-add markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        mapped.forEach((req) => {
          const color = STATUS_COLORS[req.status] ?? "#fff";
          const icon = L.divIcon({
            html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 6px ${color}66;"></div>`,
            className: "",
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          const m = L.marker([req.latitude!, req.longitude!], { icon })
            .bindPopup(
              `<div style="font-size:13px;line-height:1.5;">
                <b>${req.driver.name ?? req.driver.email}</b><br/>
                ${req.issueType.replace(/_/g, " ")}<br/>
                <span style="color:${color};font-weight:600;">${req.status}</span>
              </div>`
            )
            .addTo(leafletMapRef.current!);
          markersRef.current.push(m);
        });
        return;
      }

      const center: [number, number] = mapped.length > 0
        ? [mapped[0].latitude!, mapped[0].longitude!]
        : [6.5244, 3.3792];

      const map = L.map(mapRef.current!, { center, zoom: 12 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      setTimeout(() => map.invalidateSize(), 100);

      mapped.forEach((req) => {
        const color = STATUS_COLORS[req.status] ?? "#fff";
        const icon = L.divIcon({
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 6px ${color}66;"></div>`,
          className: "",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const m = L.marker([req.latitude!, req.longitude!], { icon })
          .bindPopup(
            `<div style="font-size:13px;line-height:1.5;">
              <b>${req.driver.name ?? req.driver.email}</b><br/>
              ${req.issueType.replace(/_/g, " ")}<br/>
              <span style="color:${color};font-weight:600;">${req.status}</span>
            </div>`
          )
          .addTo(map);
        markersRef.current.push(m);
      });

      leafletMapRef.current = map;
    };

    initMap();
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = [];
      }
    };
  }, [mounted, requests]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) {
    return <div className="w-full h-96 rounded-xl bg-white/5 border border-white/10 animate-pulse" />;
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10">
      <div ref={mapRef} className="w-full h-96" />
      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-[400] flex flex-wrap gap-2 p-2 rounded-lg bg-black/70 backdrop-blur-sm">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1 text-xs text-white">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            {status}
          </div>
        ))}
      </div>
    </div>
  );
}
