"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Crosshair } from "lucide-react";

interface DriverMapProps {
  latitude: number | null;
  longitude: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function DriverMap({ latitude, longitude, onLocationSelect }: DriverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default icon paths
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      if (leafletMapRef.current) return;

      const center: [number, number] = [latitude ?? 6.5244, longitude ?? 3.3792];

      const map = L.map(mapRef.current!, {
        center,
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Critical: fix Leaflet rendering glitch in Next.js
      setTimeout(() => map.invalidateSize(), 100);

      if (latitude !== null && longitude !== null) {
        const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onLocationSelect(pos.lat, pos.lng);
        });
        markerRef.current = marker;
      }

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
          markerRef.current.on("dragend", () => {
            const pos = markerRef.current!.getLatLng();
            onLocationSelect(pos.lat, pos.lng);
          });
        }
        onLocationSelect(lat, lng);
      });

      leafletMapRef.current = map;
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker when lat/lng prop changes
  useEffect(() => {
    if (!leafletMapRef.current || latitude === null || longitude === null) return;
    (async () => {
      const L = (await import("leaflet")).default;
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        markerRef.current = L.marker([latitude, longitude], { draggable: true })
          .addTo(leafletMapRef.current!);
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current!.getLatLng();
          onLocationSelect(pos.lat, pos.lng);
        });
      }
      leafletMapRef.current!.panTo([latitude, longitude]);
    })();
  }, [latitude, longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) {
    return (
      <div className="w-full h-64 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <MapPin className="w-4 h-4 animate-pulse" />
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10">
      <div ref={mapRef} className="w-full h-64" />
      <div className="absolute bottom-2 left-2 z-[400] flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-white/60">
        <Crosshair className="w-3 h-3" />
        Tap map to repin location
      </div>
    </div>
  );
}
