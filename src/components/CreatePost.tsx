import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../supabase-client";

interface PostInput {
  title: string;
  content: string;
}

const createPost = async (post: PostInput) => {
  const { data, error } = await supabase.from("posts").insert(post);
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const CreatePost = () => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");

  const { mutate } = useMutation({
    mutationFn: createPost,
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ title, content });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Post</h2>
      <div>
        <label htmlFor="">title</label>
        <input
          type="text"
          id="title"
          required
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="">content</label>
        <textarea
          id="content"
          required
          rows={5}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <button type="submit">投稿する</button>
    </form>
  );
};

export default CreatePost;
