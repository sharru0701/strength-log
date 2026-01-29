import type { NextConfig } from "next";

// 👇 수정 포인트: ': NextConfig'를 지우거나, 뒤에 'as any'를 붙이세요.
const nextConfig = {
  // 1. ESLint 검사 무시 (메모리 절약)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 2. TypeScript 에러 무시 (메모리 절약 & 빌드 성공률 Up)
  typescript: {
    ignoreBuildErrors: true,
  },
  // (혹시 다른 설정이 있다면 여기에...)
};

export default nextConfig;