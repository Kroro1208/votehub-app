import { Suspense } from "react";
import type { Metadata } from "next";

import "react-toastify/dist/ReactToastify.css";
import "../index.css";
import ClientProviders from "./components/ClientProviders";
import Loading from "./components/Loading";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "Social Media App",
  description: "A Next.js social media application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body suppressHydrationWarning={true}>
        <ClientProviders>
          <div className="min-h-screen bg-background text-foreground transition-all duration-700 pt-20">
            <Navbar />
            <div className="container mx-auto px-4 py-6">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <Loading />
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
