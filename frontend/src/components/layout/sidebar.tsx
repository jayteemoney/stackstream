"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useBlockHeight } from "@/hooks/use-block-height";
import { useAppStore } from "@/stores/app-store";
import { FEEDBACK_URL, NETWORK_LABEL } from "@/lib/constants";
import {
  LayoutDashboard,
  PlusCircle,
  List,
  BarChart3,
  Building2,
  Coins,
  Clock,
  Zap,
  MessageSquare,
} from "lucide-react";

const adminLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/create", label: "Create Stream", icon: PlusCircle },
  { href: "/dashboard/streams", label: "Manage Streams", icon: List },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/register", label: "Register Workspace", icon: Building2 },
];

const earnLinks = [
  { href: "/earn", label: "Earnings", icon: Coins },
  { href: "/earn/streams", label: "My Streams", icon: Zap },
  { href: "/earn/history", label: "History", icon: Clock },
];

export function Sidebar() {
  const pathname = usePathname();
  const { blockHeight } = useBlockHeight();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  return (
    <>
      {/* Backdrop overlay — mobile only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-surface-0 transition-transform duration-300",
          // Mobile: hidden by default, shown when open
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible
          "md:translate-x-0"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
          <Image
            src="/logo-full.png"
            alt="StackStream"
            width={62}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </Link>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Admin Section */}
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Sender
            </p>
            <ul className="space-y-0.5">
              {adminLinks.map((link) => {
                const active =
                  link.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-brand-500/10 text-brand-400"
                          : "text-zinc-400 hover:bg-surface-3 hover:text-zinc-200"
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Earn Section */}
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Recipient
            </p>
            <ul className="space-y-0.5">
              {earnLinks.map((link) => {
                const active =
                  link.href === "/earn"
                    ? pathname === "/earn"
                    : pathname.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "text-zinc-400 hover:bg-surface-3 hover:text-zinc-200"
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Feedback link */}
        <div className="border-t border-border px-3 pt-3 pb-2">
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-surface-3 hover:text-zinc-200"
          >
            <MessageSquare className="h-4 w-4" />
            Send feedback
          </a>
        </div>

        {/* Block height footer */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>{NETWORK_LABEL}</span>
            <span className="ml-auto font-mono tabular-nums text-zinc-500">
              #{blockHeight.toLocaleString()}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
