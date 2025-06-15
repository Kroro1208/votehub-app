import CommunityList from "../components/CommunityList";
import Sidebar from "../components/SideBar";
import { SiMyspace } from "react-icons/si";

const CommunitiesPage = () => {
  return (
    <div className="ml-64 min-h-screen bg-gradient-to-br from-slate-400 to-gray-200">
      <Sidebar />
      <div className="px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダーセクション */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl mb-6 shadow-xl">
              <SiMyspace size={50} />
            </div>
            <h1 className="text-3xl text-black font-bold mb-4 bg-gradient-to-r bg-clip-text">
              スペース一覧
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
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
