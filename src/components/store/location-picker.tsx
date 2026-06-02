"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, LocateFixed, CheckCircle2, Loader2 } from "lucide-react";

interface LatLng { lat: number; lng: number }

interface Props {
  defaultCenter?: LatLng;
  onConfirm: (latlng: LatLng, displayAddress?: string) => void;
  onClose?: () => void;
}

// Leaflet is browser-only — load dynamically to avoid SSR issues
export function LocationPicker({ defaultCenter, onConfirm, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<unknown>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const [position, setPosition] = useState<LatLng>(
    defaultCenter ?? { lat: 12.5574, lng: 80.1842 } // Sadras default
  );
  const [displayAddr, setDisplayAddr] = useState("");
  const [locating, setLocating] = useState(false);
  const [ready, setReady] = useState(false);

  // Initialise Leaflet after mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let L: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let marker: any;

    (async () => {
      L = (await import("leaflet")).default;
      // Fix default icon paths broken by webpack bundling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) return;
      map = L.map(mapRef.current).setView([position.lat, position.lng], 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      marker = L.marker([position.lat, position.lng], { draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      });
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      });

      leafletRef.current = L;
      mapInstanceRef.current = map;
      markerRef.current = marker;
      setReady(true);

      reverseGeocode(position.lat, position.lng);
    })();

    return () => {
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      const addr = data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setDisplayAddr(addr);
    } catch {
      setDisplayAddr(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setPosition({ lat, lng });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any)?.setView([lat, lng], 17);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (markerRef.current as any)?.setLatLng([lat, lng]);
        reverseGeocode(lat, lng);
        setLocating(false);
      },
      () => { setLocating(false); alert("Could not get location. Drop pin manually."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Map */}
      <div className="relative flex-1 min-h-0">
        <div ref={mapRef} className="w-full h-full" />

        {/* Center crosshair hint */}
        {!ready && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <Loader2 className="animate-spin text-green-600" size={28} />
          </div>
        )}

        {/* Locate me button */}
        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="absolute top-3 right-3 z-1000 bg-white shadow-md rounded-xl px-3 py-2 flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} className="text-green-600" />}
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>

      {/* Bottom sheet */}
      <div className="bg-white border-t border-gray-100 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <MapPin size={18} className="text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Delivery location</p>
            <p className="text-sm text-gray-800 leading-snug line-clamp-2">
              {displayAddr || "Move the pin to your delivery location"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="h-12 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => onConfirm(position, displayAddr)}
            disabled={!ready}
            className={`h-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${onClose ? "" : "col-span-2"}`}
          >
            <CheckCircle2 size={16} />
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
