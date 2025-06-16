import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";

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

    let currentSection = "description";
    const descriptionLines: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("賛成:")) {
        result.pro = trimmedLine.replace("賛成:", "").trim();
        currentSection = "pro";
      } else if (trimmedLine.startsWith("反対:")) {
        result.con = trimmedLine.replace("反対:", "").trim();
        currentSection = "con";
      } else if (
        trimmedLine &&
        !trimmedLine.startsWith("賛成:") &&
        !trimmedLine.startsWith("反対:")
      ) {
        if (currentSection === "description") {
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
      {/* 賛成・反対意見の表示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 賛成意見 */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500 rounded-full shadow-md">
              <ThumbsUp size={24} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">
              賛成意見
            </h3>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-600">
            <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
              {contentData.pro || "賛成意見が記載されていません"}
            </p>
          </div>
        </div>

        {/* 反対意見 */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-200 dark:border-red-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-500 rounded-full shadow-md">
              <ThumbsDown size={24} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-red-700 dark:text-red-300">
              反対意見
            </h3>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-red-200 dark:border-red-600">
            <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
              {contentData.con || "反対意見が記載されていません"}
            </p>
          </div>
        </div>
      </div>

      {/* 詳細説明（任意の内容） */}
      {contentData.description && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-full shadow-md">
              <MessageCircle size={24} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              詳細説明
            </h3>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-blue-200 dark:border-blue-600">
            <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed whitespace-pre-line">
              {contentData.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostContentDisplay;
