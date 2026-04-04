import type { Metadata } from "next";
import { Fontdiner_Swanky } from "next/font/google";
import "./globals.css";

const fontdinerSwanky = Fontdiner_Swanky({
  variable: "--font-fontdiner-swanky",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Mill City Hill Carnival",
  description: "I Like To Move It, Move It",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontdinerSwanky.variable} h-full antialiased bg-gray-800 text-gray-200`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
