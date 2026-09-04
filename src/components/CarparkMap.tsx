import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { EnrichedCarpark } from "../types";
import { Navigation, Info, Crosshair, ZoomIn, ZoomOut } from "lucide-react";

interface CarparkMapProps {
  carparks: EnrichedCarpark[];
  selectedCarpark: EnrichedCarpark | null;
  onSelectCarpark: (c: EnrichedCarpark) => void;
  userLocation: { lat: number; lng: number } | null;
}

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  userLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [activeMarkerCount, setActiveMarkerCount] = useState(0);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center on Singapore
    const initialLat = userLocation?.lat || 1.3521;
    const initialLng = userLocation?.lng || 103.8198;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userIcon = L.divIcon({
        className: "custom-user-marker",
        html: `<div class="relative flex items-center justify-center">
          <div class="w-5 h-5 bg-sky-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          <div class="absolute w-8 h-8 bg-sky-400/40 rounded-full animate-ping"></div>
        </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.bindPopup("<b>Your Current GPS Location</b>");
      userMarkerRef.current = marker;
    }
  }, [userLocation]);

  // Update carpark markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Filter carparks with valid coordinates
    // Render up to 500 carparks to keep performance blazing fast
    const validCarparks = carparks
      .filter((c) => c.metadata?.lat && c.metadata?.lng)
      .slice(0, 500);

    setActiveMarkerCount(validCarparks.length);

    for (const c of validCarparks) {
      const lat = c.metadata!.lat!;
      const lng = c.metadata!.lng!;
      const avail = c.lots_available_combined;
      const total = c.total_lots_combined;
      const freePercent = total > 0 ? (avail / total) * 100 : 0;

      let color = "#10b981"; // Emerald
      let borderColor = "#047857";
      if (avail === 0 || freePercent < 10) {
        color = "#f43f5e"; // Rose
        borderColor = "#be123c";
      } else if (freePercent <= 30) {
        color = "#f59e0b"; // Amber
        borderColor = "#b45309";
      }

      // Compact lot pill icon
      const iconHtml = `
        <div style="
          background-color: ${color};
          color: white;
          font-weight: 700;
          font-family: monospace;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 9999px;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          white-space: nowrap;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 2px;
        ">
          <span>${avail}</span>
        </div>
      `;

      const markerIcon = L.divIcon({
        className: "carpark-lot-marker",
        html: iconHtml,
        iconSize: [36, 20],
        iconAnchor: [18, 10],
      });

      const marker = L.marker([lat, lng], { icon: markerIcon });

      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      // Detailed popup HTML
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 200px; color: #0f172a; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 800; font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${c.carpark_number}</span>
            <span style="font-weight: 700; font-size: 12px; color: ${color};">${avail} / ${total} Lots Free</span>
          </div>
          <div style="font-weight: 600; font-size: 12px; margin-bottom: 6px; line-height: 1.3;">
            ${c.metadata?.address || "HDB Carpark"}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px; display: flex; gap: 8px;">
            <span>Cars: <b>${c.car_lots_available ?? "-"}</b></span>
            <span>Bikes: <b>${c.motorcycle_lots_available ?? "-"}</b></span>
            <span>Heavy: <b>${c.heavy_lots_available ?? "-"}</b></span>
          </div>
          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="
              display: inline-block;
              background-color: #059669;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
              text-decoration: none;
              text-align: center;
              flex: 1;
            ">Navigate</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on("click", () => {
        onSelectCarpark(c);
      });

      markersGroup.addLayer(marker);
    }
  }, [carparks]);

  // Focus selected carpark
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCarpark?.metadata?.lat || !selectedCarpark?.metadata?.lng) return;

    map.flyTo(
      [selectedCarpark.metadata.lat, selectedCarpark.metadata.lng],
      16,
      { animate: true, duration: 1 }
    );
  }, [selectedCarpark]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 14);
    } else {
      map.flyTo([1.3521, 103.8198], 12);
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div
      id="carpark-map-view"
      className="relative w-full h-[650px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100"
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Legend & Stats Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-3 text-xs text-slate-700 shadow-sm">
        <div className="font-semibold text-slate-900 mb-1.5 flex items-center justify-between gap-3">
          <span>Live Occupancy Map</span>
          <span className="text-[10px] text-blue-600 font-mono font-bold">
            {activeMarkerCount} plotted
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-600 font-medium">&gt;30% Free</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-slate-600 font-medium">10-30%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="text-slate-600 font-medium">&lt;10% / Full</span>
          </div>
        </div>
      </div>

      {/* Floating Map Controls */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1.5 shadow-sm">
        <button
          id="btn-map-recenter"
          onClick={handleRecenter}
          title="Recenter Map"
          className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors shadow-xs"
        >
          <Crosshair className="w-4 h-4 text-blue-600" />
        </button>
        <button
          id="btn-map-zoom-in"
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors shadow-xs"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-map-zoom-out"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors shadow-xs"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
