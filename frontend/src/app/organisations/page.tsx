import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Link2,
  Plus,
  Radio,
  Waves,
} from "lucide-react";
import { SiteNav } from "@/components/landing/site-nav";
import { Footer } from "@/components/landing/footer";
import {
  explorerTxUrl,
  getOrganisationDirectory,
  organisationInitials,
  type Organisation,
  type OrganisationDirectory,
} from "@/lib/organisations";

// Read from the chain on request (cached for a minute in the data layer), so a
// registration shows up here without a redeploy.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organisations | StackStream",
  description:
    "Every organisation registered on StackStream, read live from the contract on Stacks mainnet.",
  openGraph: {
    title: "Organisations on StackStream",
    description: "The teams paying people as they work, read live from the contract.",
    type: "website",
  },
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

function formatDate(iso: string | null): string {
  return iso ? dateFormat.format(new Date(iso)) : "Date pending";
}

function truncateAddress(address: string): string {
  return address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

/**
 * Avatar gradients, all inside the brand's warm range. The pick is derived
 * from the admin address, so an organisation keeps its colour across visits.
 */
const AVATAR_GRADIENTS = [
  "from-brand-500 to-amber-400",
  "from-orange-600 to-rose-500",
  "from-amber-500 to-yellow-300",
  "from-brand-400 to-orange-700",
  "from-rose-500 to-brand-400",
];

function avatarGradient(admin: string): string {
  let hash = 0;
  for (const char of admin) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function delay(index: number): CSSProperties {
  return { animationDelay: `${Math.min(index, 8) * 70}ms` };
}

export default async function OrganisationsPage() {
  let directory: OrganisationDirectory | null = null;
  try {
    directory = await getOrganisationDirectory();
  } catch {
    directory = null;
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <SiteNav />

      <main>
        <Hero directory={directory} />

        <section className="relative mx-auto max-w-6xl px-6 pb-24">
          {directory ? <Directory directory={directory} /> : <Unavailable />}
        </section>

        <HowToJoin />
      </main>

      <Footer />
    </div>
  );
}

// ============================================================================
// Hero: the readout
// ============================================================================

function Hero({ directory }: { directory: OrganisationDirectory | null }) {
  const total = directory?.total ?? null;
  const streams = directory?.organisations.reduce((sum, o) => sum + o.streamsTracked, 0) ?? null;
  const newest = directory?.organisations[0] ?? null;

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
          <div className="animate-fade-up" style={delay(1)}>
            <h1 className="text-4xl font-bold tracking-tight leading-[1.08] sm:text-5xl xl:text-[3.5rem]">
              <span className="block text-balance text-zinc-100">The teams paying people</span>
              <span className="block gradient-text">as they work.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">
              Every organisation below registered on StackStream from its own wallet, on Stacks
              mainnet. Nothing here is typed in by us: each name, date and stream count comes
              straight from the chain, and every entry links to its receipt.
            </p>
          </div>

          {/* The readout */}
          <div
            className="animate-fade-up glass relative overflow-hidden rounded-3xl p-6 sm:p-8"
            style={delay(2)}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl" />
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              Organisations registered
            </p>
            <p className="mt-3 font-mono text-7xl font-semibold tabular-nums leading-none text-brand-400 sm:text-8xl">
              {total ?? "–"}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-border/60 pt-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-600">Streams tracked</p>
                <p className="mt-1.5 font-mono text-2xl tabular-nums text-zinc-200">
                  {streams ?? "–"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-600">Newest</p>
                <p className="mt-1.5 truncate text-sm font-medium text-zinc-200" title={newest?.name}>
                  {newest ? newest.name : "–"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {newest ? formatDate(newest.registeredAt) : ""}
                </p>
              </div>
            </div>
            {directory && (
              <p className="mt-6 flex items-center gap-1.5 font-mono text-[11px] text-zinc-600">
                <Radio className="h-3 w-3" />
                {directory.network} · updated {timeFormat.format(new Date(directory.asOf))} UTC
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Directory
// ============================================================================

function Directory({ directory }: { directory: OrganisationDirectory }) {
  const { organisations, unlisted } = directory;

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Directory
        </h2>
        <p className="text-xs text-zinc-600">Newest first</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {organisations.map((organisation, index) => (
          <OrganisationCard
            key={organisation.admin}
            organisation={organisation}
            network={directory.network}
            isNewest={index === 0}
            index={index}
          />
        ))}
        <JoinCard index={organisations.length} first={organisations.length === 0} />
      </div>

      {unlisted > 0 && (
        <p className="mt-6 text-center text-xs text-zinc-600">
          The contract counts {unlisted} more{" "}
          {unlisted === 1 ? "registration" : "registrations"} that could not be listed from the
          transaction history yet. They are included in the total above.
        </p>
      )}
    </>
  );
}

function OrganisationCard({
  organisation,
  network,
  isNewest,
  index,
}: {
  organisation: Organisation;
  network: "mainnet" | "testnet";
  isNewest: boolean;
  index: number;
}) {
  return (
    <article
      className="animate-fade-up group relative overflow-hidden rounded-2xl border border-border bg-surface-1 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-[0_0_40px_-12px_rgba(249,115,22,0.35)]"
      style={delay(index + 3)}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/0 to-transparent transition-colors duration-300 group-hover:via-brand-500/60" />

      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradient(organisation.admin)} text-sm font-bold text-white shadow-lg shadow-brand-500/10`}
          aria-hidden="true"
        >
          {organisationInitials(organisation.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-zinc-100" title={organisation.name}>
              {organisation.name}
            </h3>
            {isNewest && (
              <span className="shrink-0 rounded-full border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-400">
                Newest
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-xs text-zinc-500" title={organisation.admin}>
            {truncateAddress(organisation.admin)}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-border/60 pt-5">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-zinc-600">Joined</dt>
          <dd className="mt-1 text-sm text-zinc-300">{formatDate(organisation.registeredAt)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-zinc-600">Streams</dt>
          <dd className="mt-1 font-mono text-sm tabular-nums text-zinc-300">
            {organisation.streamsTracked}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-zinc-600">Status</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-sm">
            <span
              className={`h-1.5 w-1.5 rounded-full ${organisation.isActive ? "bg-emerald-400" : "bg-zinc-600"}`}
            />
            <span className={organisation.isActive ? "text-emerald-400" : "text-zinc-500"}>
              {organisation.isActive ? "Active" : "Inactive"}
            </span>
          </dd>
        </div>
      </dl>

      <a
        href={explorerTxUrl(organisation.registrationTxId, network)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-brand-400"
      >
        Registration receipt, block {organisation.registeredAtBlock.toLocaleString("en-US")}
        <ArrowUpRight className="h-3 w-3" />
      </a>
    </article>
  );
}

function JoinCard({ index, first }: { index: number; first: boolean }) {
  return (
    <Link
      href="/dashboard/register"
      className="animate-fade-up group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl border border-dashed border-border p-6 transition-all duration-300 hover:border-brand-500/40 hover:bg-brand-500/[0.03]"
      style={delay(index + 3)}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500 transition-colors group-hover:border-brand-500/50 group-hover:text-brand-400">
        <Plus className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-zinc-100">
          {first ? "Be the first team here" : "Your team could be next"}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
          Register once, then pay your people as they work, in any token on Stacks.
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-400">
          Register your organisation
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function Unavailable() {
  return (
    <div className="glass mx-auto max-w-lg rounded-2xl p-8 text-center">
      <p className="text-base font-medium text-zinc-200">The chain could not be read just now</p>
      <p className="mt-2 text-sm text-zinc-500">
        The directory is read live from Stacks, and the node did not answer. Refresh in a moment,
        or check the live count at{" "}
        <a href="/api/stats" className="text-brand-400 hover:underline">
          /api/stats
        </a>
        .
      </p>
    </div>
  );
}

// ============================================================================
// How to join
// ============================================================================

const STEPS = [
  {
    icon: Building2,
    title: "Register once",
    body: "One transaction from your organisation's wallet puts you in this directory.",
  },
  {
    icon: Link2,
    title: "Open a stream",
    body: "Pick who, how much and how long, in sBTC, USDA or your own token. One link does it.",
  },
  {
    icon: Waves,
    title: "They claim as they earn",
    body: "Balances grow every few seconds. You can pause, top up or cancel at any time.",
  },
];

function HowToJoin() {
  return (
    <section className="relative border-t border-border/60 bg-surface-1/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
          Joining takes a few minutes.
        </h2>
        <p className="mt-3 max-w-xl text-zinc-400">
          No fee from us. Funds sit in an audited contract, never with us.
        </p>

        <ol className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-border bg-surface-1 p-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-brand-400">0{i + 1}</span>
                <step.icon className="h-4 w-4 text-zinc-500" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-100">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{step.body}</p>
            </li>
          ))}
        </ol>

        <Link
          href="/dashboard/register"
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          Register your organisation
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
