import React from "react";

interface BarProps {
  totalVotes: number;
  upVotes: number;
  downVotes: number;
  upVotePercentage: number;
  downVotePercentage: number;
}

const VoteGageBar = ({
  totalVotes,
  upVotes,
  downVotes,
  upVotePercentage,
  downVotePercentage,
}: BarProps) => {
  return (
    <div className="mt-4 w-full">
      <div className="text-sm mb-3">
        投票結果: {totalVotes}票 (賛成: {upVotes}票 / 反対: {downVotes}票)
      </div>

      {/* グラフコンテナ */}
      <div className="w-full h-8 bg-gray-200 rounded-md overflow-hidden flex">
        {/* 賛成バー */}
        <div
          className="h-full bg-green-500 flex items-center justify-center text-white text-xs font-bold"
          style={{ width: `${upVotePercentage}%` }}
        >
          {upVotePercentage > 10 ? `${Math.round(upVotePercentage)}%` : ""}
        </div>

        {/* 反対バー */}
        <div
          className="h-full bg-red-500 flex items-center justify-center text-white text-xs font-bold"
          style={{ width: `${downVotePercentage}%` }}
        >
          {downVotePercentage > 10 ? `${Math.round(downVotePercentage)}%` : ""}
        </div>
      </div>

      {/* パーセント表示 */}
      <div className="flex justify-between text-sm text-gray-600 mt-3">
        <div>賛成: {Math.round(upVotePercentage)}%</div>
        <div>反対: {Math.round(downVotePercentage)}%</div>
      </div>
    </div>
  );
};

export default VoteGageBar;
