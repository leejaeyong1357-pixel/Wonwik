import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wonik OPIc Trainer",
  description: "원익 임직원 OPIc 영어 말하기 AI 학습 플랫폼",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
