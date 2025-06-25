import CommunityList from "../components/Community/CommunityList";
import Sidebar from "../components/SideBar";
import { Users, Plus } from "lucide-react";
import { Link } from "react-router";

const CommunitiesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <div className="ml-64 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Users size={24} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">
                  スペース一覧
                </h1>
              </div>

              {/* Create Community Button */}
              <Link
                to="/space/create"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                <span className="font-medium">新しいスペース作成</span>
              </Link>
            </div>

            <p className="text-slate-600 max-w-3xl">
              興味のあるトピックで仲間と繋がり、意見を交換し、一緒に投票を楽しみましょう
            </p>
          </div>

          <CommunityList />
        </div>
      </div>
    </div>
  );
};

export default CommunitiesPage;
