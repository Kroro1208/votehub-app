"use client";

import { Plus, Users } from "lucide-react";
import Link from "next/link";
import CommunityList from "../components/Community/CommunityList";
import SideBar from "../components/SideBar";
import { useLanguage } from "../hooks/useLanguage";
const CommunitiesPage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors">
      <SideBar />
      <div className="ml-64 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Users size={24} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-dark-text">
                  {t("space.title")}
                </h1>
              </div>

              {/* Create Community Button */}
              <Link
                href="/space/create"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                <span className="font-medium">{t("space.create")}</span>
              </Link>
            </div>

            <p className="text-slate-600 dark:text-dark-muted max-w-3xl">
              {t("space.description")}
            </p>
          </div>

          <CommunityList />
        </div>
      </div>
    </div>
  );
};

export default CommunitiesPage;
