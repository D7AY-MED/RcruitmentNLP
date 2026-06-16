import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HR Dashboard",
  description: "Candidate matching and unlocking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
