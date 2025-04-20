import { useState } from "react";
import { Link } from "react-router";
import { CgMenuGridO } from "react-icons/cg";
import { RiCloseLargeFill } from "react-icons/ri";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="fixed top-0 w-full z-40 bg-[rgba(10,10,10,0.8)] backdrop-blur-lg border-b border-white/10 shadow-lg">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="font-mono text-xl font-bold text-white">
            forum<span className="text-purple-500">.app</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              to="/create"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Create Post
            </Link>
            <Link
              to="/communities"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Communities
            </Link>
            <Link
              to="/community/create"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Create Community
            </Link>
          </div>

          {/* モバイルメニューボタン */}
          <div className="md:hidden">
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
    </nav>
  );
}
