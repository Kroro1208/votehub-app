import React from "react";

interface VoteTicketsProps {
  upVotes: number;
  downVotes: number;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

const VoteTickets: React.FC<VoteTicketsProps> = ({
  upVotes,
  downVotes,
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
    <div className={`flex items-center ${currentSize.gap}`}>
      {/* 賛成票 */}
      <div className="relative">
        <div
          className={`
            ${currentSize.ticket}
            bg-gradient-to-r from-green-500 to-emerald-600 
            text-white font-semibold
            rounded-lg shadow-md
            flex items-center space-x-1
            transform transition-all duration-200 hover:scale-105
            border border-green-400
            relative
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

      {/* 反対票 */}
      <div className="relative">
        <div
          className={`
            ${currentSize.ticket}
            bg-gradient-to-r from-red-500 to-rose-600 
            text-white font-semibold
            rounded-lg shadow-md
            flex items-center space-x-1
            transform transition-all duration-200 hover:scale-105
            border border-red-400
            relative
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
