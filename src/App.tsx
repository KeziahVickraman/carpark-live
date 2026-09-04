import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  ExternalApiConfig,
  FetchResult,
  EnrichedCarpark,
  VehicleFilter,
  AvailabilityFilter,
  SortOption,
  ActiveTab,
} from "./types";
import { fetchLiveCarparks } from "./services/api";
import { Header } from "./components/Header";
import { MetricsBar } from "./components/MetricsBar";
import { FiltersBar } from "./components/FiltersBar";
import { CarparkCard } from "./components/CarparkCard";
import { CarparkMap } from "./components/CarparkMap";
import { ApiConfigModal } from "./components/ApiConfigModal";
import { CarparkDetailModal } from "./components/CarparkDetailModal";
import { RawApiInspectorModal } from "./components/RawApiInspectorModal";
import {
  AlertCircle,
  RefreshCw,
  Settings,
  ChevronDown,
  Star,
  MapPin,
  Sparkles,
} from "lucide-react";

const DEFAULT_CONFIG: ExternalApiConfig = {
  mode: "data_gov_sg",
  customUrl: "",
  ltaAccountKey: "",
  customHeaders: [],
  method: "GET",
  pollingIntervalSeconds: 60,
  autoRefresh: true,
};

const ITEMS_PER_PAGE = 48;

