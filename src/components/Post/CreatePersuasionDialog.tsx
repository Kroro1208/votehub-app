import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog.tsx";
import { Textarea } from "../ui/textarea.tsx";
import { Button } from "../ui/button.tsx";
import { MessageCircle } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { CommentType } from "./PostDetail.tsx";
import React from "react";

type PersuationDialogProps = {
  open: boolean;
  showPersuasionModal: boolean;
  onOpenChange: (open: boolean) => void;
  persuasionContent: string;
  setPersuasionContent: (content: string) => void;
  persuasionCommentMutation: UseMutationResult<
    CommentType,
    Error,
    {
      content: string;
    },
    unknown
  >;
  handlePersuasionSubmit: () => void;
  handleCloseModal: () => void;
};

const CreatePersuasionDialog = ({
  open,
  onOpenChange,
  persuasionContent,
  setPersuasionContent,
  persuasionCommentMutation,
  handleCloseModal,
  handlePersuasionSubmit,
}: PersuationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            説得コメント
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            投票期限まで残り僅かです。投票者への最後のメッセージを送信してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={persuasionContent}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setPersuasionContent((e.target as HTMLTextAreaElement).value)
            }
            placeholder="投票者に向けたメッセージを入力してください..."
            className="min-h-[120px] max-w-[400px] resize-none text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            maxLength={500}
          />
          <div className="text-right text-xs text-gray-500 dark:text-gray-400">
            {persuasionContent.length}/500
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCloseModal}
            disabled={persuasionCommentMutation.isPending}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            キャンセル
          </Button>
          <Button
            onClick={handlePersuasionSubmit}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={
              persuasionCommentMutation.isPending || !persuasionContent.trim()
            }
          >
            {persuasionCommentMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                投稿中...
              </>
            ) : (
              <>
                <MessageCircle size={16} className="mr-2" />
                投稿する
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePersuasionDialog;
