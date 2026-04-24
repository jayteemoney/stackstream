import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { QueryProvider } from "@/providers/query-provider";
import { StacksProvider } from "@/providers/stacks-provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "StackStream — Real-Time Payment Streaming on Stacks",
  description:
    "Real-time payment streaming protocol on Stacks. Pay teams, contractors, grantees, or anyone — block-by-block in sBTC, USDA, ALEX, xBTC, or any SIP-010 token.",
  openGraph: {
    title: "StackStream",
    description: "Real-time payment streaming on Stacks — for teams, organizations, and individuals. Multi-token support.",
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
