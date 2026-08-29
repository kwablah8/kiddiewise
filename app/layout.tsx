import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { RouteProgressBar } from "@/components/app/route-progress-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kiddiewise Portal",
  description: "Kiddiewise School Complex — school management portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `data-brand` lives HERE, on <html>, so the Kiddiewise palette in app/globals.css reaches
    // every surface, marketing, the authenticated portal, and the auth screens alike. It used to
    // sit on the `(marketing)` layout to keep the brand OUT of the portal; that wall came down when
    // this build was tailored to a specific school (see the token block's HISTORY note).
    <html
      lang="en"
      data-brand="kiddiewise"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* One bar for the whole product: marketing, auth and all three portals. It sits outside
            <Providers> because it needs nothing from React Query; its own store is the state. */}
        <RouteProgressBar />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
