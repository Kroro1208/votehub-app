import { useState } from "react";
import { Link } from "react-router";
import { CgMenuGridO } from "react-icons/cg";
import { RiCloseLargeFill } from "react-icons/ri";
import { useAuth } from "../hooks/useAuth";
import { VscSignOut } from "react-icons/vsc";
import { FaRegUser } from "react-icons/fa";
import { Button } from "./ui/button";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signInWithGoogle, signOut, user } = useAuth();

  const displayName = user?.user_metadata.user_name || user?.email;

  return (
    <nav className="fixed top-0 w-full z-40 bg-[rgba(10,10,10,0.8)] backdrop-blur-lg border-b border-white/10 shadow-lg">
      {/* Sidebarのスペースを考慮したコンテナ */}
      <div className="ml-64">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 pr-6">
            {/* Desktop Links - 左側に配置 */}
            <div className="hidden md:flex items-center space-x-8 pl-3">
              <Link
                to="/"
                className="text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                Home
              </Link>
              <Link
                to="/create"
                className="text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                Create Post
              </Link>
              <Link
                to="/space"
                className="text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                Space
              </Link>
              <Link
                to="/space/create"
                className="text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                Create Space
              </Link>
            </div>

            {/* 認証セクション - 右端に配置 */}
            <div className="hidden md:flex items-center flex-shrink-0">
              {user ? (
                <div className="flex space-x-4 items-center justify-center min-w-0">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                  >
                    {user ? (
                      <div className="flex-shrink-0">
                        {user.user_metadata.avatar_url && (
                          <img
                            alt="user"
                            src={user.user_metadata.avatar_url}
                            className="rounded-full size-10 object-cover"
                          />
                        )}
                      </div>
                    ) : (
                      <FaRegUser />
                    )}
                    <span className="text-blue-300 truncate">
                      {displayName}
                    </span>
                  </Link>
                  <div className="flex-shrink-0">
                    <Button
                      type="button"
                      onClick={signOut}
                      className="cursor-pointer flex gap-3 items-center justify-center bg-red-500 px-3 py-1 rounded"
                    >
                      <span className="text-gray-300">SignOut</span>
                      <VscSignOut size={25} />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={signInWithGoogle}
                  className="cursor-pointer bg-blue-500 px-3 py-1 rounded"
                >
                  <span className="text-gray-300">SignUp</span>
                </Button>
              )}
            </div>

            {/* モバイルメニューボタン */}
            <div className="md:hidden">
              <Button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="text-gray-300 focus:outline-none p-2"
                aria-label="Toggle menu"
              >
                <div className="relative transform transition-all duration-300 ease-in-out">
                  {menuOpen ? (
                    <RiCloseLargeFill className="text-2xl transition-transform duration-300 ease-in-out" />
                  ) : (
                    <CgMenuGridO className="text-2xl transition-transform duration-300 ease-in-out" />
                  )}
                </div>
              </Button>
            </div>

            {/* モバイル用メニュー - アニメーション付き */}
            <div
              className={`md:hidden fixed left-64 right-0 top-16 bg-[rgba(10,10,10,0.95)] backdrop-blur-md transform transition-all duration-300 ease-in-out overflow-hidden ${
                menuOpen
                  ? "max-h-64 opacity-100 border-b border-white/10 shadow-lg"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-4 py-3 space-y-2">
                <Link
                  to="/"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/create"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  Create Post
                </Link>
                <Link
                  to="/space"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  Space
                </Link>
                <Link
                  to="/community/space"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  Create Space
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
