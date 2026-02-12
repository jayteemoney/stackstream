import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { StacksProvider } from "@/providers/stacks-provider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StackStream — Bitcoin-Native Payroll Streaming",
  description:
    "Real-time payment streaming protocol for DAOs on Stacks. Pay contributors block-by-block with sBTC.",
  openGraph: {
    title: "StackStream",
    description: "Real-time payment streaming for DAOs on Stacks",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-surface-0 text-zinc-100`}
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
