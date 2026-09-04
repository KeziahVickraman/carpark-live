export interface LotInfo {
  lot_type: string; // 'C' (Car), 'H' (Heavy), 'Y' | 'M' (Motorcycle)
  total_lots: number;
  lots_available: number;
}

export interface CarparkLiveItem {
  carpark_number: string;
  update_datetime: string;
  carpark_info: LotInfo[];
  total_lots_combined: number;
  lots_available_combined: number;
  occupancy_rate: number; // 0 to 100
  car_lots_available?: number;
  car_total_lots?: number;
  motorcycle_lots_available?: number;
  motorcycle_total_lots?: number;
  heavy_lots_available?: number;
  heavy_total_lots?: number;
}

export interface CarparkMetadata {
  code: string;
  address: string;
  type: string;
  system: string;
  shortTerm: string;
  freeParking: string;
  nightParking: string;
  gantryHeight: string;
  decks: string;
  lat: number | null;
  lng: number | null;
}

export interface EnrichedCarpark extends CarparkLiveItem {
  metadata?: CarparkMetadata;
  distanceKm?: number;
  isFavorite?: boolean;
  rawPayload?: any;
}

export type ApiSourceMode = "data_gov_sg" | "lta_datamall" | "custom";

export interface ExternalApiConfig {
  mode: ApiSourceMode;
  customUrl: string;
  ltaAccountKey: string;
  customHeaders: { key: string; value: string }[];
  method: "GET" | "POST";
  postBody?: string;
  pollingIntervalSeconds: number; // e.g. 30, 60, 120, 300, 0 (manual)
  autoRefresh: boolean;
}

export interface FetchResult {
  success: boolean;
  source: string;
  endpoint: string;
  latencyMs: number;
  fetchedAt: string;
  timestamp?: string;
  carparks: EnrichedCarpark[];
  totalAvailable: number;
  totalCapacity: number;
  error?: string;
  rawPayload?: any;
}

export type VehicleFilter = "all" | "C" | "M" | "H";
export type AvailabilityFilter = "all" | "high" | "moderate" | "low" | "full";
export type SortOption = "available_desc" | "available_asc" | "percent_desc" | "code_asc" | "distance_asc";
export type ActiveTab = "grid" | "map" | "favorites";
