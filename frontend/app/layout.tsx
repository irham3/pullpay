import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "PullPay — Trust-minimized open source rewards",
    template: "%s · PullPay",
  },
  description:
    "Merge the PR, the contributor gets paid in USDC — verified without an intermediary (UMA), settled without gas, and recorded as on-chain reputation (EAS). On Optimism.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans antialiased min-h-screen flex flex-col bg-bg text-text">
        <Providers>
          <Header />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
