import { Providers } from "./providers";
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
  return (
    <html lang="id">
      <body className="bg-slate-50/70 text-zinc-900 min-h-screen antialiased selection:bg-zinc-900 selection:text-white">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
