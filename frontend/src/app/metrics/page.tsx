import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Coins,
  Database,
  Radio,
  TrendingUp,
} from "lucide-react";
import { SiteNav } from "@/components/landing/site-nav";
import { Footer } from "@/components/landing/footer";
import { Card } from "@/components/ui/card";
import { NETWORK_LABEL } from "@/lib/constants";
import {
  getProtocolMetrics,
  type ProtocolMetrics,
  type TokenVolume,
} from "@/lib/protocol-metrics";
import { formatTokenAmount } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Protocol metrics | StackStream",
  description:
    "Cumulative value streamed on StackStream, reconstructed from every stream-created event on Stacks.",
  openGraph: {
    title: "StackStream protocol metrics",
    description: "The cumulative value streamed on StackStream, read from the chain.",
    type: "website",
  },
};

const usdFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactUsdFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value >= 1_000_000 ? compactUsdFormat.format(value) : usdFormat.format(value);
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1_000) return usdFormat.format(value);
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 6 })}`;
}

function tokenAmount(token: TokenVolume): string {
  if (token.decimals === null) return token.rawVolume;
  return formatTokenAmount(BigInt(token.rawVolume), token.decimals);
}

export default async function MetricsPage() {
  let metrics: ProtocolMetrics | null = null;
  try {
    metrics = await getProtocolMetrics();
  } catch {
    metrics = null;
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <SiteNav />

      <main>
        <Hero metrics={metrics} />

        <section className="relative mx-auto max-w-6xl px-6 pb-24">
          {metrics ? <TokenTable metrics={metrics} /> : <Unavailable />}
        </section>

        <Methodology metrics={metrics} />
      </main>

      <Footer />
    </div>
  );
}

function Hero({ metrics }: { metrics: ProtocolMetrics | null }) {
  const total = metrics ? formatUsd(metrics.totalVolumeUsd) : "–";
  const streams = metrics?.totalStreams ?? null;
  const tokens = metrics?.tokens.length ?? null;
  const priced = metrics?.pricedTokens ?? null;
  const unpriced = metrics?.unpricedTokens ?? null;

  return (
    <section className="relative overflow-hidden pt-36 pb-16 sm:pt-44 sm:pb-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.12)_0%,transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/5 px-4 py-1.5 text-xs font-medium text-brand-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
            </span>
            Read live from the contract
          </span>
        </div>

        <div className="mt-8 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="animate-fade-up" style={{ animationDelay: "70ms" }}>
            <h1 className="text-4xl font-bold tracking-tight leading-[1.08] sm:text-5xl xl:text-[3.5rem]">
              <span className="block text-balance text-zinc-100">The stream,</span>
              <span className="block gradient-text">in numbers.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">
              Every stream that has ever been opened on StackStream, counted from its
              <span className="font-mono text-zinc-300"> stream-created </span>
              event on Stacks. Cumulative volume only goes up; claims and cancellations never
              reduce it.
            </p>
          </div>

          <div
            className="animate-fade-up glass relative overflow-hidden rounded-3xl p-6 sm:p-8"
            style={{ animationDelay: "140ms" }}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl" />
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              Cumulative streamed
            </p>
            <p className="mt-3 font-mono text-5xl font-semibold tabular-nums leading-none text-brand-400 sm:text-6xl">
              {total}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {priced !== null && unpriced !== null
                ? `${priced} priced ${priced === 1 ? "token" : "tokens"} · ${unpriced} unpriced`
                : "Live USD estimate for priced tokens"}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-border/60 pt-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-600">Streams created</p>
                <p className="mt-1.5 font-mono text-2xl tabular-nums text-zinc-200">
                  {streams ?? "–"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-600">Tokens streamed</p>
                <p className="mt-1.5 font-mono text-2xl tabular-nums text-zinc-200">
                  {tokens ?? "–"}
                </p>
              </div>
            </div>

            {metrics && (
              <p className="mt-6 flex items-center gap-1.5 font-mono text-[11px] text-zinc-600">
                <Radio className="h-3 w-3" />
                {NETWORK_LABEL} · updated {new Date(metrics.asOf).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                })}{" "}
                UTC
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TokenTable({ metrics }: { metrics: ProtocolMetrics }) {
  const missing = Math.max(0, metrics.totalStreams - metrics.indexedStreams);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Volume by token
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Cumulative deposits, not current escrow. Unpriced tokens stay visible in raw units.
          </p>
        </div>
        <a
          href="/api/metrics"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-brand-400"
        >
          Public API
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>

      <Card className="overflow-hidden p-0">
        {metrics.tokens.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-zinc-500">
            No stream-created events have been indexed yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 sm:px-6">
                    Token
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Streams
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Cumulative streamed
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Price
                  </th>
                  <th className="px-4 py-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 sm:pr-6">
                    USD value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.tokens.map((token) => (
                  <tr key={token.contractId} className="transition-colors hover:bg-surface-2">
                    <td className="px-4 py-4 sm:px-6">
                      <p className="font-medium text-zinc-200">{token.symbol}</p>
                      <p
                        className="mt-0.5 font-mono text-[11px] text-zinc-600"
                        title={token.contractId}
                      >
                        {token.contractId.split(".")[1] ?? token.contractId}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right font-mono tabular-nums text-zinc-300">
                      {token.streams}
                    </td>
                    <td className="px-4 py-4 text-right font-mono tabular-nums text-zinc-200">
                      {tokenAmount(token)}
                      <span className="ml-1.5 text-xs text-zinc-500">{token.symbol}</span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-xs tabular-nums text-zinc-400">
                      {token.priceUsd === null ? (
                        <span className="text-zinc-600">Unpriced</span>
                      ) : (
                        formatPrice(token.priceUsd)
                      )}
                      {token.priceSource && (
                        <span className="mt-0.5 block text-[10px] text-zinc-600">
                          {token.priceSource}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 pr-4 text-right font-mono tabular-nums text-zinc-200 sm:pr-6">
                      {token.volumeUsd === null ? (
                        <span className="text-zinc-600">—</span>
                      ) : (
                        formatUsd(token.volumeUsd)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-4 flex flex-col gap-1 text-xs text-zinc-600">
        {missing > 0 && (
          <p>
            The contract reports {metrics.totalStreams} streams; {metrics.indexedStreams} have been
            indexed from events. {missing} {missing === 1 ? "stream is" : "streams are"} not yet
            included in the volume above.
          </p>
        )}
        <p>
          USD estimates use DefiLlama prices
          {metrics.pricesAsOf
            ? ` as of ${new Date(metrics.pricesAsOf).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              })} UTC`
            : ""}
          ; USDA is treated as $1.00. Unpriced tokens are excluded from the USD total.
        </p>
      </div>
    </>
  );
}

function Methodology({ metrics }: { metrics: ProtocolMetrics | null }) {
  const items = [
    {
      icon: Database,
      title: "Event-indexed",
      body: "Every stream-created event from stream-manager is read through Hiro and its deposit-amount is added to the token total.",
    },
    {
      icon: TrendingUp,
      title: "Cumulative, not TVL",
      body: "The number is all-time deposits. Claiming or cancelling a stream does not reduce it, so it always measures total flow.",
    },
    {
      icon: CircleDollarSign,
      title: "Live USD estimates",
      body: "Prices come from DefiLlama. USDA is fixed at $1.00 and xBTC follows BTC. Tokens without a price stay visible in raw units.",
    },
  ];

  return (
    <section className="relative border-t border-border/60 bg-surface-1/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
              How this is calculated.
            </h2>
            <p className="mt-3 max-w-xl text-zinc-400">
              No estimates are taken from a database we control. The volume is reconstructed from
              public chain events and the price layer is clearly separated from it.
            </p>
          </div>
          <a
            href="/api/metrics"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-1 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:border-brand-500/30 hover:text-brand-400"
          >
            <BarChart3 className="h-4 w-4" />
            View JSON
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-surface-1 p-6">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-brand-400" />
                <h3 className="text-base font-semibold text-zinc-100">{item.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5" />
            {metrics
              ? `${metrics.indexedStreams} stream-created events indexed`
              : "Event index unavailable"}
          </span>
          <span className="text-zinc-800">·</span>
          <Link href="/organisations" className="transition-colors hover:text-zinc-400">
            Browse organisations
          </Link>
        </div>
      </div>
    </section>
  );
}

function Unavailable() {
  return (
    <div className="glass mx-auto max-w-lg rounded-2xl p-8 text-center">
      <p className="text-base font-medium text-zinc-200">The chain could not be read just now</p>
      <p className="mt-2 text-sm text-zinc-500">
        Metrics are reconstructed from Stacks events, and the node did not answer. Refresh in a
        moment, or check the public endpoint at{" "}
        <a href="/api/metrics" className="text-brand-400 hover:underline">
          /api/metrics
        </a>
        .
      </p>
    </div>
  );
}
