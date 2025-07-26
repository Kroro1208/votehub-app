interface VoteTicketsProps {
  upVotes: number;
  downVotes: number;
  totalVotes?: number;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

const VoteTickets: React.FC<VoteTicketsProps> = ({
  upVotes,
  downVotes,
  totalVotes,
  size = "md",
  showLabels = true,
}) => {
  const sizeClasses = {
    sm: {
      ticket: "px-2 py-1 text-xs",
      icon: 12,
      text: "text-xs",
      gap: "gap-1",
    },
    md: {
      ticket: "px-3 py-2 text-sm",
      icon: 16,
      text: "text-sm",
      gap: "gap-2",
    },
    lg: {
      ticket: "px-4 py-3 text-base",
      icon: 20,
      text: "text-base",
      gap: "gap-3",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={`flex items-center justify-between w-full max-w-xs ${currentSize.gap}`}
    >
      {/* 賛成票 */}
      <div className="relative flex-1 flex justify-center">
        <div
          className={`
            ${currentSize.ticket}
            bg-gradient-to-r from-green-500 to-emerald-600 
            text-white font-semibold
            rounded-lg shadow-md
            flex items-center justify-center
            transform transition-all duration-200 hover:scale-105
            border border-green-400
            relative min-w-[3rem]
          `}
          style={{
            clipPath: "polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)",
          }}
        >
          <span>{upVotes}</span>
        </div>
        {showLabels && (
          <div
            className={`absolute -bottom-5 left-1/2 transform -translate-x-1/2 ${currentSize.text} text-gray-600 whitespace-nowrap`}
          >
            賛成
          </div>
        )}
      </div>

      {/* 総投票数 */}
      {totalVotes !== undefined && (
        <div className="text-center px-2">
          <div className="text-2xl font-black text-gray-800 dark:text-white">
            {totalVotes}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wide">
            {totalVotes === 0
              ? "まだ投票がありません！"
              : totalVotes === 1
                ? "人が投票"
                : "人が投票"}
          </div>
        </div>
      )}

      {/* 反対票 */}
      <div className="relative flex-1 flex justify-center">
        <div
          className={`
            ${currentSize.ticket}
            bg-gradient-to-r from-red-500 to-rose-600 
            text-white font-semibold
            rounded-lg shadow-md
            flex items-center justify-center
            transform transition-all duration-200 hover:scale-105
            border border-red-400
            relative min-w-[3rem]
          `}
          style={{
            clipPath: "polygon(10% 0%, 100% 0%, 100% 100%, 10% 100%, 0% 50%)",
          }}
        >
          <span>{downVotes}</span>
        </div>
        {showLabels && (
          <div
            className={`absolute -bottom-5 left-1/2 transform -translate-x-1/2 ${currentSize.text} text-gray-600 whitespace-nowrap`}
          >
            反対
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteTickets;
