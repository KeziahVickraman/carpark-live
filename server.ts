import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Load HDB metadata cache
  let hdbMetadata: Record<string, any> = {};
  const metaFilePath = path.join(process.cwd(), "src", "data", "hdb_carparks.json");
  if (fs.existsSync(metaFilePath)) {
    try {
      const raw = fs.readFileSync(metaFilePath, "utf-8");
      hdbMetadata = JSON.parse(raw);
      console.log(`Loaded ${Object.keys(hdbMetadata).length} carpark metadata entries.`);
    } catch (e) {
      console.error("Failed to read hdb_carparks.json:", e);
    }
  }

  // Health endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      carparksMetaCount: Object.keys(hdbMetadata).length,
    });
  });

  // Metadata endpoint (carparks info, addresses, coordinates)
  app.get("/api/carparks-meta", (_req, res) => {
    res.json({
      success: true,
      count: Object.keys(hdbMetadata).length,
      data: hdbMetadata,
    });
  });

  // Direct Live Singapore Carpark Availability from official Data.gov.sg
  app.get("/api/carpark-availability", async (req, res) => {
    const startTime = Date.now();
    try {
      const dateParam = req.query.date_time ? `?date_time=${encodeURIComponent(req.query.date_time as string)}` : "";
      const url = `https://api.data.gov.sg/v1/transport/carpark-availability${dateParam}`;
      
      const upstreamRes = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "SingaporeCarparkTracker/1.0",
        },
      });

      const latencyMs = Date.now() - startTime;

      if (!upstreamRes.ok) {
        return res.status(upstreamRes.status).json({
          success: false,
          error: `Upstream error ${upstreamRes.status}: ${upstreamRes.statusText}`,
          latencyMs,
        });
      }

      const payload = await upstreamRes.json();
      return res.json({
        success: true,
        source: "Data.gov.sg (Official)",
        endpoint: url,
        latencyMs,
        fetchedAt: new Date().toISOString(),
        payload,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to fetch live carpark availability",
        latencyMs: Date.now() - startTime,
      });
    }
  });

  // Serverless endpoint for Live carpark lots (HDB + LTA + URA)
  // Upstream: https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
  // Header: AccountKey: <key>
  // GUARDRAIL: Do not hardcode any API key. All keys will be added manually.
  app.all("/api/data", async (req, res) => {
    // Enable CORS for flexibility
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "AccountKey, accountkey, x-account-key, Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    const startTime = Date.now();

    // Retrieve AccountKey dynamically (do not hardcode any API key)
    const headerKey =
      (req.headers["accountkey"] as string) ||
      (req.headers["account-key"] as string) ||
      (req.headers["x-account-key"] as string) ||
      (req.headers["authorization"]?.startsWith("Bearer ")
        ? req.headers["authorization"].substring(7)
        : undefined);

    const queryKey =
      (typeof req.query.AccountKey === "string" ? req.query.AccountKey : "") ||
      (typeof req.query.accountkey === "string" ? req.query.accountkey : "") ||
      (typeof req.query.accountKey === "string" ? req.query.accountKey : "");

    const bodyKey =
      (typeof req.body?.AccountKey === "string" ? req.body.AccountKey : "") ||
      (typeof req.body?.accountKey === "string" ? req.body.accountKey : "");

    const accountKey = (
      process.env.LTA_ACCOUNT_KEY ||
      process.env.ACCOUNT_KEY ||
      headerKey ||
      queryKey ||
      bodyKey ||
      ""
    ).trim();

    // Guardrail validation: if no key is configured or provided, return 401 with instructions
    if (!accountKey) {
      return res.status(401).json({
        success: false,
        error: "Missing required AccountKey header or environment variable.",
        message:
          "AccountKey is required to access LTA DataMall. Please configure LTA_ACCOUNT_KEY or ACCOUNT_KEY in your environment variables / Settings panel, or provide the 'AccountKey' HTTP header with your request.",
        endpoint: "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2",
        howToObtain: "Register for a free key at https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html",
      });
    }

    const ltaBaseUrl =
      "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2";

    try {
      // Check if user specifically requested a single page with $skip or skip
      const requestedSkip = req.query.$skip ?? req.query.skip;
      const shouldFetchSinglePage =
        requestedSkip !== undefined || req.query.singlePage === "true";

      if (shouldFetchSinglePage) {
        const url = new URL(ltaBaseUrl);
        if (requestedSkip !== undefined) {
          url.searchParams.set("$skip", String(requestedSkip));
        }

        // Forward other OData query params if present
        for (const [k, v] of Object.entries(req.query)) {
          if (
            k !== "skip" &&
            k !== "$skip" &&
            k !== "AccountKey" &&
            k !== "accountkey" &&
            k !== "accountKey" &&
            k !== "singlePage" &&
            typeof v === "string"
          ) {
            url.searchParams.set(k, v);
          }
        }

        const upstreamRes = await fetch(url.toString(), {
          method: "GET",
          headers: {
            AccountKey: accountKey,
            Accept: "application/json",
            "User-Agent": "SingaporeCarparkTracker/1.0",
          },
        });

        const latencyMs = Date.now() - startTime;
        if (!upstreamRes.ok) {
          const errText = await upstreamRes.text();
          return res.status(upstreamRes.status).json({
            success: false,
            status: upstreamRes.status,
            statusText: upstreamRes.statusText,
            error: `LTA DataMall error (${upstreamRes.status}): ${errText || upstreamRes.statusText}`,
            latencyMs,
          });
        }

        const data = await upstreamRes.json();
        res.setHeader("X-Data-Source", "LTA-DataMall-CarParkAvailabilityv2");
        return res.json(data);
      }

      // Default: Assemble all available lots across HDB + LTA + URA by paginating batches (500 items/page)
      let allLots: any[] = [];
      let skip = 0;
      let hasMore = true;
      let metadataUrl = "";
      const maxBatches = 10; // Safety boundary: Singapore has ~2,500 carparks across all agencies
      let batchCount = 0;

      while (hasMore && batchCount < maxBatches) {
        const batchUrl = `${ltaBaseUrl}?$skip=${skip}`;
        const pageRes = await fetch(batchUrl, {
          method: "GET",
          headers: {
            AccountKey: accountKey,
            Accept: "application/json",
            "User-Agent": "SingaporeCarparkTracker/1.0",
          },
        });

        if (!pageRes.ok) {
          if (batchCount === 0) {
            const errBody = await pageRes.text();
            return res.status(pageRes.status).json({
              success: false,
              status: pageRes.status,
              statusText: pageRes.statusText,
              error: `LTA DataMall API error (${pageRes.status}): ${errBody || pageRes.statusText}. Please ensure your AccountKey is valid and active.`,
              latencyMs: Date.now() - startTime,
            });
          }
          break;
        }

        const pageJson: any = await pageRes.json();
        if (pageJson["odata.metadata"]) {
          metadataUrl = pageJson["odata.metadata"];
        }

        const items = Array.isArray(pageJson.value) ? pageJson.value : [];
        allLots = allLots.concat(items);
        batchCount++;

        // If returned fewer than 500 items, all records have been retrieved
        if (items.length < 500) {
          hasMore = false;
        } else {
          skip += 500;
        }
      }

      const latencyMs = Date.now() - startTime;
      res.setHeader("X-Data-Source", "LTA-DataMall-CarParkAvailabilityv2");
      res.setHeader("X-Total-Carparks", String(allLots.length));
      res.setHeader("X-Latency-Ms", String(latencyMs));

      return res.json({
        "odata.metadata":
          metadataUrl || `${ltaBaseUrl}/$metadata#CarParkAvailabilityv2`,
        value: allLots,
      });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        error:
          err.message ||
          "Failed to connect to LTA DataMall CarParkAvailabilityv2 upstream endpoint.",
        latencyMs: Date.now() - startTime,
      });
    }
  });

  // Proxy endpoint for user-configured external API
  // Allows user to test or route any external API (LTA DataMall, custom endpoint, webhook, etc.) without CORS issues
  app.post("/api/proxy-external-carpark", async (req, res) => {
    const startTime = Date.now();
    const { endpoint, headers = {}, method = "GET", body } = req.body || {};

    if (!endpoint || typeof endpoint !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing required 'endpoint' string in request body.",
      });
    }

    try {
      // Validate URL
      new URL(endpoint);

      const fetchOptions: RequestInit = {
        method: method.toUpperCase(),
        headers: {
          "Accept": "application/json",
          "User-Agent": "SingaporeCarparkTracker/1.0",
          ...headers,
        },
      };

      if (method.toUpperCase() === "POST" && body) {
        fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
        if (!(fetchOptions.headers as any)["Content-Type"]) {
          (fetchOptions.headers as any)["Content-Type"] = "application/json";
        }
      }

      const upstreamRes = await fetch(endpoint, fetchOptions);
      const latencyMs = Date.now() - startTime;
      const status = upstreamRes.status;
      const statusText = upstreamRes.statusText;

      let data: any = null;
      const contentType = upstreamRes.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await upstreamRes.json();
      } else {
        const text = await upstreamRes.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      return res.json({
        success: upstreamRes.ok,
        status,
        statusText,
        latencyMs,
        endpoint,
        data,
      });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        error: err.message || "Failed to fetch from external API endpoint",
        latencyMs: Date.now() - startTime,
        endpoint,
      });
    }
  });

  // Vite middleware for development vs Static dist for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
