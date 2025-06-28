import { MessageSquarePlus } from "lucide-react";
import { Button } from "../ui/button";
import { PostType } from "./PostList";
import { User } from "@supabase/supabase-js";
import NestedPostSummary from "./NestedPostSummary";

type NestedPostSectionProps = {
  data: PostType;
  user: User | null;
  showCreateNested: boolean;
  setShowCreateNested: (show: boolean) => void;
  nestedPosts: PostType[] | undefined;
  isPostOwner: boolean;
  userVoteChoice: number | null | undefined;
};

const NestedPostSection = ({
  data,
  user,
  showCreateNested,
  setShowCreateNested,
  nestedPosts,
  isPostOwner,
  userVoteChoice,
}: NestedPostSectionProps) => {
  return (
    <div>
      {data && (data.nest_level || 0) < 3 && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          {/* 派生質問作成ボタン */}
          {user &&
            isPostOwner &&
            (data.nest_level || 0) < 3 &&
            !showCreateNested && (
              <div className="mb-6">
                <Button
                  onClick={() => setShowCreateNested(true)}
                  className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white"
                >
                  <MessageSquarePlus size={18} />
                  派生質問を作成
                </Button>
              </div>
            )}

          {/* 派生質問の表示（タイトルと概要のみ） */}
          {nestedPosts && nestedPosts.length > 0 ? (
            <div className="space-y-3 p-5">
              <h3 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
                <MessageSquarePlus size={20} className="text-violet-600" />
                派生質問
              </h3>
              {nestedPosts
                .filter((nestedPost) => {
                  // 投稿者の場合は投票の有無に関わらず全ての派生質問を表示
                  if (isPostOwner) return true;

                  // ユーザーが投票していない場合は対象外の質問は表示しない
                  if (userVoteChoice === null) return false;

                  // ユーザーの投票とターゲット投票選択が一致する場合のみ表示
                  return nestedPost.target_vote_choice === userVoteChoice;
                })
                .map((nestedPost) => (
                  <NestedPostSummary
                    key={nestedPost.id}
                    post={nestedPost}
                    level={1}
                    userVoteChoice={userVoteChoice}
                    isPostOwner={isPostOwner}
                  />
                ))}

              {/* 投票していないユーザー向けのメッセージ（投稿者は除外） */}
              {!isPostOwner &&
                userVoteChoice === null &&
                nestedPosts.some((p) => p.target_vote_choice !== null) && (
                  <div className="text-center py-6 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-700 font-bold">
                      投票者限定の派生質問があります
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                      この投票に参加された方はチェックしてください✅
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <p>まだ派生質問はありません</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NestedPostSection;
