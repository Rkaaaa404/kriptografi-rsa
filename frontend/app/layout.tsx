"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata = {
  title: "SecurePass RSA",
  description: "Warehouse gate-pass authorization system using pure RSA cryptography",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000 },
        },
      })
  );

  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        <QueryClientProvider client={queryClient}>
          <Navbar />
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              classNames: {
                toast: "bg-slate-900 border border-slate-800 text-slate-100",
              },
            }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
