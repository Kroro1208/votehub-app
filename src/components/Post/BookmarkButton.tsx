import { useBookmarks } from "../../hooks/useBookmarks.ts";
import { useAuth } from "../../hooks/useAuth.ts";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "../ui/button.tsx";

interface BookmarkButtonProps {
  postId: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const BookmarkButton = ({
  postId,
  size = "md",
  className = "",
}: BookmarkButtonProps) => {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark, isToggling } = useBookmarks();

  if (!user) return null;

  const bookmarked = isBookmarked(postId);

  const iconSizes = {
    sm: 18,
    md: 20,
    lg: 30,
  };

  return (
    <Button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBookmark(postId);
      }}
      disabled={isToggling}
      className={`p-2 rounded-full transition-colors ${
        bookmarked
          ? "bg-yellow-500 text-white hover:bg-yellow-600"
          : "text-gray-400 hover:text-yellow-500"
      } ${className}`}
    >
      {bookmarked ? (
        <BookmarkCheck size={iconSizes[size]} />
      ) : (
        <Bookmark size={iconSizes[size]} />
      )}
    </Button>
  );
};

export default BookmarkButton;
