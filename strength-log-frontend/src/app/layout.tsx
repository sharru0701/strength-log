import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Strength Logger",
  description: "Smart 5/3/1 Workout Logger",
  // iOS 홈 화면 추가 시 상단바 투명 처리
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Strength Logger",
  },
};

export const viewport: Viewport = {
  // [핵심] 브라우저 UI를 강제로 다크 모드로 고정
  colorScheme: "dark",
  // 주소창 색상을 앱 배경색(#09090b)과 일치시킴
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // [중요] html 태그에도 dark 클래스 추가
    <html lang="ko" className="dark">
      {/* overscroll-none: 전체 화면 튕김 방지 */}
      <body className="bg-black text-white antialiased overscroll-none">
        {children}
      </body>
    </html>
  );
}