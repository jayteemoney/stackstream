"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OPENCLAW_API_URL } from "@/lib/constants";
import { formatTokenAmount, getStreamStatusLabel, getStreamStatusColor } from "@/lib/utils";
import { MessageCircle, X, Search, Loader2, Zap, Hash, User, Building2 } from "lucide-react";

type QueryType = "stream" | "sender" | "recipient" | "dao" | "block";

interface ResultEntry {
  type: QueryType;
  query: string;
  data: any;
  error?: string;
}

async function fetchApi(path: string) {
  const res = await fetch(`${OPENCLAW_API_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

function StreamResult({ data }: { data: any }) {
  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium text-zinc-200">Stream #{data.id}</span>
        <span className={cn("font-medium", getStreamStatusColor(data.status?.code ?? data.status))}>
          {data.status?.label ?? getStreamStatusLabel(data.status)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-zinc-400">
        <div>Sender</div>
        <div className="font-mono text-zinc-300 truncate">{data.sender?.slice(0, 8)}...</div>
        <div>Recipient</div>
        <div className="font-mono text-zinc-300 truncate">{data.recipient?.slice(0, 8)}...</div>
        <div>Deposited</div>
        <div className="font-mono text-zinc-300">
          {data.formatted?.deposit ?? formatTokenAmount(data.depositAmount ?? data["deposit-amount"] ?? 0)} msBTC
        </div>
        <div>Claimable</div>
        <div className="font-mono text-emerald-400">
          {data.formatted?.claimable ?? formatTokenAmount(data.claimable ?? 0)} msBTC
        </div>
        {data.progress !== undefined && (
          <>
            <div>Progress</div>
            <div className="font-mono text-zinc-300">{Number(data.progress).toFixed(1)}%</div>
          </>
        )}
      </div>
    </div>
  );
}

function StreamListResult({ data, label }: { data: any; label: string }) {
  const ids = data.streamIds ?? data;
  return (
    <div className="space-y-1 text-xs">
      <p className="text-zinc-400">{label}</p>
      {Array.isArray(ids) && ids.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {ids.map((id: number) => (
            <span key={id} className="rounded-md bg-surface-3 px-2 py-0.5 font-mono text-zinc-300">
              #{id}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-zinc-500 italic">No streams found</p>
      )}
    </div>
  );
}

function DaoResult({ data }: { data: any }) {
  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium text-zinc-200">{data.name}</span>
        <span className={cn("font-medium", data.isActive || data["is-active"] ? "text-emerald-400" : "text-zinc-500")}>
          {data.isActive || data["is-active"] ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-zinc-400">
        <div>Admin</div>
        <div className="font-mono text-zinc-300 truncate">{(data.admin ?? "").slice(0, 8)}...</div>
        <div>Streams created</div>
        <div className="font-mono text-zinc-300">{data.totalStreamsCreated ?? data["total-streams-created"] ?? 0}</div>
        <div>Total deposited</div>
        <div className="font-mono text-zinc-300">
          {formatTokenAmount(data.totalDeposited ?? data["total-deposited"] ?? 0)} msBTC
        </div>
      </div>
    </div>
  );
}

function BlockResult({ data }: { data: any }) {
  return (
    <div className="text-xs space-y-1">
      <p className="text-zinc-400">Current block height</p>
      <p className="text-lg font-mono font-medium text-zinc-200">
        #{(data.blockHeight ?? data.block_height ?? 0).toLocaleString()}
      </p>
    </div>
  );
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [queryType, setQueryType] = useState<QueryType>("stream");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollTop = resultsRef.current.scrollHeight;
    }
  }, [results]);

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q && queryType !== "block") return;

    setLoading(true);
    try {
      let data: any;
      switch (queryType) {
        case "stream":
          data = await fetchApi(`/api/streams/${q}`);
          break;
        case "sender":
          data = await fetchApi(`/api/streams/sender/${q}`);
          break;
        case "recipient":
          data = await fetchApi(`/api/streams/recipient/${q}`);
          break;
        case "dao":
          data = await fetchApi(`/api/daos/${q}`);
          break;
        case "block":
          data = await fetchApi(`/api/blocks/current`);
          break;
      }
      setResults((prev) => [...prev, { type: queryType, query: q, data }]);
    } catch (err: any) {
      setResults((prev) => [
        ...prev,
        { type: queryType, query: q, data: null, error: err.message },
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  }

  const queryOptions: { type: QueryType; icon: typeof Hash; label: string; placeholder: string }[] = [
    { type: "stream", icon: Hash, label: "Stream", placeholder: "Stream ID (e.g. 1)" },
    { type: "sender", icon: User, label: "Sender", placeholder: "Sender address" },
    { type: "recipient", icon: User, label: "Recipient", placeholder: "Recipient address" },
    { type: "dao", icon: Building2, label: "Workspace", placeholder: "Workspace admin address" },
    { type: "block", icon: Zap, label: "Block", placeholder: "No input needed" },
  ];

  const currentOption = queryOptions.find((o) => o.type === queryType)!;

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300",
          open
            ? "bg-zinc-700 hover:bg-zinc-600"
            : "bg-brand-500 hover:bg-brand-600 shadow-brand-500/30"
        )}
      >
        {open ? <X className="h-5 w-5 text-white" /> : <MessageCircle className="h-5 w-5 text-white" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-16 sm:bottom-20 right-3 sm:right-6 z-50 flex w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:w-96 sm:max-w-96 flex-col rounded-2xl border border-border bg-surface-1 shadow-2xl overflow-hidden"
          style={{ maxHeight: "70vh" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3 bg-surface-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10">
              <Zap className="h-3.5 w-3.5 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">OpenClaw Assistant</p>
              <p className="text-[10px] text-zinc-500">Query streams, workspaces, and blockchain state</p>
            </div>
          </div>

          {/* Query type tabs */}
          <div className="flex border-b border-border px-2 py-1.5 gap-1 overflow-x-auto">
            {queryOptions.map((opt) => (
              <button
                key={opt.type}
                onClick={() => setQueryType(opt.type)}
                className={cn(
                  "flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
                  queryType === opt.type
                    ? "bg-brand-500/10 text-brand-400"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-surface-3"
                )}
              >
                <opt.icon className="h-3 w-3" />
                {opt.label}
              </button>
            ))}
          </div>

          {/* Results */}
          <div ref={resultsRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: "200px" }}>
            {results.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <Search className="h-8 w-8 text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500">
                  Query the StackStream protocol.
                </p>
                <p className="text-[10px] text-zinc-600 mt-1">
                  Look up streams, search by address, or check block height.
                </p>
              </div>
            )}
            {results.map((result, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface-0 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 uppercase">
                    {result.type}
                  </span>
                  {result.query && (
                    <span className="text-[10px] text-zinc-600 font-mono truncate">{result.query}</span>
                  )}
                </div>
                {result.error ? (
                  <p className="text-xs text-red-400">{result.error}</p>
                ) : result.type === "stream" ? (
                  <StreamResult data={result.data} />
                ) : result.type === "sender" || result.type === "recipient" ? (
                  <StreamListResult
                    data={result.data}
                    label={`${result.type === "sender" ? "Sent" : "Received"} streams`}
                  />
                ) : result.type === "dao" ? (
                  <DaoResult data={result.data} />
                ) : (
                  <BlockResult data={result.data} />
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleQuery} className="border-t border-border px-3 py-2.5 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentOption.placeholder}
              disabled={queryType === "block" || loading}
              className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
            />
            <Button type="submit" size="sm" loading={loading} disabled={loading}>
              {queryType === "block" ? (
                <Zap className="h-3.5 w-3.5" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
