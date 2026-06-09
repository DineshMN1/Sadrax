"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, LocateFixed, CheckCircle2, Loader2 } from "lucide-react";

interface LatLng { lat: number; lng: number }

interface Props {
  defaultCenter?: LatLng;
  onConfirm: (latlng: LatLng, displayAddress?: string) => void;
  onClose?: () => void;
}

// Leaflet is browser-only — load dynamically to avoid SSR issues.
// UX: a FIXED pin sits at the map centre and the user pans the map under it
// (much easier on mobile than dragging a marker).
export function LocationPicker({ defaultCenter, onConfirm, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState<LatLng>(
    defaultCenter ?? { lat: 12.5574, lng: 80.1842 } // Sadras default
  );
  const [displayAddr, setDisplayAddr] = useState("");
  const [locating, setLocating] = useState(false);
  const [ready, setReady] = useState(false);
  const [moving, setMoving] = useState(false);

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      setDisplayAddr(data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      setDisplayAddr(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  }

  useEffect(() => {
    let destroyed = false;

    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L: any = (await import("leaflet")).default;
      if (!mapRef.current || destroyed) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapRef.current as any)._leaflet_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (L.map as any)(mapRef.current).remove?.();
      }

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true })
        .setView([position.lat, position.lng], 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // The pin = the map centre. Track it live while panning, reverse-geocode on stop.
      map.on("movestart", () => setMoving(true));
      map.on("move", () => {
        const c = map.getCenter();
        setPosition({ lat: c.lat, lng: c.lng });
      });
      map.on("moveend", () => {
        setMoving(false);
        const c = map.getCenter();
        if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
        geocodeTimer.current = setTimeout(() => reverseGeocode(c.lat, c.lng), 350);
      });

      mapInstanceRef.current = map;
      // Leaflet sometimes needs a nudge to size correctly inside a flex/overlay
      setTimeout(() => map.invalidateSize(), 100);

      if (!destroyed) {
        setReady(true);
        reverseGeocode(position.lat, position.lng);
      }
    })();

    return () => {
      destroyed = true;
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) { alert("Geolocation not supported on this device"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setPosition({ lat, lng });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any)?.setView([lat, lng], 17);
        reverseGeocode(lat, lng);
        setLocating(false);
      },
      () => { setLocating(false); alert("Couldn't get your location. Pan the map to set the pin manually."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Auto-locate on open (unless editing a saved pin) so it lands on live location.
  const autoLocatedRef = useRef(false);
  useEffect(() => {
    if (ready && !defaultCenter && !autoLocatedRef.current) {
      autoLocatedRef.current = true;
      handleLocateMe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <div className="flex flex-col h-full">
      {/* Map */}
      <div className="relative flex-1 min-h-0">
        <div ref={mapRef} className="w-full h-full" />

        {!ready && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-[1200]">
            <Loader2 className="animate-spin text-green-600" size={28} />
          </div>
        )}

        {/* Fixed centre pin — tip points at the exact map centre */}
        {ready && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-full transition-transform" style={{ marginTop: moving ? -6 : 0 }}>
            <MapPin size={42} className="text-green-600 drop-shadow-md" fill="#16a34a" stroke="#ffffff" strokeWidth={1.5} />
          </div>
        )}
        {/* tiny dot at the exact centre point */}
        {ready && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[999] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-green-700/70" />
        )}

        {/* hint */}
        {ready && (
          <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full">
            Move the map to position the pin
          </div>
        )}

        {/* Locate me */}
        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="absolute bottom-3 right-3 z-[1000] bg-white shadow-md rounded-xl px-3 py-2 flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} className="text-green-600" />}
          {locating ? "Locating…" : "My location"}
        </button>
      </div>

      {/* Bottom sheet */}
      <div className="bg-white border-t border-gray-100 p-4 space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start gap-3">
          <MapPin size={18} className="text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Delivery location</p>
            <p className="text-sm text-gray-800 leading-snug line-clamp-2">
              {displayAddr || "Move the map to your delivery location"}
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
