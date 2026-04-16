"use client";

import { useEffect, useRef, useState } from "react";
import type { RequestWithUsers } from "@/types";

interface TrackingMapProps {
  request: RequestWithUsers;
  mechanicLat?: number;
  mechanicLng?: number;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function TrackingMap({ request, mechanicLat, mechanicLng }: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import("leaflet").Map | null>(null);
  const driverMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const mechanicMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const [mounted, setMounted] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      if (leafletMapRef.current) return;

      const driverIcon = L.divIcon({
        html: `<div class="w-8 h-8 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
        </div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const mechanicIcon = L.divIcon({
        html: `<div class="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        </div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const center: [number, number] = [request.latitude, request.longitude];
      const map = L.map(mapRef.current!, { center, zoom: 14 });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      setTimeout(() => map.invalidateSize(), 100);

      driverMarkerRef.current = L.marker(center, { icon: driverIcon })
        .bindPopup(`<b>${request.driver.name ?? "Driver"}</b><br/>Your location`)
        .addTo(map);

      if (mechanicLat !== undefined && mechanicLng !== undefined) {
        mechanicMarkerRef.current = L.marker([mechanicLat, mechanicLng], { icon: mechanicIcon })
          .bindPopup(`<b>${request.mechanic?.name ?? "Mechanic"}</b><br/>Mechanic location`)
          .addTo(map);

        const dist = haversineDistance(request.latitude, request.longitude, mechanicLat, mechanicLng);
        setDistance(dist);

        const bounds = L.latLngBounds([center, [mechanicLat, mechanicLng]]);
        map.fitBounds(bounds, { padding: [40, 40] });
      }

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

  // Update mechanic marker on prop change
  useEffect(() => {
    if (!leafletMapRef.current || mechanicLat === undefined || mechanicLng === undefined) return;
    (async () => {
      const L = (await import("leaflet")).default;
      if (mechanicMarkerRef.current) {
        mechanicMarkerRef.current.setLatLng([mechanicLat, mechanicLng]);
      } else {
        mechanicMarkerRef.current = L.marker([mechanicLat, mechanicLng]).addTo(leafletMapRef.current!);
      }
      const dist = haversineDistance(request.latitude, request.longitude, mechanicLat, mechanicLng);
      setDistance(dist);
    })();
  }, [mechanicLat, mechanicLng]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) {
    return <div className="w-full h-72 rounded-xl bg-white/5 border border-white/10 animate-pulse" />;
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10">
      <div ref={mapRef} className="w-full h-72" />
      {distance !== null && (
        <div className="absolute top-2 right-2 z-[400] px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-xs text-white font-medium">
          Mechanic is {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`} away
        </div>
      )}
    </div>
  );
}
