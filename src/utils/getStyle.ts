export const getRankStyling = (rank: number) => {
  if (rank === 0) {
    return {
      container:
        "border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-xl",
      leftBorder: "bg-gradient-to-b from-yellow-400 to-amber-500",
      badge: "bg-gradient-to-br from-yellow-400 to-yellow-600",
      crown: true,
    };
  } else if (rank === 1) {
    return {
      container:
        "border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50 shadow-lg",
      leftBorder: "bg-gradient-to-b from-gray-400 to-gray-500",
      badge: "bg-gradient-to-br from-gray-400 to-gray-600",
      crown: false,
    };
  } else if (rank === 2) {
    return {
      container:
        "border-orange-300 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg",
      leftBorder: "bg-gradient-to-b from-orange-400 to-red-500",
      badge: "bg-gradient-to-br from-orange-500 to-red-600",
      crown: false,
    };
  } else {
    return {
      container: "border-gray-200 bg-white shadow-md",
      leftBorder: "bg-gradient-to-b from-blue-400 to-indigo-500",
      badge: "bg-gradient-to-br from-blue-500 to-indigo-600",
      crown: false,
    };
  }
};
