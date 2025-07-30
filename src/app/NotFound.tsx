"use client";

import { routeProtection } from "@/config/RouteProtection";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  const routes = routeProtection.getRoutes();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-slate-300 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            ページが見つかりません
          </h2>
          <p className="text-slate-600 mb-8">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href={routes.HOME}
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            ホームに戻る
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            前のページに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
