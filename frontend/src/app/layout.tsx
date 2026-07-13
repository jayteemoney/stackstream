import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { QueryProvider } from "@/providers/query-provider";
import { StacksProvider } from "@/providers/stacks-provider";
import { StaleDeployGuard } from "@/components/stale-deploy-guard";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "StackStream | Real-time money, settled on Bitcoin",
  description:
    "Stream payroll, grants, and subscriptions in real time on Stacks. Recipients earn every block and claim anytime, and settlement inherits Bitcoin finality. Works with sBTC, USDA, ALEX, xBTC, or any SIP-010 token.",
  openGraph: {
    title: "StackStream",
    description: "Real-time money, settled on Bitcoin. Streaming payroll, grants, and subscriptions for DAOs, merchants, freelancers, and grant programs on Stacks.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-surface-0 text-zinc-100`}
      >
        <QueryProvider>
          <StaleDeployGuard />
          <StacksProvider>
            {children}
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "#18181b",
                  border: "1px solid #27272a",
                  color: "#fafafa",
                },
              }}
            />
          </StacksProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
