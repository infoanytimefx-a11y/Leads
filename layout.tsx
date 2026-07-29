import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Hunter — Signal Board",
  description: "Live scan of dev, trading-automation, and website leads.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-ink text-fg min-h-screen">{children}</body>
    </html>
  );
}
