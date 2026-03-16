import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Licitaí - Alertas de Licitações Inteligentes",
  description: "Monitoramento automático de licitações públicas federais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-surface antialiased`}>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 ml-0 md:ml-64 min-h-screen flex flex-col transition-all duration-300">
            <Header />
            <main className="p-4 md:p-8 flex-1">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
