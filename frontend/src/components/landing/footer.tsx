import Link from "next/link";
import { Twitter, Github, Linkedin, Zap, ExternalLink } from "lucide-react";

const TelegramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const socialLinks = [
  {
    label: "X (Twitter)",
    href: "https://x.com/stackstream0",
    icon: <Twitter className="h-4 w-4" />,
  },
  {
    label: "Telegram",
    href: "https://t.me/dev_jaytee",
    icon: <TelegramIcon />,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/jethro-irmiya-a2153427b/",
    icon: <Linkedin className="h-4 w-4" />,
  },
  {
    label: "GitHub",
    href: "https://github.com/jayteemoney/stackstream",
    icon: <Github className="h-4 w-4" />,
  },
];

const footerLinks = [
  {
    heading: "Protocol",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Earn", href: "/earn" },
      { label: "Create Stream", href: "/dashboard/create" },
      { label: "Register DAO", href: "/dashboard/register" },
    ],
  },
  {
    heading: "Developers",
    links: [
      {
        label: "GitHub",
        href: "https://github.com/jayteemoney/stackstream",
        external: true,
      },
      {
        label: "Smart Contracts",
        href: "https://github.com/jayteemoney/stackstream/tree/main/contracts",
        external: true,
      },
      {
        label: "Stacks Docs",
        href: "https://docs.stacks.co",
        external: true,
      },
      {
        label: "Hiro Explorer",
        href: "https://explorer.hiro.so/?chain=testnet",
        external: true,
      },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "X (Twitter)", href: "https://x.com/stackstream0", external: true },
      { label: "Telegram", href: "https://t.me/dev_jaytee", external: true },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/jethro-irmiya-a2153427b/", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-8 border-t border-border bg-surface-0">
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

      <div className="mx-auto max-w-6xl px-6">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/20">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-100">
                Stack<span className="text-brand-400">Stream</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-zinc-500 max-w-xs">
              Bitcoin-native payroll streaming for DAOs. Pay contributors
              block-by-block with sBTC on Stacks.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-2 text-zinc-500 transition-all duration-200 hover:border-brand-500/30 hover:bg-surface-3 hover:text-brand-400"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((group) => (
            <div key={group.heading}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-600">
                {group.heading}
              </p>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-500 transition-colors hover:text-zinc-200"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border py-6 sm:flex-row">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} StackStream. Built on{" "}
            <a
              href="https://stacks.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Stacks
            </a>
            . Bitcoin-secured.
          </p>

          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <a
              href="https://explorer.hiro.so/?chain=testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-zinc-400"
            >
              Testnet
            </a>
            <span className="text-zinc-800">·</span>
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
