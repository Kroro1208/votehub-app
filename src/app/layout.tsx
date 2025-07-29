import { Suspense } from "react";
import type { Metadata } from "next";

import "react-toastify/dist/ReactToastify.css";
import "../index.css";
import ClientProviders from "./components/ClientProviders";
import Loading from "./components/Loading";
import Navbar from "./components/Navbar";
import NoSSR from "./components/NoSSR";

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
        <NoSSR fallback={
          <div className="min-h-screen bg-slate-100 dark:bg-gray-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
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
        </NoSSR>
      </body>
    </html>
  );
}
