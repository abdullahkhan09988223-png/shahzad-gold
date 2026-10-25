import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import Calculator from "@/components/Calculator"; // 👈 ایمپورت ماشین حساب

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SHAHZAD GOLD | سیستم مدیریت طلا و جواهر",
  description: "سیستم جامع مدیریت معاملات، مشتریان و حساب‌های طلا و جواهر",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={inter.className}>
        <I18nProvider>
          {children}
          <Calculator /> {/* 👈 قرار دادن ماشین‌حساب در تمام صفحات */}
        </I18nProvider>
      </body>
    </html>
  );
}