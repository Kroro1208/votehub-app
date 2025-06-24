import { Route, Routes } from "react-router";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import CreatePostPage from "./pages/CreatePostPage";
import PostPage from "./pages/PostPage";
import CreateCommunityPage from "./pages/CreateCommunityPage";
import CommunitiesPage from "./pages/CommunitiesPage";
import CommyunityDetailPage from "./pages/CommyunityDetailPage";
import ProfilePage from "./pages/ProfilePage";
import PopularVotesPage from "./pages/PopularVotesPage";
import VoteResultsPage from "./pages/VoteResultsPage";

function App() {
  return (
    <div className="min-h-screen bg-black text-gray-100 transition-opacity duration-700 pt-20">
      <Navbar />
      <div className="container mx-auto px-4 py6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trending" element={<PopularVotesPage />} />
          <Route path="/results" element={<VoteResultsPage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/space/create" element={<CreateCommunityPage />} />
          <Route path="/space" element={<CommunitiesPage />} />
          <Route path="/space/:id" element={<CommyunityDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
