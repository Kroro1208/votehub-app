import { atom } from "jotai";

// コメントIDごとに投票数を管理するatomの型定義
interface CommentVotesMap {
  [commentId: number]: number;
}

// 投票数が最も多いコメントを追跡する型定義
interface MostVotedComment {
  commentId: number | null;
  votes: number;
}

// ポストIDとMostVotedCommentのマッピング
interface MostVotedCommentsMap {
  [postId: number]: MostVotedComment;
}

// コメントIDごとに投票数を管理するatom
export const commentVotesAtomFamily = atom<CommentVotesMap>({});

// ポストごとの最も投票数の多いコメントを管理するatom
export const mostVotedCommentAtomFamily = atom<MostVotedCommentsMap>({});

// 特定のコメントIDの投票データを更新する関数
export const updateCommentVotes = (
  commentId: number,
  postId: number, // どのポストに属するコメントかを追跡
  upVotes: number,
  downVotes: number,
  setter: (update: (prev: CommentVotesMap) => CommentVotesMap) => void,
  mostVotedSetter: (
    update: (prev: MostVotedCommentsMap) => MostVotedCommentsMap
  ) => void
) => {
  const totalVotes = upVotes + downVotes;

  // 投票数を更新
  setter((prev: CommentVotesMap) => ({
    ...prev,
    [commentId]: totalVotes,
  }));

  // 最も投票数の多いコメントを更新
  mostVotedSetter((prev: MostVotedCommentsMap) => {
    const currentMostVoted = prev[postId] || { commentId: null, votes: 0 }; // 初期値は{ null, 0 }

    if (
      totalVotes > currentMostVoted.votes || // このコメントが現在の最多投票コメントより多い場合、または
      (commentId === currentMostVoted.commentId && // このコメントが現在の最多投票コメントと同じで投票数が変わった場合
        totalVotes !== currentMostVoted.votes)
    ) {
      return {
        ...prev,
        [postId]: { commentId, votes: totalVotes },
      };
    }

    // このコメントが現在の最多投票コメントで、投票が0になった場合
    // 別の最多投票コメントを見つける必要がある（この実装ではリセットのみ）
    if (commentId === currentMostVoted.commentId && totalVotes === 0) {
      return {
        ...prev,
        [postId]: { commentId: null, votes: 0 },
      };
    }

    return prev;
  });
};

// 特定のポストの最も投票数の多いコメントIDを取得するatomを生成する関数
export const createMostVotedCommentAtom = (postId: number) => {
  return atom((get) => {
    const mostVotedMap = get(mostVotedCommentAtomFamily);
    return mostVotedMap[postId] || { commentId: null, votes: 0 };
  });
};
