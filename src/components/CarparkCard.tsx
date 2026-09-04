import React from "react";
import {
  Car,
  Bike,
  Truck,
  Star,
  Navigation,
  Info,
  MapPin,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { EnrichedCarpark } from "../types";

interface CarparkCardProps {
  carpark: EnrichedCarpark;
  onSelect: (carpark: EnrichedCarpark) => void;
  onToggleFavorite: (code: string) => void;
  onShowOnMap: (carpark: EnrichedCarpark) => void;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  onSelect,
  onToggleFavorite,
  onShowOnMap,
}) => {
  const meta = carpark.metadata;
  const avail = carpark.lots_available_combined;
  const total = carpark.total_lots_combined;
  const freePercent = total > 0 ? Math.round((avail / total) * 100) : 0;

  // Status color logic
  let statusColor = "emerald";
  let statusText = "Available";
  let statusBadgeBg = "bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase px-2 py-0.5";
  let progressBarBg = "bg-emerald-500";

  if (avail === 0) {
    statusColor = "rose";
    statusText = "Full";
    statusBadgeBg = "bg-rose-100 text-rose-700 text-[10px] font-bold rounded uppercase px-2 py-0.5";
    progressBarBg = "bg-rose-500";
  } else if (freePercent < 10) {
    statusColor = "rose";
    statusText = "Almost Full";
    statusBadgeBg = "bg-rose-100 text-rose-700 text-[10px] font-bold rounded uppercase px-2 py-0.5";
    progressBarBg = "bg-rose-500";
  } else if (freePercent <= 30) {
    statusColor = "amber";
    statusText = "Limited";
    statusBadgeBg = "bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase px-2 py-0.5";
    progressBarBg = "bg-amber-500";
  }

  // Format Google Maps directions link
  const navUrl =
    meta?.lat && meta?.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${meta.lat},${meta.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          (meta?.address || carpark.carpark_number) + " Singapore"
        )}`;

  // Parse time
  const updatedTime = carpark.update_datetime
    ? new Date(carpark.update_datetime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Live";

  return (
    <div
      id={`carpark-card-${carpark.carpark_number}`}
      className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs hover:shadow-md p-4 flex flex-col justify-between group text-slate-800"
    >
      <div>
        {/* Card Header: Code, Badges, Favorite */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-800">
              {carpark.carpark_number}
            </span>
            {meta?.type && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {meta.type.replace("CAR PARK", "").trim()}
              </span>
            )}
            {meta?.freeParking && meta.freeParking !== "NO" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 uppercase">
                Free Sun/PH
              </span>
            )}
          </div>

          <button
            id={`btn-favorite-${carpark.carpark_number}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(carpark.carpark_number);
            }}
            title={carpark.isFavorite ? "Remove from watchlist" : "Add to watchlist"}
            className={`p-1.5 rounded-lg border transition-colors ${
              carpark.isFavorite
                ? "bg-amber-50 border-amber-300 text-amber-500"
                : "bg-slate-50 border-slate-200 text-slate-400 hover:text-amber-500 hover:bg-amber-50/50"
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${carpark.isFavorite ? "fill-amber-400" : ""}`}
            />
          </button>
        </div>

        {/* Address */}
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 min-h-[2.5rem] mb-2 leading-snug">
          {meta?.address || `Carpark ${carpark.carpark_number}`}
        </h3>

        {/* Proximity / Gantry Info */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          {carpark.distanceKm !== undefined && (
            <span className="flex items-center gap-1 text-blue-600 font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              {carpark.distanceKm} km
            </span>
          )}
          {meta?.gantryHeight && meta.gantryHeight !== "0" && (
            <span className="text-slate-500">
              Height: <strong className="text-slate-700 font-medium">{meta.gantryHeight}m</strong>
            </span>
          )}
          <span className="text-slate-400 text-[11px] ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" /> {updatedTime}
          </span>
        </div>

        {/* Occupancy Section */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mb-3">
          <div className="flex items-baseline justify-between mb-1.5">
            <div>
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                {avail}
              </span>
              <span className="text-xs text-slate-500 ml-1 font-medium">
                / {total} free
              </span>
            </div>
            <span className={statusBadgeBg}>
              {statusText} ({freePercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${progressBarBg}`}
              style={{ width: `${Math.min(100, Math.max(0, freePercent))}%` }}
            />
          </div>

          {/* Lot breakdown by vehicle type */}
          <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-200/80 text-[11px]">
            {/* Cars */}
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1 text-slate-500">
                <Car className="w-3 h-3 text-blue-600" /> Car
              </span>
              <span className="font-mono font-bold text-slate-800">
                {carpark.car_lots_available !== undefined
                  ? carpark.car_lots_available
                  : "-"}
              </span>
            </div>

            {/* Motorcycle */}
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1 text-slate-500">
                <Bike className="w-3 h-3 text-indigo-600" /> Moto
              </span>
              <span className="font-mono font-bold text-slate-800">
                {carpark.motorcycle_lots_available !== undefined
                  ? carpark.motorcycle_lots_available
                  : "-"}
              </span>
            </div>

            {/* Heavy */}
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1 text-slate-500">
                <Truck className="w-3 h-3 text-slate-700" /> Hvy
              </span>
              <span className="font-mono font-bold text-slate-800">
                {carpark.heavy_lots_available !== undefined
                  ? carpark.heavy_lots_available
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          id={`btn-details-${carpark.carpark_number}`}
          onClick={() => onSelect(carpark)}
          className="flex-1 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Details</span>
        </button>

        {meta?.lat && meta?.lng && (
          <button
            id={`btn-map-${carpark.carpark_number}`}
            onClick={() => onShowOnMap(carpark)}
            title="View on Interactive Map"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-lg transition-colors"
          >
            <MapPin className="w-4 h-4" />
          </button>
        )}

        <a
          id={`btn-navigate-${carpark.carpark_number}`}
          href={navUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open Directions in Google Maps"
          className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Directions</span>
        </a>
      </div>
    </div>
  );
};
