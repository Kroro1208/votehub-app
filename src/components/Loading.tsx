import React from "react";

const Loading = () => {
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-spin" />
        <p className="mt-4 text-gray-600 font-medium">読み込み中...</p>
      </div>
    </div>
  );
};

export default Loading;
