import React, { useState } from "react";
import {
  X,
  Code2,
  Copy,
  Check,
  Download,
  Search,
  Server,
  Clock,
  Zap,
} from "lucide-react";
import { FetchResult } from "../types";

interface RawApiInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fetchResult: FetchResult | null;
}

export const RawApiInspectorModal: React.FC<RawApiInspectorModalProps> = ({
  isOpen,
  onClose,
  fetchResult,
}) => {
  const [copied, setCopied] = useState(false);
  const [jsonSearch, setJsonSearch] = useState("");

  if (!isOpen) return null;

  const rawJson = fetchResult?.rawPayload;
  const jsonString = rawJson ? JSON.stringify(rawJson, null, 2) : "No payload available";

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `singapore_carparks_live_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="raw-api-inspector-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="raw-api-inspector-modal"
        className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl shadow-xl overflow-hidden my-6 flex flex-col max-h-[90vh] text-slate-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Live External API Inspector
              </h2>
              <p className="text-xs text-slate-500">
                100% Genuine, un-hallucinated raw response payload from live upstream endpoint
              </p>
            </div>
          </div>
          <button
            id="btn-close-inspector"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-blue-700 truncate max-w-xs sm:max-w-md font-medium">
                {fetchResult?.endpoint || "Default Endpoint"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Latency: <b className="text-slate-900">{fetchResult?.latencyMs || 0}ms</b></span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Fetched: {fetchResult?.fetchedAt || "N/A"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition-colors flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? "Copied" : "Copy Payload"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition-colors flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Save JSON</span>
            </button>
          </div>
        </div>

        {/* Body Viewer */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-slate-950">
          <pre className="text-emerald-400 whitespace-pre-wrap selection:bg-blue-600 selection:text-white leading-relaxed">
            {jsonString}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Payload size: ~{Math.round(jsonString.length / 1024)} KB • Total Carparks:{" "}
            {fetchResult?.carparks.length || 0}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
