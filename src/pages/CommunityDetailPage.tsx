import React from "react";

import { useParams } from "react-router";
import CommunityItem from "../components/Community/CommunityItem.tsx";

const CommunityDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="pt-20">
      <CommunityItem communityId={Number(id)} />
    </div>
  );
};

export default CommunityDetailPage;
