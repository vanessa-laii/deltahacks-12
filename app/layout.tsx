import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coloring Pages - Health Tech App",
  description: "Dementia-friendly coloring app with cognitive health tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
