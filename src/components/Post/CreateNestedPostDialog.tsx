import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog.tsx";
import { MessageSquarePlus } from "lucide-react";
import CreateNestedPost from "./CreateNestedPost.tsx";

type CreateNestedPostDialogProps = {
  data: { title: string; community_id: number | null; nest_level?: number };
  postId: number;
  handleNestedPostCreate: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setShowCreateNested: (show: boolean) => void;
};

const CreateNestedPostDialog = ({
  open,
  onOpenChange,
  setShowCreateNested,
  data,
  postId,
  handleNestedPostCreate,
}: CreateNestedPostDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <MessageSquarePlus className="h-5 w-5" />
            派生投稿を作成
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            元の投稿から派生した新しい質問を作成します
          </DialogDescription>
        </DialogHeader>
        {data && (
          <CreateNestedPost
            parentPost={{
              id: postId,
              title: data.title,
              community_id: data.community_id ?? 0,
              nest_level: data.nest_level || 0,
            }}
            onCancel={() => setShowCreateNested(false)}
            onSuccess={handleNestedPostCreate}
            isDialog
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateNestedPostDialog;
