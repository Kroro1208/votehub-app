import { useQuery } from "@tanstack/react-query";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import type { PostType } from "./PostList";
import { supabase } from "../supabase-client";
import { useNavigate } from "react-router";

interface Props {
  communityId: number;
}

interface CommunityItemType extends PostType {
  communities?: { name: string };
}

const getCommunitityItem = async (
  communityId: number
): Promise<CommunityItemType[]> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*, communities(name)")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as CommunityItemType[];
};

const CommunityItem = ({ communityId }: Props) => {
  const navigate = useNavigate();
  const {
    data: communityItemData,
    isPending,
    error,
  } = useQuery<CommunityItemType[], Error>({
    queryKey: ["communitiyPost", communityId],
    queryFn: () => getCommunitityItem(communityId),
  });

  const handleNavigate = (id: number) => {
    navigate(`/post/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === "Enter" || e.key === "") {
      e.preventDefault();
      navigate(`/post/${id}`);
    }
  };

  if (isPending) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {communityItemData?.[0]?.communities?.name ?? "コミュニティ"}の投稿一覧
      </h2>

      <div className="space-y-6">
        {communityItemData?.map((item) => (
          <div
            onClick={() => handleNavigate(item.id)}
            onKeyDown={(e) => {
              handleKeyDown(e, item.id);
            }}
            key={item.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
          >
            <div className="flex gap-4">
              <img
                src={item.avatar_url}
                alt="ユーザーアバター"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(item.created_at).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mt-4">{item.content}</p>

                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="rounded-lg w-full h-48 object-cover sm:h-64 md:h-72 lg:h-80"
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        {communityItemData?.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">
              このコミュニティにはまだ投稿がありません
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityItem;
