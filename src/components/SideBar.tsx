import {
  Vote,
  TrendingUp,
  Trophy,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { icon: Vote, label: "投票中", path: "/" },
    { icon: TrendingUp, label: "人気の投票", path: "/trending" },
    { icon: Trophy, label: "結果発表", path: "/results" },
    { icon: BarChart3, label: "統計", path: "/stats" },
    { icon: Users, label: "スペース", path: "/space" },
    { icon: Settings, label: "設定", path: "/settings" },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 p-4 z-50">
      {/* Logo */}
      <div className="mb-8 px-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Vote size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">VoteHub</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 px-1">
          みんなで決める投票プラットフォーム
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-1 mb-8">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-violet-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Create Vote Button */}
      <Link to="/create" className="block mb-8">
        <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center shadow-lg">
          <span>投票を作成</span>
        </Button>
      </Link>

      {/* User Profile */}
      {user && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors duration-200 cursor-pointer">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tl from-violet-500 to-purple-500" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user.user_metadata?.full_name || "User"}
              </p>
              <p className="text-slate-400 text-xs truncate">
                @{user.user_metadata?.user_name || "username"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
