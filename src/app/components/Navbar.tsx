"use client";
import Link from "next/link";
import { useState } from "react";
import { CgMenuGridO } from "react-icons/cg";
import { RiCloseLargeFill } from "react-icons/ri";

import { FaRegUser } from "react-icons/fa";
import { VscSignOut } from "react-icons/vsc";

import { Coins } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useUserPoints } from "../hooks/useUserPoints";
import { routeProtection } from "../../config/RouteProtection";
import NotificationDropdown from "./Notification/NotificationDropdown";
import { Button } from "./ui/button";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const { points, isLoading: pointsLoading } = useUserPoints();
  const routes = routeProtection.getRoutes();

  const displayName = user?.user_metadata?.["user_name"] || user?.email;

  return (
    <nav className="fixed top-0 w-full z-40 bg-[rgba(10,10,10,0.8)] backdrop-blur-lg border-b border-white/10 shadow-lg">
      {/* Sidebarのスペースを考慮したコンテナ */}
      <div className="ml-64">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 pr-6">
            {/* Desktop Links - 左側に配置 */}
            <div className="hidden md:flex items-center space-x-8 pl-3">
              <Link
                href={routes.HOME}
                className="text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                {t("nav.home")}
              </Link>
              <Link
                href={routes.POST_CREATE}
                className="text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                {t("nav.create")}
              </Link>
              <Link
                href={routes.SPACE}
                className="text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                {t("nav.space")}
              </Link>
              <Link
                href={routes.SPACE_CREATE}
                className="text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                {t("space.create")}
              </Link>
              <Link
                href={routes.USER_RANKING}
                className="text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                {t("ranking.title")}
              </Link>
            </div>

            {/* 認証セクション - 右端に配置 */}
            <div className="hidden md:flex items-center flex-shrink-0">
              {user ? (
                <div className="flex space-x-4 items-center justify-center min-w-0">
                  {/* 通知ドロップダウン */}
                  <NotificationDropdown />

                  {/* ユーザーポイント表示 */}
                  <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                    <Coins size={16} className="text-white" />
                    <span className="text-sm font-semibold text-white">
                      {pointsLoading ? "..." : points.toFixed(1)}
                    </span>
                  </div>
                  <Link
                    href={user ? routes.profile(user.id) : routes.HOME}
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                  >
                    {user ? (
                      <div className="flex-shrink-0">
                        {user.user_metadata?.["avatar_url"] && (
                          <img
                            alt="user"
                            src={user.user_metadata["avatar_url"]}
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
                      <span className="text-gray-300">
                        {t("auth.sign.out")}
                      </span>
                      <VscSignOut size={25} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href={`${routes.AUTH_LOGIN}?mode=login`}>
                    <Button
                      type="button"
                      className="cursor-pointer bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
                    >
                      <span className="text-gray-300">{t("auth.login")}</span>
                    </Button>
                  </Link>
                  <Link href={`${routes.AUTH_LOGIN}?mode=signup`}>
                    <Button
                      type="button"
                      className="cursor-pointer bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-sm"
                    >
                      <span className="text-gray-300">{t("auth.sign.up")}</span>
                    </Button>
                  </Link>
                </div>
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
                  href={routes.HOME}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  {t("nav.home")}
                </Link>
                <Link
                  href={routes.CREATE}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  {t("nav.create")}
                </Link>
                <Link
                  href={routes.SPACE}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  {t("nav.space")}
                </Link>
                <Link
                  href={routes.SPACE_CREATE}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  {t("space.create")}
                </Link>
                <Link
                  href={routes.USER_RANKING}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  {t("ranking.title")}
                </Link>

                {/* モバイル用認証ボタン */}
                {user ? (
                  <button
                    onClick={signOut}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  >
                    {t("auth.sign.out")}
                  </button>
                ) : (
                  <div className="space-y-2 mt-4 pt-4 border-t border-gray-600">
                    <Link
                      href={`${routes.AUTH_LOGIN}?mode=login`}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                      {t("auth.login")}
                    </Link>
                    <Link
                      href={`${routes.AUTH_LOGIN}?mode=signup`}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                      {t("auth.sign.up")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
