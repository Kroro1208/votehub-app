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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 transition-colors">
      <Sidebar />
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
