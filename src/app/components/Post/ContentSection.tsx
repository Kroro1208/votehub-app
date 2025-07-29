"use client";

import { createPostSchema } from "@/utils/schema";
import { MessageSquare } from "lucide-react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { z } from "zod";
import { useLanguage } from "../../hooks/useLanguage";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

type CreatePostFormData = z.infer<typeof createPostSchema>;

interface ContentSectionProps {
  control: Control<CreatePostFormData>;
  watch: UseFormWatch<CreatePostFormData>;
  setValue: UseFormSetValue<CreatePostFormData>;
  errors: FieldErrors<CreatePostFormData>;
  watchedContent: string;
}

const ContentSection = ({
  control,
  watch,
  setValue,
  errors,
  watchedContent,
}: ContentSectionProps) => {
  const { t } = useLanguage();

  return (
    <div className="group">
      <Label
        htmlFor="content"
        className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3"
      >
        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
          <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        {t("create.post.content.title")}
      </Label>
      <div className="relative border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus-within:border-green-500 dark:focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-200 dark:focus-within:ring-green-800 transition-all duration-300">
        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <Label className="text-sm font-semibold text-green-700 dark:text-green-300">
                {t("create.post.content.pro")}
              </Label>
            </div>
            <Input
              placeholder={t("create.post.content.pro.placeholder")}
              className="text-sm border-green-200 dark:border-green-700 focus:border-green-400 dark:focus:border-green-500"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = (e.target as HTMLInputElement & { value: string })
                  .value;
                const currentContent = watch("content") || "";
                const lines = currentContent.split("\n");
                const proPrefix = t("create.post.content.pro.prefix");
                const proIndex = lines.findIndex((line: string) =>
                  line.startsWith(proPrefix),
                );
                if (proIndex !== -1) {
                  lines[proIndex] = `${proPrefix} ${value}`;
                } else {
                  lines.unshift(`${proPrefix} ${value}`);
                }
                setValue("content", lines.join("\n"));
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <Label className="text-sm font-semibold text-red-700 dark:text-red-300">
                {t("create.post.content.con")}
              </Label>
            </div>
            <Input
              placeholder={t("create.post.content.con.placeholder")}
              className="text-sm border-red-200 dark:border-red-700 focus:border-red-400 dark:focus:border-red-500"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = (e.target as HTMLInputElement & { value: string })
                  .value;
                const currentContent = watch("content") || "";
                const lines = currentContent.split("\n");
                const conPrefix = t("create.post.content.con.prefix");
                const proPrefix = t("create.post.content.pro.prefix");
                const conIndex = lines.findIndex((line: string) =>
                  line.startsWith(conPrefix),
                );
                if (conIndex !== -1) {
                  lines[conIndex] = `${conPrefix} ${value}`;
                } else {
                  const proIndex = lines.findIndex((line: string) =>
                    line.startsWith(proPrefix),
                  );
                  if (proIndex !== -1) {
                    lines.splice(proIndex + 1, 0, `${conPrefix} ${value}`);
                  } else {
                    lines.push(`${conPrefix} ${value}`);
                  }
                }
                setValue("content", lines.join("\n"));
              }}
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              {t("create.post.content.detail")}
            </Label>
            <Textarea
              rows={4}
              placeholder={t("create.post.content.detail.placeholder")}
              className="text-sm resize-none border-gray-200 dark:border-gray-600"
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const value = (
                  e.target as HTMLTextAreaElement & { value: string }
                ).value;
                const currentContent = watch("content") || "";
                const lines = currentContent.split("\n");
                // 賛成・反対以外の行を削除
                const proPrefix = t("create.post.content.pro.prefix");
                const conPrefix = t("create.post.content.con.prefix");
                const filteredLines = lines.filter(
                  (line: string) =>
                    line.startsWith(proPrefix) || line.startsWith(conPrefix),
                );
                if (value.trim()) {
                  filteredLines.push("", value);
                }
                setValue("content", filteredLines.join("\n"));
              }}
            />
          </div>
        </div>
        {/* Hidden textarea for form submission */}
        <Controller
          name="content"
          control={control}
          render={({ field }) => <input type="hidden" {...field} />}
        />
      </div>
      <div className="flex justify-between items-center mt-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {t("create.post.content.note")}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-600 px-3 py-1 rounded-full">
          {watchedContent.length} {t("create.post.content.characters")}
        </span>
      </div>
      {errors.content && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {errors.content.message}
        </p>
      )}
    </div>
  );
};

export default ContentSection;
