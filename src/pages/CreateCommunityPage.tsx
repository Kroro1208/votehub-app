import CreateCommunity from "../components/Community/CreateCommunity.tsx";
import Sidebar from "../components/SideBar.tsx";

const CreateCommunityPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors">
      <Sidebar />
      <div className="ml-64 px-4 py-8">
        <CreateCommunity />
      </div>
    </div>
  );
};

export default CreateCommunityPage;
