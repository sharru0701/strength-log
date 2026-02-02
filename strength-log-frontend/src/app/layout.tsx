import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; // [추가]

export const metadata: Metadata = {
  title: "Strength Logger",
  description: "Smart 5/3/1 Workout Logger",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // [변경] 자동으로 맞춤
    title: "Strength Logger",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // themeColor는 제거하거나, JS로 동적 제어해야 완벽하지만 일단 기본값 둡니다.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased overscroll-none">
        {/* [추가] ThemeProvider로 감싸서 시스템 설정 감지 */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}