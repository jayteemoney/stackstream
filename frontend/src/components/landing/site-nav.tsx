import Link from "next/link";
import Image from "next/image";

const links = [
  { href: "/organisations", label: "Organisations" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/earn", label: "Earn" },
];

/** Top navigation for the public pages (landing, organisations). */
export function SiteNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-surface-0/80 backdrop-blur-md border-b border-border/50">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/logo-oval.png"
          alt="StackStream"
          width={46}
          height={36}
          className="h-9 w-auto"
          priority
        />
      </Link>
      <div className="flex items-center gap-4 sm:gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hidden md:inline text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/dashboard"
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          Launch App
        </Link>
      </div>
    </nav>
  );
}
