import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MotionConfig } from "framer-motion";

export const metadata: Metadata = {
  title: "BlueBay Auto Care — Mobile Detailing SF",
  description:
    "Professional mobile auto detailing in San Francisco. We come to you with eco-friendly products and premium tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
        style={{ background: "#090C14", fontFamily: "'Outfit', sans-serif" }}
      >
        {/* reducedMotion="user" makes all framer-motion animations app-wide
            respect the user's OS/browser reduce-motion setting automatically. */}
        <MotionConfig reducedMotion="user">
          {children}
          <Toaster />
        </MotionConfig>
      </body>
    </html>
  );
}
