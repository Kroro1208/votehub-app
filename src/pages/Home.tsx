import React from "react";

import Sidebar from "../components/SideBar.tsx";
import RightPanel from "../components/RightPanel.tsx";
import WelcomeModal from "../components/WelcomeModal.tsx";
import { useFirstTimeUser } from "../hooks/useFirstTimeUser.ts";
import { useState, useEffect } from "react";
import HeaderStatus from "../components/Home/HeaderStatus.tsx";
import TabSection from "../components/Home/TabSection.tsx";

export default function Home() {
  const { isFirstTime } = useFirstTimeUser();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (isFirstTime) {
      setShowWelcome(true);
    }
  }, [isFirstTime]);

  return (
    <div className="min-h-screen">
      <Sidebar />
      {/* Main Content */}
      <div className="ml-52 min-h-screen bg-slate-300 dark:bg-dark-bg transition-colors">
        {/* Header with stats */}
        <HeaderStatus />

        {/* Tabs Section */}
        <div className="border-b mt-5 border-slate-200 dark:border-slate-700">
          <div className="max-w-4xl mx-auto px-6 xl:mr-80">
            <TabSection />
          </div>
        </div>
        <RightPanel />
      </div>

      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
      />
    </div>
  );
}
