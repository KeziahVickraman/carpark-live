import {
  CarparkMetadata,
  CarparkLiveItem,
  EnrichedCarpark,
  ExternalApiConfig,
  FetchResult,
  LotInfo,
} from "../types";

let metadataCache: Record<string, CarparkMetadata> | null = null;

/**
 * Fetch HDB carparks metadata from server
 */
export async function fetchCarparksMetadata(): Promise<Record<string, CarparkMetadata>> {
  if (metadataCache && Object.keys(metadataCache).length > 0) {
    return metadataCache;
  }
  try {
    const res = await fetch("/api/carparks-meta");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && json.data) {
      metadataCache = json.data;
      return metadataCache!;
    }
  } catch (err) {
    console.warn("Failed to fetch carpark metadata from server:", err);
  }
  return {};
}

/**
 * Calculate distance between two lat/lng points in km (Haversine)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Normalize raw response payload into standardized CarparkLiveItem[]
 */
export function parseRawPayload(payload: any): {
  timestamp: string;
  items: CarparkLiveItem[];
} {
  const result: CarparkLiveItem[] = [];
  let timestamp = new Date().toISOString();

  if (!payload) return { timestamp, items: [] };

  // Case 1: Standard Data.gov.sg format: { items: [ { timestamp, carpark_data: [...] } ] }
  if (Array.isArray(payload.items) && payload.items[0]?.carpark_data) {
    timestamp = payload.items[0].timestamp || timestamp;
    const rawList = payload.items[0].carpark_data;

    for (const raw of rawList) {
      const carpark_number = String(raw.carpark_number || "").trim();
      if (!carpark_number) continue;

      const infos: LotInfo[] = [];
      let total_lots_combined = 0;
      let lots_available_combined = 0;
      let car_lots_available: number | undefined;
      let car_total_lots: number | undefined;
      let motorcycle_lots_available: number | undefined;
      let motorcycle_total_lots: number | undefined;
      let heavy_lots_available: number | undefined;
      let heavy_total_lots: number | undefined;

      if (Array.isArray(raw.carpark_info)) {
        for (const info of raw.carpark_info) {
          const type = String(info.lot_type || "C").toUpperCase();
          const total = parseInt(info.total_lots, 10) || 0;
          const avail = parseInt(info.lots_available, 10) || 0;

          infos.push({
            lot_type: type,
            total_lots: total,
            lots_available: avail,
          });

          total_lots_combined += total;
          lots_available_combined += avail;

          if (type === "C") {
            car_lots_available = avail;
            car_total_lots = total;
          } else if (type === "Y" || type === "M") {
            motorcycle_lots_available = avail;
            motorcycle_total_lots = total;
          } else if (type === "H") {
            heavy_lots_available = avail;
            heavy_total_lots = total;
          }
        }
      }

      const occupancy_rate =
        total_lots_combined > 0
          ? Math.round(
              ((total_lots_combined - lots_available_combined) /
                total_lots_combined) *
                100
            )
          : 100;

      result.push({
        carpark_number,
        update_datetime: raw.update_datetime || timestamp,
        carpark_info: infos,
        total_lots_combined,
        lots_available_combined,
        occupancy_rate,
        car_lots_available,
        car_total_lots,
        motorcycle_lots_available,
        motorcycle_total_lots,
        heavy_lots_available,
        heavy_total_lots,
      });
    }

    return { timestamp, items: result };
  }

  // Case 2: LTA DataMall CarParkAvailabilityv2 format: { value: [ { CarParkID, Development, AvailableLots, LotType, ... } ] }
  if (Array.isArray(payload.value)) {
    const list = payload.value;
    for (const item of list) {
      const code = String(item.CarParkID || item.car_park_no || item.id || "").trim();
      if (!code) continue;

      const avail = parseInt(item.AvailableLots || item.lots_available, 10) || 0;
      const total = parseInt(item.TotalLots || item.total_lots, 10) || Math.max(avail, 50);
      const lotType = String(item.LotType || "C").toUpperCase();

      const info: LotInfo = {
        lot_type: lotType,
        total_lots: total,
        lots_available: avail,
      };

      result.push({
        carpark_number: code,
        update_datetime: item.timestamp || timestamp,
        carpark_info: [info],
        total_lots_combined: total,
        lots_available_combined: avail,
        occupancy_rate:
          total > 0 ? Math.round(((total - avail) / total) * 100) : 100,
        car_lots_available: lotType === "C" ? avail : undefined,
        car_total_lots: lotType === "C" ? total : undefined,
      });
    }
    return { timestamp, items: result };
  }

  // Case 3: Flat array of carpark objects [ { carpark_number, total_lots, lots_available } ]
  const candidateArray = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.carparks)
    ? payload.carparks
    : null;

  if (candidateArray) {
    for (const item of candidateArray) {
      const code = String(
        item.carpark_number || item.car_park_no || item.id || item.code || ""
      ).trim();
      if (!code) continue;

      const avail = parseInt(
        item.lots_available ?? item.available_lots ?? item.avail,
        10
      ) || 0;
      const total = parseInt(
        item.total_lots ?? item.capacity ?? item.total,
        10
      ) || Math.max(avail, 100);

      result.push({
        carpark_number: code,
        update_datetime: item.updated_at || item.update_datetime || timestamp,
        carpark_info: [
          {
            lot_type: "C",
            total_lots: total,
            lots_available: avail,
          },
        ],
        total_lots_combined: total,
        lots_available_combined: avail,
        occupancy_rate:
          total > 0 ? Math.round(((total - avail) / total) * 100) : 100,
        car_lots_available: avail,
        car_total_lots: total,
      });
    }
  }

  return { timestamp, items: result };
}

