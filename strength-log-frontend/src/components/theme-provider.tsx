"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// [수정] 내부 경로 import 대신, 컴포넌트 자체에서 Props 타입을 추출합니다.
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}