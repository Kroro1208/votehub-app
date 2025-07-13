import { Route, Routes } from "react-router";
import Home from "./pages/Home.tsx";
import Navbar from "./components/Navbar.tsx";
import CreatePostPage from "./pages/CreatePostPage.tsx";
import PostPage from "./pages/PostPage.tsx";
import CreateCommunityPage from "./pages/CreateCommunityPage.tsx";
import CommunitiesPage from "./pages/CommunitiesPage.tsx";
import CommunityDetailPage from "./pages/CommunityDetailPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import PopularVotesPage from "./pages/PopularVotesPage.tsx";
import VoteResultsPage from "./pages/VoteResultsPage.tsx";
import BookmarksPage from "./pages/BookmarksPage.tsx";
import NotificationsPage from "./pages/NotificationsPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import TagPostsPage from "./pages/TagPostsPage.tsx";
import "./index.css";

function App() {
  return (
    <div className="min-h-screen bg-black dark:bg-dark-bg text-gray-100 dark:text-dark-text transition-all duration-700 pt-20">
      <Navbar />
      <div className="container mx-auto px-4 py6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trending" element={<PopularVotesPage />} />
          <Route path="/results" element={<VoteResultsPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/space/create" element={<CreateCommunityPage />} />
          <Route path="/space" element={<CommunitiesPage />} />
          <Route path="/space/:id" element={<CommunityDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/tags/:tagId/posts" element={<TagPostsPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
