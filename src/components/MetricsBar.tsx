import React from "react";
import { Car, Bike, Truck, Layers, PieChart, ShieldAlert } from "lucide-react";
import { EnrichedCarpark } from "../types";

interface MetricsBarProps {
  carparks: EnrichedCarpark[];
  totalAvailable: number;
  totalCapacity: number;
  isLoading: boolean;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  carparks,
  totalAvailable,
  totalCapacity,
  isLoading,
}) => {
  // Aggregate vehicle specific counts
  let carAvail = 0;
  let carTotal = 0;
  let motoAvail = 0;
  let motoTotal = 0;
  let heavyAvail = 0;
  let heavyTotal = 0;

  let highCount = 0; // >30% free
  let modCount = 0; // 10-30% free
  let lowCount = 0; // <10% free
  let fullCount = 0; // 0 lots

  for (const c of carparks) {
    if (c.car_lots_available !== undefined) {
      carAvail += c.car_lots_available;
      carTotal += c.car_total_lots || c.car_lots_available;
    }
    if (c.motorcycle_lots_available !== undefined) {
      motoAvail += c.motorcycle_lots_available;
      motoTotal += c.motorcycle_total_lots || c.motorcycle_lots_available;
    }
    if (c.heavy_lots_available !== undefined) {
      heavyAvail += c.heavy_lots_available;
      heavyTotal += c.heavy_total_lots || c.heavy_lots_available;
    }

    const freePercent =
      c.total_lots_combined > 0
        ? (c.lots_available_combined / c.total_lots_combined) * 100
        : 0;

    if (c.lots_available_combined === 0) {
      fullCount++;
    } else if (freePercent > 30) {
      highCount++;
    } else if (freePercent >= 10) {
      modCount++;
    } else {
      lowCount++;
    }
  }

  const overallOccupancy =
    totalCapacity > 0
      ? Math.round(((totalCapacity - totalAvailable) / totalCapacity) * 100)
      : 0;
  const overallFreePercent = 100 - overallOccupancy;

  return (
    <div
      id="metrics-bar"
      className="bg-slate-50 border-b border-slate-200 text-slate-800 py-5 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Metric 1: Real-time Available Lots */}
          <div
            id="metric-card-available"
            className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Available Lots</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {isLoading ? "..." : totalAvailable.toLocaleString()}
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-1 truncate">
                {overallFreePercent}% spaces free now
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, overallFreePercent))}%`,
                }}
              />
            </div>
          </div>

          {/* Metric 2: Average Occupancy */}
          <div
            id="metric-card-occupancy"
            className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Average Occupancy</span>
                <PieChart className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {isLoading ? "..." : `${overallOccupancy}%`}
              </div>
              <div className="text-xs text-slate-500 mt-1 truncate">
                {totalCapacity > 0
                  ? `of ${totalCapacity.toLocaleString()} total capacity`
                  : "Singapore island-wide"}
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, overallOccupancy))}%`,
                }}
              />
            </div>
          </div>

          {/* Metric 3: Facilities Tracked */}
          <div
            id="metric-card-facilities"
            className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Facilities Tracked</span>
                <Layers className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {isLoading ? "..." : carparks.length.toLocaleString()}
              </div>
              <div className="text-xs text-blue-600 font-medium mt-1 truncate">
                Active gantry sensors
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              HDB, URA & LTA facilities
            </div>
          </div>

          {/* Metric 4: Cars (Type C) */}
          <div
            id="metric-card-cars"
            className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span className="flex items-center gap-1 text-slate-600">
                  <Car className="w-3.5 h-3.5 text-blue-600" /> Car Lots
                </span>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                  Cat C
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {isLoading ? "..." : carAvail.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1 truncate">
                vacant passenger lots
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              {carTotal > 0 ? `Total: ${carTotal.toLocaleString()}` : "Active"}
            </div>
          </div>

          {/* Metric 5: Motorcycles */}
          <div
            id="metric-card-motorcycle"
            className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span className="flex items-center gap-1 text-slate-600">
                  <Bike className="w-3.5 h-3.5 text-indigo-600" /> Motor Lots
                </span>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                  Cat M
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {isLoading ? "..." : motoAvail.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1 truncate">
                vacant motorcycle lots
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              {motoTotal > 0 ? `Total: ${motoTotal.toLocaleString()}` : "Active"}
            </div>
          </div>

          {/* Metric 6: Availability Status Distribution */}
          <div
            id="metric-card-distribution"
            className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1"
          >
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1 flex items-center justify-between">
                <span>Zone Density</span>
                {fullCount > 0 && (
                  <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                    <ShieldAlert className="w-3 h-3" /> {fullCount} Full
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center mt-2">
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg py-1.5">
                  <div className="text-sm font-bold text-emerald-700 font-mono">
                    {highCount}
                  </div>
                  <div className="text-[10px] font-medium text-emerald-700">Plenty</div>
                </div>
                <div className="bg-amber-50 border border-amber-200/80 rounded-lg py-1.5">
                  <div className="text-sm font-bold text-amber-700 font-mono">
                    {modCount}
                  </div>
                  <div className="text-[10px] font-medium text-amber-700">Fair</div>
                </div>
                <div className="bg-rose-50 border border-rose-200/80 rounded-lg py-1.5">
                  <div className="text-sm font-bold text-rose-700 font-mono">
                    {lowCount + fullCount}
                  </div>
                  <div className="text-[10px] font-medium text-rose-700">Tight</div>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Aggregated island status
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
