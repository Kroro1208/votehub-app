import { useParams } from "react-router";
import CommunityItem from "../components/Community/CommunityItem";

const CommyunityDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="pt-20">
      <h2 className="text-6xl font-bold mb-6 text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        コミュニティの詳細
      </h2>
      <CommunityItem communityId={Number(id)} />
    </div>
  );
};

export default CommyunityDetailPage;
