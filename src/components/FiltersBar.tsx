import React from "react";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Map as MapIcon,
  Star,
  Car,
  Bike,
  Truck,
  ArrowUpDown,
  X,
} from "lucide-react";
import {
  VehicleFilter,
  AvailabilityFilter,
  SortOption,
  ActiveTab,
} from "../types";

interface FiltersBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  vehicleFilter: VehicleFilter;
  onVehicleFilterChange: (v: VehicleFilter) => void;
  availabilityFilter: AvailabilityFilter;
  onAvailabilityFilterChange: (a: AvailabilityFilter) => void;
  sortOption: SortOption;
  onSortChange: (s: SortOption) => void;
  activeTab: ActiveTab;
  onTabChange: (t: ActiveTab) => void;
  freeParkingOnly: boolean;
  onFreeParkingToggle: () => void;
  totalFiltered: number;
  favoritesCount: number;
  hasLocation: boolean;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  vehicleFilter,
  onVehicleFilterChange,
  availabilityFilter,
  onAvailabilityFilterChange,
  sortOption,
  onSortChange,
  activeTab,
  onTabChange,
  freeParkingOnly,
  onFreeParkingToggle,
  totalFiltered,
  favoritesCount,
  hasLocation,
}) => {
  return (
    <div
      id="filters-bar"
      className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-6 lg:px-8 text-slate-800"
    >
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Top row: Search and View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search carpark code (e.g. ACB, HE12) or street name (e.g. Tampines, Orchard)..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                id="btn-clear-search"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Tab Switcher */}
          <div
            id="view-tabs"
            className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto"
          >
            <button
              id="tab-btn-grid"
              onClick={() => onTabChange("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === "grid"
                  ? "bg-white text-blue-600 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>

            <button
              id="tab-btn-map"
              onClick={() => onTabChange("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === "map"
                  ? "bg-white text-blue-600 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>

            <button
              id="tab-btn-favorites"
              onClick={() => onTabChange("favorites")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === "favorites"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Watchlist ({favoritesCount})</span>
            </button>
          </div>
        </div>

        {/* Bottom row: Filter chips and Sort */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Filter badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Vehicle Type Filter */}
            <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs font-medium">
              <button
                onClick={() => onVehicleFilterChange("all")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  vehicleFilter === "all"
                    ? "bg-white text-slate-900 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => onVehicleFilterChange("C")}
                className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                  vehicleFilter === "C"
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Car className="w-3 h-3" /> Cars
              </button>
              <button
                onClick={() => onVehicleFilterChange("M")}
                className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                  vehicleFilter === "M"
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Bike className="w-3 h-3" /> Bikes
              </button>
              <button
                onClick={() => onVehicleFilterChange("H")}
                className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                  vehicleFilter === "H"
                    ? "bg-slate-800 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Truck className="w-3 h-3" /> Heavy
              </button>
            </div>

            {/* Availability Filter */}
            <select
              id="select-availability-filter"
              value={availabilityFilter}
              onChange={(e) =>
                onAvailabilityFilterChange(e.target.value as AvailabilityFilter)
              }
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              <option value="all">Availability: All</option>
              <option value="high">Plentiful (&gt;30% free)</option>
              <option value="moderate">Moderate (10-30% free)</option>
              <option value="low">Tight (&lt;10% free)</option>
              <option value="full">Completely Full (0 lots)</option>
            </select>

            {/* Free parking toggle */}
            <button
              id="btn-free-parking-toggle"
              onClick={onFreeParkingToggle}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-medium ${
                freeParkingOnly
                  ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Free Parking Sun/PH
            </button>
          </div>

          {/* Right side: Results count & Sort */}
          <div className="flex items-center gap-2.5 ml-auto">
            <span className="text-xs text-slate-500">
              Showing{" "}
              <strong className="text-slate-900 font-semibold">
                {totalFiltered.toLocaleString()}
              </strong>{" "}
              facilities
            </span>

            {/* Sort selection */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="select-sort-option"
                value={sortOption}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                {hasLocation && (
                  <option value="distance_asc">Nearest Proximity</option>
                )}
                <option value="available_desc">Most Lots Available</option>
                <option value="percent_desc">Highest % Free</option>
                <option value="available_asc">Lowest Lots (Critical)</option>
                <option value="code_asc">Carpark Code (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
