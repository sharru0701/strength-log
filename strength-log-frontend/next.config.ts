import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. TypeScript 빌드 에러 무시
  typescript: {
    ignoreBuildErrors: true,
  },
  // 2. 백엔드 연결 Proxy 설정 (가장 중요)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;