export default function App() {
  // Load persisted API config
  const [apiConfig, setApiConfig] = useState<ExternalApiConfig>(() => {
    try {
      const saved = localStorage.getItem("sg_carpark_api_config");
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CONFIG;
  });

  // Load persisted favorites
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("sg_carpark_favorites");
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
    return new Set<string>();
  });

  // Core data states
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(
    apiConfig.pollingIntervalSeconds
  );

  // Filters and views
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("available_desc");
  const [freeParkingOnly, setFreeParkingOnly] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("grid");
  const [displayLimit, setDisplayLimit] = useState<number>(ITEMS_PER_PAGE);

  // User location
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Modals
  const [selectedCarpark, setSelectedCarpark] =
    useState<EnrichedCarpark | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isInspectorModalOpen, setIsInspectorModalOpen] =
    useState<boolean>(false);

  // Persist favorites
  const toggleFavorite = (code: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      try {
        localStorage.setItem(
          "sg_carpark_favorites",
          JSON.stringify(Array.from(next))
        );
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Persist API config changes
  const handleSaveApiConfig = (newConfig: ExternalApiConfig) => {
    setApiConfig(newConfig);
    try {
      localStorage.setItem("sg_carpark_api_config", JSON.stringify(newConfig));
    } catch (e) {
      console.error(e);
    }
    setCountdownSeconds(newConfig.pollingIntervalSeconds);
    loadData(newConfig);
  };

  // Load real-time data
  const loadData = useCallback(
    async (cfg: ExternalApiConfig = apiConfig) => {
      setIsLoading(true);
      const result = await fetchLiveCarparks(cfg, userLocation, favorites);
      setFetchResult(result);
      setIsLoading(false);
      setCountdownSeconds(cfg.pollingIntervalSeconds);
    },
    [apiConfig, userLocation, favorites]
  );

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-polling timer
  useEffect(() => {
    if (!apiConfig.autoRefresh || apiConfig.pollingIntervalSeconds <= 0) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          loadData(apiConfig);
          return apiConfig.pollingIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [apiConfig, loadData]);

  // Handle Geolocation request
  const handleToggleLocation = () => {
    if (userLocation) {
      setUserLocation(null);
      setLocationError(null);
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setLocationError(null);
        // Switch sort to nearest
        setSortOption("distance_asc");
      },
      (err) => {
        setLocationError(err.message || "Failed to get location");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Filter and sort carparks
  const filteredCarparks = useMemo(() => {
    if (!fetchResult?.carparks) return [];

    let list = fetchResult.carparks.map((c) => ({
      ...c,
      isFavorite: favorites.has(c.carpark_number),
    }));

    // Tab filter
    if (activeTab === "favorites") {
      list = list.filter((c) => c.isFavorite);
    }

    // Vehicle Type filter
    if (vehicleFilter === "C") {
      list = list.filter(
        (c) =>
          c.car_lots_available !== undefined && (c.car_total_lots || 0) > 0
      );
    } else if (vehicleFilter === "M") {
      list = list.filter(
        (c) =>
          c.motorcycle_lots_available !== undefined &&
          (c.motorcycle_total_lots || 0) > 0
      );
    } else if (vehicleFilter === "H") {
      list = list.filter(
        (c) =>
          c.heavy_lots_available !== undefined &&
          (c.heavy_total_lots || 0) > 0
      );
    }

    // Availability status filter
    if (availabilityFilter === "full") {
      list = list.filter((c) => c.lots_available_combined === 0);
    } else if (availabilityFilter === "low") {
      list = list.filter((c) => {
        const pct =
          c.total_lots_combined > 0
            ? (c.lots_available_combined / c.total_lots_combined) * 100
            : 0;
        return pct > 0 && pct < 10;
      });
    } else if (availabilityFilter === "moderate") {
      list = list.filter((c) => {
        const pct =
          c.total_lots_combined > 0
            ? (c.lots_available_combined / c.total_lots_combined) * 100
            : 0;
        return pct >= 10 && pct <= 30;
      });
    } else if (availabilityFilter === "high") {
      list = list.filter((c) => {
        const pct =
          c.total_lots_combined > 0
            ? (c.lots_available_combined / c.total_lots_combined) * 100
            : 0;
        return pct > 30;
      });
    }

    // Free parking filter
    if (freeParkingOnly) {
      list = list.filter(
        (c) => c.metadata?.freeParking && c.metadata.freeParking !== "NO"
      );
    }

    // Search query filter (Code or Street/Town address)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.carpark_number.toLowerCase().includes(q) ||
          c.metadata?.address.toLowerCase().includes(q) ||
          c.metadata?.type.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortOption === "distance_asc") {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.distanceKm !== undefined) return -1;
        if (b.distanceKm !== undefined) return 1;
      }
      if (sortOption === "available_desc") {
        return b.lots_available_combined - a.lots_available_combined;
      }
      if (sortOption === "available_asc") {
        return a.lots_available_combined - b.lots_available_combined;
      }
      if (sortOption === "percent_desc") {
        const pctA =
          a.total_lots_combined > 0
            ? a.lots_available_combined / a.total_lots_combined
            : 0;
        const pctB =
          b.total_lots_combined > 0
            ? b.lots_available_combined / b.total_lots_combined
            : 0;
        return pctB - pctA;
      }
      if (sortOption === "code_asc") {
        return a.carpark_number.localeCompare(b.carpark_number);
      }
      return 0;
    });

    return list;
  }, [
    fetchResult,
    favorites,
    activeTab,
    vehicleFilter,
    availabilityFilter,
    freeParkingOnly,
    searchQuery,
    sortOption,
  ]);

  // Display items slice
  const displayedCarparks = useMemo(() => {
    return filteredCarparks.slice(0, displayLimit);
  }, [filteredCarparks, displayLimit]);

  const handleShowOnMap = (carpark: EnrichedCarpark) => {
    setSelectedCarpark(carpark);
    setActiveTab("map");
  };

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + ITEMS_PER_PAGE);
  };

  return (
    <div
      id="singapore-carpark-tracker-root"
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-900"
    >
      {/* App Header */}
      <Header
        apiConfig={apiConfig}
        fetchResult={fetchResult}
        isLoading={isLoading}
        onRefresh={() => loadData()}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onOpenInspector={() => setIsInspectorModalOpen(true)}
        onToggleLocation={handleToggleLocation}
        userLocation={userLocation}
        locationError={locationError}
        countdownSeconds={countdownSeconds}
      />

      {/* Metrics Bar */}
      <MetricsBar
        carparks={fetchResult?.carparks || []}
        totalAvailable={fetchResult?.totalAvailable || 0}
        totalCapacity={fetchResult?.totalCapacity || 0}
        isLoading={isLoading}
      />

      {/* Filters Bar */}
      <FiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        vehicleFilter={vehicleFilter}
        onVehicleFilterChange={setVehicleFilter}
        availabilityFilter={availabilityFilter}
        onAvailabilityFilterChange={setAvailabilityFilter}
        sortOption={sortOption}
        onSortChange={setSortOption}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        freeParkingOnly={freeParkingOnly}
        onFreeParkingToggle={() => setFreeParkingOnly(!freeParkingOnly)}
        totalFiltered={filteredCarparks.length}
        favoritesCount={favorites.size}
        hasLocation={!!userLocation}
      />

      {/* Error Banner if fetch failed */}
      {fetchResult && !fetchResult.success && (
        <div
          id="api-error-alert"
          className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4"
        >
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-800 text-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-slate-900">
                  Live API Fetch Notice
                </strong>
                <span className="text-slate-600">{fetchResult.error}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                id="btn-retry-fetch"
                onClick={() => loadData()}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              >
                Retry
              </button>
              <button
                id="btn-fix-api-config"
                onClick={() => setIsConfigModalOpen(true)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" /> Configure API
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "map" ? (
          /* Map View */
          <div className="space-y-4">
            <CarparkMap
              carparks={filteredCarparks}
              selectedCarpark={selectedCarpark}
              onSelectCarpark={(c) => setSelectedCarpark(c)}
              userLocation={userLocation}
            />
          </div>
        ) : (
          /* Grid Cards View & Watchlist View */
          <div>
            {filteredCarparks.length === 0 ? (
              <div
                id="empty-state"
                className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-md mx-auto my-12 shadow-2xs"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-500">
                  {activeTab === "favorites" ? (
                    <Star className="w-6 h-6 text-amber-500" />
                  ) : (
                    <MapPin className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {activeTab === "favorites"
                    ? "No Watchlist Facilities Yet"
                    : "No Carparks Found"}
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  {activeTab === "favorites"
                    ? "Click the star icon on any carpark card to pin it here for rapid tracking."
                    : "No parking facilities matched your current search and filter combination. Try clearing filters or resetting search."}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                  >
                    Clear Search Query
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Responsive Grid */}
                <div
                  id="carparks-grid"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  {displayedCarparks.map((carpark) => (
                    <CarparkCard
                      key={carpark.carpark_number}
                      carpark={carpark}
                      onSelect={(c) => setSelectedCarpark(c)}
                      onToggleFavorite={toggleFavorite}
                      onShowOnMap={handleShowOnMap}
                    />
                  ))}
                </div>

                {/* Load more button */}
                {displayedCarparks.length < filteredCarparks.length && (
                  <div className="text-center pt-4 pb-8">
                    <button
                      id="btn-load-more"
                      onClick={handleLoadMore}
                      className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-2 shadow-2xs"
                    >
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                      <span>
                        Show More Carparks ({displayedCarparks.length} of{" "}
                        {filteredCarparks.length.toLocaleString()})
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <CarparkDetailModal
        carpark={selectedCarpark}
        onClose={() => setSelectedCarpark(null)}
        onNavigateMap={(c) => {
          setSelectedCarpark(c);
          setActiveTab("map");
        }}
      />

      {/* API Configuration Modal */}
      <ApiConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={apiConfig}
        onSaveConfig={handleSaveApiConfig}
      />

      {/* Raw External API Inspector Modal */}
      <RawApiInspectorModal
        isOpen={isInspectorModalOpen}
        onClose={() => setIsInspectorModalOpen(false)}
        fetchResult={fetchResult}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-medium text-slate-600">
            Singapore Real-Time Carpark Tracker • Live Gantry & Sensor Feed
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-700 font-medium">100% Real Live Sensor Data</span>
            <span>•</span>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="text-slate-600 hover:text-blue-600 transition-colors"
            >
              Configure External API
            </button>
            <span>•</span>
            <button
              onClick={() => setIsInspectorModalOpen(true)}
              className="text-slate-600 hover:text-blue-600 transition-colors"
            >
              Inspect JSON Payload
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
