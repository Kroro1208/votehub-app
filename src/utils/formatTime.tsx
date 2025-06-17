// 投票期限をチェックする関数
export const isVotingExpired = (voteDeadline?: string | null) => {
  if (!voteDeadline) return false;
  return new Date() > new Date(voteDeadline);
};

// 残り時間を計算する関数
export const getTimeRemaining = (voteDeadline?: string | null) => {
  if (!voteDeadline) return null;

  const deadline = new Date(voteDeadline);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) return null;

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );

  if (diffDays > 0) return `${diffDays}日`;
  if (diffHours > 0) return `${diffHours}時間`;
  return "1時間未満";
};

// 説得タイムかどうかを判定する関数
export const isPersuasionTime = (voteDeadline?: string | null) => {
  if (!voteDeadline) return false;

  const deadline = new Date(voteDeadline);
  const now = new Date();
  const persuasionStart = new Date(deadline.getTime() - 24 * 60 * 60 * 1000); // 24時間前

  return now >= persuasionStart && now < deadline;
};
