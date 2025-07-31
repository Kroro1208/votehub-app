import type { Metadata } from "next";
import { Suspense } from "react";

import "react-toastify/dist/ReactToastify.css";
import { TokenCleanup } from "../components/TokenCleanup";
import "../index.css";
import ClientProviders from "./components/ClientProviders";
import Loading from "./components/Loading";
import Navbar from "./components/Navbar";
import { AuthGuard } from "./components/AuthGuard";

export const metadata: Metadata = {
  title: "みんなで決めるVoteHub",
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
        <TokenCleanup />
        <ClientProviders>
          <AuthGuard>
            <div className="min-h-screen bg-background text-foreground transition-all duration-700 pt-20">
              {/* Issue #73: Navbarを独立したSuspense境界に分離 */}
              <Suspense
                fallback={
                  <nav className="fixed top-0 w-full z-40 bg-[rgba(10,10,10,0.8)] backdrop-blur-lg border-b border-white/10 shadow-lg">
                    <div className="ml-64">
                      <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between h-16 pr-6">
                          <div className="text-gray-300">Loading...</div>
                        </div>
                      </div>
                    </div>
                  </nav>
                }
              >
                <Navbar />
              </Suspense>

              <div className="container mx-auto px-4 py-6">
                {/* Issue #73: コンテンツ専用のSuspense境界 */}
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center min-h-[20vh]">
                      <Loading />
                    </div>
                  }
                >
                  {children}
                </Suspense>
              </div>
            </div>
          </AuthGuard>
        </ClientProviders>
      </body>
    </html>
  );
}
