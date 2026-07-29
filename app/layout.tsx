import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HELPBUY｜AI 代采购商业计划与产品方案",
  description:
    "HELPBUY：将非标准采购需求转为可执行任务的 AI 采购执行平台。",
  openGraph: {
    title: "HELPBUY｜AI PROCUREMENT EXECUTION",
    description: "AI 代采购商业计划与产品方案",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "HELPBUY｜AI PROCUREMENT EXECUTION",
    description: "AI 代采购商业计划与产品方案",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
