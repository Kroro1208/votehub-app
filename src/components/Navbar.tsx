import { useState } from "react";
import { Link } from "react-router";
import { CgMenuGridO } from "react-icons/cg";
import { RiCloseLargeFill } from "react-icons/ri";
import { useAuth } from "../hooks/useAuth";
import { VscSignOut } from "react-icons/vsc";
import { FaRegUser } from "react-icons/fa";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signInWithGoogle, signOut, user } = useAuth();

  const displayName = user?.user_metadata.user_name || user?.email;

  return (
    <nav className="fixed top-0 w-full z-40 bg-[rgba(10,10,10,0.8)] backdrop-blur-lg border-b border-white/10 shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center h-16">
          {/* ロゴ */}
          <div className="flex-shrink-0">
            <Link to="/" className="font-mono text-xl font-bold text-white">
              Vote Post<span className="text-green-500">.app</span>
            </Link>
          </div>

          {/* 中央部分にスペースを作成 */}
          <div className="flex-grow" />

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-6">
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
              to="/communities"
              className="text-gray-300 hover:text-white transition-colors whitespace-nowrap"
            >
              Communities
            </Link>
            <Link
              to="/community/create"
              className="text-gray-300 hover:text-white transition-colors whitespace-nowrap"
            >
              Create Community
            </Link>
          </div>

          {/* 中央と右側の間にスペース */}
          <div className="hidden md:block w-8" />

          {/* 認証セクション */}
          <div className="hidden md:flex items-center">
            {user ? (
              <div className="flex space-x-4 items-center justify-center">
                {user ? (
                  <div>
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
                <span className="text-blue-300">{displayName}</span>
                <div className="">
                  <button
                    type="button"
                    onClick={signOut}
                    className="cursor-pointer flex gap-3 items-center justify-center bg-red-500 px-3 py-1 rounded"
                  >
                    <span className="text-gray-300">SignOut</span>
                    <VscSignOut size={25} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="cursor-pointer"
              >
                SignUp
              </button>
            )}
          </div>

          {/* モバイルメニューボタン */}
          <div className="ml-auto md:hidden">
            <button
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
            </button>
          </div>

          {/* モバイル用メニュー - アニメーション付き */}
          <div
            className={`md:hidden fixed left-0 right-0 top-16 bg-[rgba(10,10,10,0.95)] backdrop-blur-md transform transition-all duration-300 ease-in-out overflow-hidden ${
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
                to="/communities"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                Communities
              </Link>
              <Link
                to="/community/create"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                Create Community
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
