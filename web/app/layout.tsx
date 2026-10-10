import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import "./premium.css";
import Header from "../components/Header";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: ["300", "400"], style: ["normal", "italic"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Aangan Studio · Leads",
  description: "Every enquiry for Aangan Studio, answered, qualified and booked.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Header />
        <main id="main" className="wrap" style={{ paddingTop: 28, paddingBottom: 24 }}>{children}</main>
        <footer className="wrap foot">
          <span>Aangan Studio · interiors, designed and delivered in Pune</span>
          <span>Photography from <a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a>, used under the Unsplash licence</span>
        </footer>
      </body>
    </html>
  );
}
