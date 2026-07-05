import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AJH Client Portal",
    template: "%s · AJH Client Portal",
  },
  description: "Client portal and agency console for AJH Website Management.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
