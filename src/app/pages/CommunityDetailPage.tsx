"use client";
import { useParams } from "next/navigation";
import CommunityItem from "../components/Community/CommunityItem";

const CommunityDetailPage = () => {
  const params = useParams();
  const id = params?.["id"] as string;

  return (
    <div className="pt-20">
      <CommunityItem communityId={Number(id)} />
    </div>
  );
};

export default CommunityDetailPage;
