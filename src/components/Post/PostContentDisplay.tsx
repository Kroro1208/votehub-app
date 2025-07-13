import React from "react";
import { ThumbsUp, ThumbsDown, Info, User } from "lucide-react";

interface PostContentDisplayProps {
  content: string;
}

interface ParsedContent {
  pro: string;
  con: string;
  description: string;
}

const PostContentDisplay = ({ content }: PostContentDisplayProps) => {
  // コンテンツを解析してフォーマットする関数
  const parseContent = (content: string): ParsedContent => {
    const lines = content.split("\n");
    const result = {
      pro: "",
      con: "",
      description: "",
    };

    const descriptionLines: string[] = [];
    let currentSection = "description";

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("賛成:")) {
        result.pro = trimmedLine.replace("賛成:", "").trim();
        currentSection = "pro";
      } else if (trimmedLine.startsWith("反対:")) {
        result.con = trimmedLine.replace("反対:", "").trim();
        currentSection = "con";
      } else if (trimmedLine) {
        // 空行でない場合は、現在のセクションに関係なくdescriptionに追加
        // ただし、賛成・反対のラベル行は除く
        if (
          currentSection === "description" ||
          (currentSection !== "description" &&
            !trimmedLine.startsWith("賛成:") &&
            !trimmedLine.startsWith("反対:"))
        ) {
          descriptionLines.push(trimmedLine);
        }
      }
    }

    result.description = descriptionLines.join("\n");
    return result;
  };

  const contentData = parseContent(content);

  return (
    <div className="space-y-6">
      {/* 賛成意見 - 左からの吹き出し */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <User size={20} className="text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="relative bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4 w-full">
          {/* 左向きの矢印 */}
          <div className="absolute left-0 top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-green-200 dark:border-r-green-800 -translate-x-2"></div>
          <div className="absolute left-0 top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-green-50 dark:border-r-green-900/10 -translate-x-1"></div>

          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp
              size={16}
              className="text-green-600 dark:text-green-400"
            />
            <span className="text-lg font-semibold text-green-700 dark:text-green-300">
              賛成
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {contentData.pro || "賛成意見が記載されていません"}
          </p>
        </div>
      </div>

      {/* 反対意見 - 右からの吹き出し */}
      <div className="flex items-start gap-3 flex-row-reverse">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <User size={20} className="text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div className="relative bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 w-full">
          {/* 右向きの矢印 */}
          <div className="absolute right-0 top-4 w-0 h-0 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-red-200 dark:border-l-red-800 translate-x-2"></div>
          <div className="absolute right-0 top-4 w-0 h-0 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-red-50 dark:border-l-red-900/10 translate-x-1"></div>

          <div className="flex items-center gap-2 mb-2">
            <ThumbsDown size={16} className="text-red-600 dark:text-red-400" />
            <span className="text-lg font-semibold text-red-700 dark:text-red-300">
              反対
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {contentData.con || "反対意見が記載されていません"}
          </p>
        </div>
      </div>

      {/* 詳細説明（任意の内容） */}
      {contentData.description && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              補足説明
            </h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {contentData.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default PostContentDisplay;
