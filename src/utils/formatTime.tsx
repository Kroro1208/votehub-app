// 投票期限をチェックする関数
export const isVotingExpired = (voteDeadline?: string | null) => {
  if (!voteDeadline) return false;
  return new Date() > new Date(voteDeadline);
};

// 残り時間を計算する関数
export const getTimeRemainingObject = (voteDeadline?: string | null) => {
  if (!voteDeadline) return null;

  const deadline = new Date(voteDeadline);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return {
    expired: false,
    days: diffDays,
    hours: diffHours,
    minutes: diffMinutes,
    seconds: diffSeconds,
  };
};

// 残り時間を文字列で返す関数
export const getTimeRemaining = (voteDeadline?: string | null) => {
  const timeObj = getTimeRemainingObject(voteDeadline);

  if (!timeObj || timeObj.expired) return null;

  if (timeObj.days > 0) {
    return `${timeObj.days}日${timeObj.hours}時間`;
  } else if (timeObj.hours > 0) {
    return `${timeObj.hours}時間${timeObj.minutes}分`;
  } else if (timeObj.minutes > 0) {
    return `${timeObj.minutes}分`;
  } else {
    return `${timeObj.seconds}秒`;
  }
};

// 説得タイムかどうかを判定する関数
export const isPersuasionTime = (voteDeadline?: string | null) => {
  if (!voteDeadline) return false;

  const deadline = new Date(voteDeadline);
  const now = new Date();
  const persuasionStart = new Date(deadline.getTime() - 60 * 60 * 1000); // 1時間前

  return now >= persuasionStart && now < deadline;
};