/**
 * Fetch live carparks based on current external API configuration
 */
export async function fetchLiveCarparks(
  config: ExternalApiConfig,
  userLocation: { lat: number; lng: number } | null,
  favoriteCodes: Set<string>
): Promise<FetchResult> {
  const meta = await fetchCarparksMetadata();
  const startTime = Date.now();

  try {
    let rawJson: any = null;
    let effectiveEndpoint = "";
    let effectiveSource = "";
    let latencyMs = 0;

    if (config.mode === "data_gov_sg") {
      effectiveSource = "Data.gov.sg (Official Singapore Open Data)";
      effectiveEndpoint = "https://api.data.gov.sg/v1/transport/carpark-availability";

      const res = await fetch("/api/carpark-availability");
      latencyMs = Date.now() - startTime;

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }

      const wrapper = await res.json();
      if (!wrapper.success) {
        throw new Error(wrapper.error || "Failed to fetch from Data.gov.sg");
      }
      rawJson = wrapper.payload;
      latencyMs = wrapper.latencyMs || latencyMs;
    } else if (config.mode === "lta_datamall") {
      effectiveSource = "LTA DataMall (HDB + LTA + URA Live Lots via /api/data)";
      effectiveEndpoint = "/api/data";

      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (config.ltaAccountKey && config.ltaAccountKey.trim()) {
        headers["AccountKey"] = config.ltaAccountKey.trim();
      }

      const res = await fetch("/api/data", {
        headers,
      });

      latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `LTA DataMall error (${res.status}): Please configure your AccountKey in environment variables or API settings.`
        );
      }
      rawJson = data;
    } else {
      // Custom External API Mode
      effectiveSource = "Custom External API Endpoint";
      effectiveEndpoint = config.customUrl.trim();

      if (!effectiveEndpoint) {
        throw new Error(
          "Custom API endpoint URL is not configured. Please open API Configuration and enter your live endpoint URL."
        );
      }

      const customHeaders: Record<string, string> = {};
      for (const h of config.customHeaders) {
        if (h.key.trim() && h.value.trim()) {
          customHeaders[h.key.trim()] = h.value.trim();
        }
      }

      const res = await fetch("/api/proxy-external-carpark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: effectiveEndpoint,
          headers: customHeaders,
          method: config.method || "GET",
          body: config.postBody,
        }),
      });

      latencyMs = Date.now() - startTime;
      const proxyResult = await res.json();

      if (!res.ok || !proxyResult.success) {
        throw new Error(
          proxyResult.error ||
            `External API returned HTTP ${proxyResult.status} ${proxyResult.statusText || ""}`
        );
      }
      rawJson = proxyResult.data;
    }

    // Parse the live payload
    const { timestamp, items } = parseRawPayload(rawJson);

    if (items.length === 0) {
      throw new Error(
        "External API returned 0 carpark facilities or returned unrecognized data format. Check raw payload in API Inspector."
      );
    }

    let totalAvailable = 0;
    let totalCapacity = 0;

    // Enrich with metadata
    const enriched: EnrichedCarpark[] = items.map((item) => {
      const carparkMeta = meta[item.carpark_number];
      totalAvailable += item.lots_available_combined;
      totalCapacity += item.total_lots_combined;

      let distanceKm: number | undefined;
      if (userLocation && carparkMeta?.lat && carparkMeta?.lng) {
        distanceKm = calculateDistanceKm(
          userLocation.lat,
          userLocation.lng,
          carparkMeta.lat,
          carparkMeta.lng
        );
      }

      return {
        ...item,
        metadata: carparkMeta,
        distanceKm,
        isFavorite: favoriteCodes.has(item.carpark_number),
        rawPayload: item,
      };
    });

    return {
      success: true,
      source: effectiveSource,
      endpoint: effectiveEndpoint,
      latencyMs,
      fetchedAt: new Date().toLocaleTimeString(),
      timestamp,
      carparks: enriched,
      totalAvailable,
      totalCapacity,
      rawPayload: rawJson,
    };
  } catch (err: any) {
    return {
      success: false,
      source: config.mode,
      endpoint: config.customUrl || "/api/carpark-availability",
      latencyMs: Date.now() - startTime,
      fetchedAt: new Date().toLocaleTimeString(),
      carparks: [],
      totalAvailable: 0,
      totalCapacity: 0,
      error: err.message || "Unknown error while fetching live carparks",
    };
  }
}

