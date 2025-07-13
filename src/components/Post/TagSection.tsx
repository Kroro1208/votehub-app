import React from "react";

import { Label } from "../ui/label.tsx";
import { Input } from "../ui/input.tsx";
import { Button } from "../ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select.tsx";
import { Hash, Loader2 } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage.ts";
import { Controller, Control, UseFormSetValue } from "react-hook-form";
import { useAuth } from "../../hooks/useAuth.ts";
import { FormData } from "./ContentSection.tsx";

interface Tag {
  id: number;
  name: string;
  community_id: number;
}

interface TagSectionProps {
  control: Control<FormData>;
  setValue: UseFormSetValue<FormData>;
  watchCommunityId: number | null;
  tagsData: Tag[];
  newTagName: string;
  setNewTagName: (name: string) => void;
  isCreatingTag: boolean;
  relatedTags: Array<{ id: number; name: string; relationScore: number }>;
  isLoadingRelatedTags: boolean;
  similarTags: Array<{ id: number; name: string }>;
  isLoadingSimilarTags: boolean;
  onCreateTag: () => void;
  onSelectSimilarTag: (tag: { id: number; name: string }) => void;
}

const TagSection = ({
  control,
  setValue,
  watchCommunityId,
  tagsData,
  newTagName,
  setNewTagName,
  isCreatingTag,
  relatedTags,
  isLoadingRelatedTags,
  similarTags,
  isLoadingSimilarTags,
  onCreateTag,
  onSelectSimilarTag,
}: TagSectionProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  if (!watchCommunityId || watchCommunityId <= 0) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border">
      <Label
        htmlFor="tag_id"
        className="text-lg font-semibold text-gray-700 dark:text-gray-200"
      >
        {t("create.post.tag.title")}
      </Label>

      {/* 既存タグの選択 */}
      <Controller
        name="tag_id"
        control={control}
        render={({ field }) => (
          <Select
            value={field.value?.toString() || ""}
            onValueChange={(value: string) => {
              field.onChange(value === "none" ? null : parseInt(value));
            }}
          >
            <SelectTrigger className="border-2 border-gray-200 dark:border-gray-600">
              <SelectValue placeholder={t("create.post.tag.select")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("create.post.tag.none")}</SelectItem>
              {tagsData?.map((tag) => (
                <SelectItem key={tag.id} value={tag.id.toString()}>
                  #{tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {/* 新しいタグの作成 */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder={
              user
                ? t("create.post.tag.create.placeholder")
                : t("create.post.tag.create.placeholder.login")
            }
            value={newTagName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = (e.target as HTMLInputElement & { value: string })
                .value;
              setNewTagName(value);
            }}
            className="flex-1"
            maxLength={20}
            disabled={!user}
          />
          <Button
            type="button"
            onClick={onCreateTag}
            disabled={!user || !newTagName.trim() || isCreatingTag}
            variant="outline"
            size="sm"
            className={`${
              user
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isCreatingTag
              ? t("create.post.tag.create.button.creating")
              : t("create.post.tag.create.button")}
          </Button>
        </div>
        {user ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("create.post.tag.example")}
          </p>
        ) : (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t("create.post.tag.login.required")}
          </p>
        )}

        {/* 類似タグの表示 */}
        {similarTags.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-yellow-100 dark:bg-yellow-800 rounded">
                <Hash className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                類似するタグが見つかりました
              </span>
              {isLoadingSimilarTags && (
                <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {similarTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onSelectSimilarTag(tag)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-600 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-800 transition-colors"
                >
                  <span className="text-yellow-700 dark:text-yellow-300">
                    #{tag.name}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
              重複を避けるため、既存のタグをクリックして選択することをお勧めします。
            </p>
          </div>
        )}
      </div>

      {/* 関連タグ推奨 */}
      {relatedTags.length > 0 && (
        <div className="space-y-2 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded">
              <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              おすすめの関連タグ
            </span>
            {isLoadingRelatedTags && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {relatedTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setValue("tag_id", tag.id)}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors group"
              >
                <span className="text-blue-700 dark:text-blue-300">
                  #{tag.name}
                </span>
                <span className="text-blue-500 dark:text-blue-400 text-[10px]">
                  ({Math.round(tag.relationScore * 100)}%)
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            選択中のタグと関連性の高いタグです。クリックして選択できます。
          </p>
        </div>
      )}
    </div>
  );
};

export default TagSection;
