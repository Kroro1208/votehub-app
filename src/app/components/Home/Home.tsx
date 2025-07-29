"use client";
import { useFirstTimeUser } from "../../hooks/useFirstTimeUser";
import { useEffect, useState } from "react";
import RightPanel from "../RightPanel";
import SideBar from "../SideBar";
import WelcomeModal from "../WelcomeModal";
import HeaderStatus from "./HeaderStatus";
import TabSection from "./TabSection";

export default function Home() {
  const { isFirstTime, isLoading } = useFirstTimeUser();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (isFirstTime && !isLoading) {
      setShowWelcome(true);
    }
  }, [isFirstTime, isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 transition-colors">
      <SideBar />
      {/* Main Content */}
      <div className="ml-52 min-h-screen">
        {/* Header with voting dashboard */}
        <HeaderStatus />

        {/* Voting Categories Section */}
        <div className="xl:mr-80">
          <TabSection />
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
