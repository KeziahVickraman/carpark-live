import React, { useState } from "react";
import {
  X,
  Car,
  Bike,
  Truck,
  MapPin,
  Clock,
  Navigation,
  ShieldCheck,
  Check,
  Copy,
  Code,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { EnrichedCarpark } from "../types";

interface CarparkDetailModalProps {
  carpark: EnrichedCarpark | null;
  onClose: () => void;
  onNavigateMap: (c: EnrichedCarpark) => void;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  onNavigateMap,
}) => {
  const [copied, setCopied] = useState(false);

  if (!carpark) return null;

  const meta = carpark.metadata;
  const avail = carpark.lots_available_combined;
  const total = carpark.total_lots_combined;
  const freePercent = total > 0 ? Math.round((avail / total) * 100) : 0;

  let statusColor = "text-emerald-700";
  let statusBadge = "bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded uppercase";
  let progressBarBg = "bg-emerald-500";
  if (avail === 0 || freePercent < 10) {
    statusColor = "text-rose-700";
    statusBadge = "bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded uppercase";
    progressBarBg = "bg-rose-500";
  } else if (freePercent <= 30) {
    statusColor = "text-amber-700";
    statusBadge = "bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded uppercase";
    progressBarBg = "bg-amber-500";
  }

  const navUrl =
    meta?.lat && meta?.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${meta.lat},${meta.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          (meta?.address || carpark.carpark_number) + " Singapore"
        )}`;

  const rawJsonString = JSON.stringify(carpark.rawPayload || carpark, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="carpark-detail-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="carpark-detail-modal"
        className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden my-8 text-slate-800"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-base font-bold px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-800 shadow-2xs">
                {carpark.carpark_number}
              </span>
              <span className={statusBadge}>
                {freePercent}% Free • {avail} Lots Available
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">
              {meta?.address || `Carpark Facility ${carpark.carpark_number}`}
            </h2>
          </div>
          <button
            id="btn-close-detail-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-700 text-sm">
          {/* Live Lot Availability Showcase */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Live Gantry Sensor Occupancy
              </span>
              <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Updated: {new Date(carpark.update_datetime).toLocaleTimeString()}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-3xl font-bold font-mono ${statusColor}`}>
                {avail}
              </span>
              <span className="text-slate-600 text-sm">
                vacant lots out of {total} total capacity
              </span>
            </div>

            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressBarBg}`}
                style={{ width: `${Math.min(100, Math.max(0, freePercent))}%` }}
              />
            </div>

            {/* Vehicle Category Breakdown Cards */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-xs text-blue-600 font-semibold mb-1">
                  <Car className="w-3.5 h-3.5" /> Cars
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {carpark.car_lots_available !== undefined
                    ? carpark.car_lots_available
                    : "N/A"}
                </div>
                <div className="text-[10px] text-slate-500">
                  {carpark.car_total_lots ? `of ${carpark.car_total_lots}` : "lot type C"}
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-xs text-indigo-600 font-semibold mb-1">
                  <Bike className="w-3.5 h-3.5" /> Motorcycles
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {carpark.motorcycle_lots_available !== undefined
                    ? carpark.motorcycle_lots_available
                    : "N/A"}
                </div>
                <div className="text-[10px] text-slate-500">
                  {carpark.motorcycle_total_lots
                    ? `of ${carpark.motorcycle_total_lots}`
                    : "lot type M"}
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-xs text-slate-700 font-semibold mb-1">
                  <Truck className="w-3.5 h-3.5" /> Heavy
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {carpark.heavy_lots_available !== undefined
                    ? carpark.heavy_lots_available
                    : "N/A"}
                </div>
                <div className="text-[10px] text-slate-500">
                  {carpark.heavy_total_lots
                    ? `of ${carpark.heavy_total_lots}`
                    : "lot type H"}
                </div>
              </div>
            </div>
          </div>

          {/* Facility Specifications */}
          {meta && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                Facility Specifications & Policies
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">Facility Type</div>
                  <div className="font-semibold text-xs text-slate-800 mt-0.5">
                    {meta.type}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">Parking System</div>
                  <div className="font-semibold text-xs text-slate-800 mt-0.5">
                    {meta.system}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">Gantry Height Limit</div>
                  <div className="font-semibold text-xs text-slate-800 mt-0.5">
                    {meta.gantryHeight !== "0" ? `${meta.gantryHeight} meters` : "No limit"}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">Free Parking</div>
                  <div className="font-semibold text-xs text-blue-700 mt-0.5">
                    {meta.freeParking}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">Night Parking</div>
                  <div className="font-semibold text-xs text-slate-800 mt-0.5">
                    {meta.nightParking}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">Decks / Floors</div>
                  <div className="font-semibold text-xs text-slate-800 mt-0.5">
                    {meta.decks !== "0" ? `${meta.decks} Decks` : "Surface Level"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coordinates & Navigation Link */}
          {meta?.lat && meta?.lng && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>
                  GPS: <strong className="font-mono">{meta.lat}, {meta.lng}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateMap(carpark);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-2xs"
                >
                  Locate on Map
                </button>
                <a
                  href={navUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                >
                  <span>Google Maps</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Raw External API JSON Payload Inspector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Code className="w-4 h-4 text-slate-400" />
                <span>Raw Live Payload from Upstream API</span>
              </div>
              <button
                type="button"
                id="btn-copy-raw-json"
                onClick={handleCopyJson}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-mono transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy JSON
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              {rawJsonString}
            </pre>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Direct untouched JSON object returned by the external Singapore parking availability feed.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
