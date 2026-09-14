import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "FocusNest — Study smarter, stress less",
  description:
    "FocusNest is a study companion for students: focus pods, relaxation breaks, stress check-ins, peer support, doubt solving, and exam intelligence for JEE, NEET and more.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
