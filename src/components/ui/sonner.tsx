"use client";

import * as React from "react";
import { useTheme } from "next-themes@0.4.6";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={
        // 모바일: 토스트가 화면 폭 - 여백으로 늘어나고 폰트/패딩 축소
        // 데스크톱: 기존 스타일 유지
        "toaster group [&_[data-sonner-toast]]:w-[calc(100%-1.5rem)] sm:[&_[data-sonner-toast]]:w-auto [&_[data-sonner-toast]]:text-xs sm:[&_[data-sonner-toast]]:text-sm [&_[data-sonner-toast]]:px-3 sm:[&_[data-sonner-toast]]:px-4 [&_[data-sonner-toast]]:py-2.5 sm:[&_[data-sonner-toast]]:py-3"
      }
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
