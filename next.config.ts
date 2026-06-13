import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 로컬 개발 중 왼쪽 아래에 뜨는 검은 Next.js 표시를 숨깁니다.
  // 실제 서비스처럼 화면을 검수하기 위해 개발 도구 배지를 끕니다.
  devIndicators: false,
};

export default nextConfig;
