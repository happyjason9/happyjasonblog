import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jason的個人空間 | 部落格與作品集",
  description: "科技業軟體工程師，分享程式教學與開發筆記",
};

import PointCloud from "@/components/PointCloud/PointCloud";
import Avatar from "@/components/Avatar/Avatar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className={`${inter.variable}`}>
        <PointCloud />
        <Avatar />
        <Navbar />
        <main className="container">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
