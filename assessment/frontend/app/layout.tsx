import type { Metadata } from "next";
import { Lora, Poppins } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Interview Platform",
  description: "Personalized CV-based interview experience"
};

const headingFont = Poppins({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"]
});

const bodyFont = Lora({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500"]
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
