import React, { useState } from "react";
import {
  X,
  Globe,
  Key,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Server,
  RefreshCw,
  HelpCircle,
  Code,
} from "lucide-react";
import { ExternalApiConfig, ApiSourceMode } from "../types";
import { testExternalEndpoint } from "../services/api";

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExternalApiConfig;
  onSaveConfig: (newConfig: ExternalApiConfig) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [mode, setMode] = useState<ApiSourceMode>(config.mode);
  const [customUrl, setCustomUrl] = useState(config.customUrl);
  const [ltaAccountKey, setLtaAccountKey] = useState(config.ltaAccountKey);
  const [customHeaders, setCustomHeaders] = useState<
    { key: string; value: string }[]
  >(config.customHeaders.length > 0 ? [...config.customHeaders] : [{ key: "", value: "" }]);
  const [method, setMethod] = useState<"GET" | "POST">(config.method || "GET");
  const [postBody, setPostBody] = useState(config.postBody || "");
  const [pollingInterval, setPollingInterval] = useState(
    config.pollingIntervalSeconds
  );
  const [autoRefresh, setAutoRefresh] = useState(config.autoRefresh);

  // Test connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    ok: boolean;
    status: number;
    latencyMs: number;
    error?: string;
    itemsDetected?: number;
    sampleJson?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleAddHeader = () => {
    setCustomHeaders([...customHeaders, { key: "", value: "" }]);
  };

  const handleRemoveHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  const handleHeaderChange = (
    index: number,
    field: "key" | "value",
    val: string
  ) => {
    const next = [...customHeaders];
    next[index][field] = val;
    setCustomHeaders(next);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    let testUrl = "";
    const headersMap: Record<string, string> = {};

    if (mode === "data_gov_sg") {
      testUrl = "https://api.data.gov.sg/v1/transport/carpark-availability";
    } else if (mode === "lta_datamall") {
      testUrl = "/api/data";
      if (ltaAccountKey.trim()) {
        headersMap["AccountKey"] = ltaAccountKey.trim();
      }
    } else {
      testUrl = customUrl.trim();
      for (const h of customHeaders) {
        if (h.key.trim() && h.value.trim()) {
          headersMap[h.key.trim()] = h.value.trim();
        }
      }
    }

    if (!testUrl) {
      setIsTesting(false);
      setTestResult({
        tested: true,
        ok: false,
        status: 400,
        latencyMs: 0,
        error: "Please enter a valid endpoint URL to test.",
      });
      return;
    }

    const res = await testExternalEndpoint(
      testUrl,
      headersMap,
      mode === "custom" ? method : "GET",
      mode === "custom" ? postBody : undefined
    );

    setTestResult({
      tested: true,
      ok: res.ok,
      status: res.status,
      latencyMs: res.latencyMs,
      error: res.error,
      itemsDetected: res.itemsDetected,
      sampleJson: res.data ? JSON.stringify(res.data, null, 2) : undefined,
    });
    setIsTesting(false);
  };

  const handleSave = () => {
    const cleanedHeaders = customHeaders.filter(
      (h) => h.key.trim() !== "" && h.value.trim() !== ""
    );

    onSaveConfig({
      mode,
      customUrl: customUrl.trim(),
      ltaAccountKey: ltaAccountKey.trim(),
      customHeaders: cleanedHeaders,
      method,
      postBody: postBody.trim(),
      pollingIntervalSeconds: pollingInterval,
      autoRefresh,
    });

    onClose();
  };

  const handleResetDefault = () => {
    setMode("data_gov_sg");
    setCustomUrl("");
    setLtaAccountKey("");
    setCustomHeaders([{ key: "", value: "" }]);
    setMethod("GET");
    setPostBody("");
    setPollingInterval(60);
    setAutoRefresh(true);
    setTestResult(null);
  };

  return (
    <div
      id="api-config-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="api-config-modal"
        className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden my-8 text-slate-800"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Live External API Integration
              </h2>
              <p className="text-xs text-slate-500">
                Configure real-time live occupancy endpoint for Singapore carparks
              </p>
            </div>
          </div>
          <button
            id="btn-close-api-config"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-700 text-sm">
          {/* Preset / Mode Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Select API Source Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Data.gov.sg */}
              <button
                type="button"
                onClick={() => setMode("data_gov_sg")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === "data_gov_sg"
                    ? "bg-blue-50/50 border-blue-600 text-slate-900 shadow-2xs ring-1 ring-blue-600"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="font-semibold text-xs text-blue-700 mb-1 flex items-center justify-between">
                  <span>Data.gov.sg</span>
                  <span className="text-[10px] bg-blue-100 px-1.5 py-0.5 rounded text-blue-800 font-medium">
                    Official
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Official open-data API. Zero setup, 2,000+ real-time HDB carparks.
                </p>
              </button>

              {/* Option 2: LTA DataMall */}
              <button
                type="button"
                onClick={() => setMode("lta_datamall")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === "lta_datamall"
                    ? "bg-blue-50/50 border-blue-600 text-slate-900 shadow-2xs ring-1 ring-blue-600"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="font-semibold text-xs text-indigo-700 mb-1 flex items-center justify-between">
                  <span>LTA DataMall</span>
                  <span className="text-[10px] bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-800 font-medium">
                    Key req.
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Singapore LTA CarParkAvailabilityv2 with shopping malls and HDB.
                </p>
              </button>

              {/* Option 3: Custom External API */}
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === "custom"
                    ? "bg-blue-50/50 border-blue-600 text-slate-900 shadow-2xs ring-1 ring-blue-600"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="font-semibold text-xs text-amber-700 mb-1 flex items-center justify-between">
                  <span>Custom API</span>
                  <span className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded text-amber-800 font-medium">
                    Custom URL
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Connect your own API endpoint, proxy, cloud function, or headers.
                </p>
              </button>
            </div>
          </div>

          {/* Mode Details Form */}
          {mode === "data_gov_sg" && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ready to Connect (No API Key Required)</span>
              </div>
              <p className="text-xs text-slate-600">
                Data is fetched directly from the GovTech Singapore real-time carpark availability feed:
              </p>
              <div className="font-mono text-xs bg-white px-3 py-2 rounded-lg text-slate-800 border border-slate-200 overflow-x-auto shadow-2xs">
                https://api.data.gov.sg/v1/transport/carpark-availability
              </div>
              <p className="text-[11px] text-slate-500">
                Contains live gantry sensor counts for over 2,000 HDB parking facilities updated every 60 seconds.
              </p>
            </div>
          )}

          {mode === "lta_datamall" && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>Live Carpark Lots (HDB + LTA + URA) via /api/data</span>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-slate-500 font-medium">Serverless Endpoint:</div>
                <div className="font-mono text-xs bg-white px-3 py-2 rounded-lg text-slate-800 border border-slate-200 shadow-2xs break-all">
                  /api/data
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-slate-500 font-medium">Upstream Destination:</div>
                <div className="font-mono text-[11px] bg-white px-3 py-1.5 rounded-lg text-slate-600 border border-slate-200 shadow-2xs break-all">
                  https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  AccountKey (Header: <span className="font-mono text-slate-900">AccountKey</span>)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={ltaAccountKey}
                    onChange={(e) => setLtaAccountKey(e.target.value)}
                    placeholder="Enter key manually or set LTA_ACCOUNT_KEY in Secrets"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Keys are never hardcoded. You can enter your AccountKey here or add <span className="font-mono text-slate-700">LTA_ACCOUNT_KEY</span> in the AI Studio Secrets panel. The serverless route automatically proxies requests with the required <span className="font-mono text-slate-700">AccountKey</span> header.
                </p>
              </div>
            </div>
          )}

          {mode === "custom" && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-24">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Method
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as "GET" | "POST")}
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Live Carpark API Endpoint URL *
                  </label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://api.example.com/v1/carparks"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Custom Headers */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    HTTP Request Headers (e.g. Authorization, x-api-key)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddHeader}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Header
                  </button>
                </div>
                <div className="space-y-2">
                  {customHeaders.map((header, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) =>
                          handleHeaderChange(idx, "key", e.target.value)
                        }
                        placeholder="Header Name (e.g. x-api-key)"
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none shadow-2xs"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) =>
                          handleHeaderChange(idx, "value", e.target.value)
                        }
                        placeholder="Value"
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none shadow-2xs"
                      />
                      {customHeaders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveHeader(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* POST Body if POST */}
              {method === "POST" && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Request Body (JSON)
                  </label>
                  <textarea
                    rows={3}
                    value={postBody}
                    onChange={(e) => setPostBody(e.target.value)}
                    placeholder='{"filter": "singapore"}'
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none shadow-2xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* Test Connection Button & Result */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-blue-600" />
                  Test Live Connection
                </h4>
                <p className="text-[11px] text-slate-500">
                  Sends a real-time request and verifies endpoint latency and format
                </p>
              </div>
              <button
                type="button"
                id="btn-test-endpoint"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{isTesting ? "Testing..." : "Test Endpoint"}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  testResult.ok
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                <div className="flex items-center justify-between font-mono mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    {testResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    {testResult.ok ? "Connected Successfully" : "Request Failed"}
                  </span>
                  <span>
                    Status: {testResult.status} • {testResult.latencyMs}ms
                  </span>
                </div>
                {testResult.error && (
                  <div className="text-rose-700 font-medium mt-1">{testResult.error}</div>
                )}
                {testResult.itemsDetected !== undefined && (
                  <div className="text-slate-700 mt-0.5">
                    Recognized facilities: <b>{testResult.itemsDetected}</b>
                  </div>
                )}

                {testResult.sampleJson && (
                  <details className="mt-2 text-[11px]">
                    <summary className="cursor-pointer text-slate-600 hover:text-slate-900 font-sans">
                      View Raw JSON Response Sample
                    </summary>
                    <pre className="mt-1.5 p-2 bg-slate-900 rounded border border-slate-800 text-emerald-400 font-mono text-[10px] max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {testResult.sampleJson.slice(0, 800)}...
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Polling & Auto-Refresh Settings */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Polling & Auto-Refresh Frequency
            </label>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auto-refresh-toggle"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded bg-white border-slate-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="auto-refresh-toggle"
                  className="text-xs text-slate-800 font-medium cursor-pointer"
                >
                  Enable Real-Time Background Auto-Refresh
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Interval:</span>
                <select
                  value={pollingInterval}
                  disabled={!autoRefresh}
                  onChange={(e) => setPollingInterval(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg text-xs text-slate-800 px-2.5 py-1.5 disabled:opacity-40 shadow-2xs"
                >
                  <option value={15}>Every 15 seconds</option>
                  <option value={30}>Every 30 seconds</option>
                  <option value={60}>Every 1 minute (Recommended)</option>
                  <option value={120}>Every 2 minutes</option>
                  <option value={300}>Every 5 minutes</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/80">
          <button
            type="button"
            id="btn-reset-default-api"
            onClick={handleResetDefault}
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            Reset to Official Default
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="btn-cancel-api-config"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-save-api-config"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              Apply & Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
