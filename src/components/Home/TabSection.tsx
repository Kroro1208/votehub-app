import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useLanguage } from "../../context/LanguageContext";
import PostList from "../Post/PostList";

const TabSection = () => {
  const { t } = useLanguage();

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-dark-surface">
        <TabsTrigger
          value="all"
          className="data-[state=active]:bg-violet-500 data-[state=active]:text-white dark:text-dark-text"
        >
          {t("home.tabs.all")}
        </TabsTrigger>
        <TabsTrigger
          value="urgent"
          className="data-[state=active]:bg-violet-500 data-[state=active]:text-white dark:text-dark-text"
        >
          {t("home.tabs.urgent")}
        </TabsTrigger>
        <TabsTrigger
          value="popular"
          className="data-[state=active]:bg-violet-500 data-[state=active]:text-white dark:text-dark-text"
        >
          {t("home.tabs.popular")}
        </TabsTrigger>
        <TabsTrigger
          value="recent"
          className="data-[state=active]:bg-violet-500 data-[state=active]:text-white dark:text-dark-text"
        >
          {t("home.tabs.recent")}
        </TabsTrigger>
      </TabsList>

      {/* Vote Grid - Right Panelとの重複を避けるため左に寄せる */}
      <div className="p-6">
        <TabsContent value="all" className="mt-0">
          <PostList />
        </TabsContent>

        <TabsContent value="urgent" className="mt-0">
          <PostList filter="urgent" />
        </TabsContent>

        <TabsContent value="popular" className="mt-0">
          <PostList filter="popular" />
        </TabsContent>

        <TabsContent value="recent" className="mt-0">
          <PostList filter="recent" />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default TabSection;
