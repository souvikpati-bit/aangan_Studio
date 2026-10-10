import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: ["400"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Aangan Leads",
  description: "Voice-qualified enquiries for Aangan Studio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Header />
        <main id="main" className="wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>{children}</main>
      </body>
    </html>
  );
}
