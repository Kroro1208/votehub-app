import CreateCommunity from "../components/Community/CreateCommunity";
import Sidebar from "../components/SideBar";

const CreateCommunityPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <div className="ml-64 px-4 py-8">
        <CreateCommunity />
      </div>
    </div>
  );
};

export default CreateCommunityPage;