/**
 * Test connectivity and latency of an external endpoint
 */
export async function testExternalEndpoint(
  endpoint: string,
  headers: Record<string, string>,
  method: "GET" | "POST" = "GET",
  body?: string
): Promise<{
  ok: boolean;
  status: number;
  latencyMs: number;
  data?: any;
  error?: string;
  itemsDetected?: number;
}> {
  try {
    // If testing the local serverless /api/data endpoint directly
    if (endpoint === "/api/data" || endpoint.includes("/api/data")) {
      const startTime = Date.now();
      const testUrl = endpoint.includes("?")
        ? `${endpoint}&singlePage=true`
        : `${endpoint}?singlePage=true`;

      const res = await fetch(testUrl, {
        method,
        headers,
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          latencyMs,
          error:
            data.error ||
            data.message ||
            `Serverless endpoint returned HTTP ${res.status}`,
          data,
        };
      }

      const { items } = parseRawPayload(data);
      return {
        ok: true,
        status: res.status,
        latencyMs,
        data,
        itemsDetected: items.length,
      };
    }

    const res = await fetch("/api/proxy-external-carpark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint,
        headers,
        method,
        body,
      }),
    });

    const json = await res.json();
    if (!json.success) {
      return {
        ok: false,
        status: json.status || 500,
        latencyMs: json.latencyMs || 0,
        error: json.error || "Connection failed",
      };
    }

    const { items } = parseRawPayload(json.data);
    return {
      ok: true,
      status: json.status || 200,
      latencyMs: json.latencyMs || 0,
      data: json.data,
      itemsDetected: items.length,
    };
  } catch (e: any) {
    return {
      ok: false,
      status: 0,
      latencyMs: 0,
      error: e.message || "Network request failed",
    };
  }
}
