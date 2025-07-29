import CreateCommunity from "@/app/components/Community/CreateCommunity";
import SideBar from "@/app/components/SideBar";

const CreateCommunityPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors">
      <SideBar />
      <div className="ml-64 px-4 py-8">
        <CreateCommunity />
      </div>
    </div>
  );
};

export default CreateCommunityPage;
