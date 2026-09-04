import React from "react";
import {
  Activity,
  RefreshCw,
  Settings,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Code2,
} from "lucide-react";
import { ExternalApiConfig, FetchResult } from "../types";

interface HeaderProps {
  apiConfig: ExternalApiConfig;
  fetchResult: FetchResult | null;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenConfig: () => void;
  onOpenInspector: () => void;
  onToggleLocation: () => void;
  userLocation: { lat: number; lng: number } | null;
  locationError: string | null;
  countdownSeconds: number;
}

export const Header: React.FC<HeaderProps> = ({
  apiConfig,
  fetchResult,
  isLoading,
  onRefresh,
  onOpenConfig,
  onOpenInspector,
  onToggleLocation,
  userLocation,
  locationError,
  countdownSeconds,
}) => {
  const isHealthy = fetchResult?.success && !isLoading;
  const isError = !isLoading && fetchResult && !fetchResult.success;
  const syncTime = fetchResult?.fetchedAt || "14:00:00";

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 h-16 bg-slate-900 text-white border-b border-slate-800 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
            P
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white truncate">
                SG Carpark Live Tracker
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                PRO POLISH
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">
              <span>Source:</span>
              <span className="text-slate-300 font-medium">
                {apiConfig.mode === "data_gov_sg"
                  ? "Data.gov.sg (Official)"
                  : apiConfig.mode === "lta_datamall"
                  ? "LTA DataMall"
                  : "Custom External API"}
              </span>
              {fetchResult && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">
                    {fetchResult.carparks.length.toLocaleString()} facilities
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Status Pills & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-sm text-slate-300">
          {/* API Operational Status */}
          <div
            id="status-indicator-pill"
            className="hidden sm:flex items-center gap-2 text-xs"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLoading
                  ? "bg-amber-400 animate-pulse"
                  : isHealthy
                  ? "bg-emerald-500"
                  : "bg-rose-500"
              }`}
            />
            <span className="text-slate-200 font-medium">
              API Status:{" "}
              {isLoading
                ? "Connecting..."
                : isHealthy
                ? "Operational"
                : "Degraded"}
            </span>
          </div>

          {/* Last Sync Pill */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-800 border border-slate-700/60 px-3 py-1 rounded text-xs text-slate-300">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Last Sync: {syncTime.split(", ")[1] || syncTime}</span>
            {apiConfig.autoRefresh && countdownSeconds > 0 && !isLoading && (
              <span className="text-slate-500 pl-1 border-l border-slate-700">
                ({countdownSeconds}s)
              </span>
            )}
          </div>

          {/* Location button */}
          <button
            id="btn-toggle-location"
            onClick={onToggleLocation}
            title={
              userLocation
                ? "Location active (sorting by proximity enabled)"
                : locationError
                ? `Location error: ${locationError}`
                : "Enable GPS location for distance tracking"
            }
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 text-xs font-medium ${
              userLocation
                ? "bg-blue-900/60 border-blue-500 text-blue-200"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <MapPin
              className={`w-3.5 h-3.5 ${
                userLocation ? "text-blue-400 animate-pulse" : "text-slate-400"
              }`}
            />
            <span className="hidden lg:inline">
              {userLocation ? "GPS Active" : "Near Me"}
            </span>
          </button>

          {/* Raw JSON Inspector */}
          <button
            id="btn-open-inspector"
            onClick={onOpenInspector}
            title="Inspect raw live external API response"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline">Inspect API</span>
          </button>

          {/* API Config Modal */}
          <button
            id="btn-open-config-header"
            onClick={onOpenConfig}
            title="Configure External Carpark API"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline">Config</span>
          </button>

          {/* Refresh Button */}
          <button
            id="btn-manual-refresh"
            onClick={onRefresh}
            disabled={isLoading}
            title="Fetch latest real-time lot occupancy"
            className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>{isLoading ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
