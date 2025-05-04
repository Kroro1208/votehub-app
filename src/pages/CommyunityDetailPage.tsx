import CommunityItem from "../components/CommunityItem";

const CommyunityDetailPage = () => {
  return (
    <div className="pt-20">
      <h2 className="text-6xl font-bold mb-6 text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        コミュニティの詳細
      </h2>
      <CommunityItem />
    </div>
  );
};

export default CommyunityDetailPage;
