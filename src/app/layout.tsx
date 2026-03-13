import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import PointCloud from "@/components/PointCloud/PointCloud";
import Avatar from "@/components/Avatar/Avatar";
import CustomCursor from "@/components/CustomCursor/CustomCursor";
import BackToTop from "@/components/BackToTop/BackToTop";
import PageTransition from "@/components/PageTransition/PageTransition";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jason的個人空間 | 部落格與作品集",
  description: "科技業軟體工程師，分享程式教學與開發筆記",
};

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
        <CustomCursor />
        <BackToTop />
        <Navbar />
        <main className="container">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </body>
    </html>
  );
}
