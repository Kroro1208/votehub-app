import { useAtomValue } from "jotai";
import { postsAtom } from "../stores/PostAtom";
import { PostType } from "./Post/PostList";
import { useHandlePost } from "../hooks/useHandlePost";
import { Link } from "react-router";

const RightPanel = () => {
  const posts = useAtomValue(postsAtom);
  const urgentPost = posts
    .filter((post) => {
      if (!post.vote_deadline) return false;
      const deadline = new Date(post.vote_deadline);
      const now = new Date();
      const oneDayBeforeDeadline = new Date(
        deadline.getTime() - 24 * 60 * 60 * 1000,
      );
      return now >= oneDayBeforeDeadline && now < deadline;
    })
    .sort((a, b) => {
      const deadlineA = new Date(a.vote_deadline!).getTime();
      const deadlineB = new Date(b.vote_deadline!).getTime();
      return deadlineA - deadlineB;
    })
    .slice(0, 5); // 最大5件

  const UrgentPostItem = ({ post }: { post: PostType }) => {
    const { getTimeRemaining } = useHandlePost(post);
    const timeRemaining = getTimeRemaining();
    return (
      <Link to={`/post/${post.id}`} className="block group">
        <div className="text-sm">
          <p className="text-slate-800 font-medium">{post.title}</p>
          <p className="text-orange-600 text-xs">残り {timeRemaining}</p>
        </div>
      </Link>
    );
  };

  return (
    <div className="fixed right-6 top-32 w-72 hidden xl:block">
      <div className="bg-yellow-100 rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
        <h3 className="font-semibold text-slate-800 mb-3">
          🔥 トレンドトピック
        </h3>
        {/* TODO */}
        <div className="space-y-3">
          {["環境問題", "テクノロジー", "スポーツ"].map((topic, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">#{topic}</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                {Math.floor(Math.random() * 50 + 10)}票
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-100 rounded-xl shadow-sm border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-800 mb-3">⏰ 終了間近</h3>
        <div className="space-y-3">
          {urgentPost.length > 0 ? (
            urgentPost.map((post) => (
              <UrgentPostItem key={post.id} post={post} />
            ))
          ) : (
            <p className="text-sm text-slate-500">終了間近の投稿はありません</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
