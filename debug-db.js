import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rvgsxdggkipvjevphjzb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3N4ZGdna2lwdmpldnBoanpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMjcwNTEsImV4cCI6MjA2MDcwMzA1MX0.hDd7p6BlwXjomCdxznl1hLYzw3dsbahUWHzde_VnO0c";

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDatabase() {
  console.log("🔍 データベース構造を調査中...\n");

  // 1. votesテーブルの存在確認
  console.log("1. votesテーブルの構造確認:");
  try {
    const { data, error } = await supabase.from("votes").select("*").limit(1);

    if (error) {
      console.log("❌ votesテーブルエラー:", error.message);
      console.log("   - エラーコード:", error.code);
      console.log("   - エラー詳細:", error.details);
    } else {
      console.log("✅ votesテーブル: 存在確認済み");
      console.log("   - データ例:", data);
    }
  } catch (err) {
    console.log("❌ votesテーブル接続エラー:", err.message);
  }

  console.log("\n2. postsテーブルの構造確認:");
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, parent_post_id, nest_level, target_vote_choice")
      .limit(3);

    if (error) {
      console.log("❌ postsテーブルエラー:", error.message);
    } else {
      console.log("✅ postsテーブル: 存在確認済み");
      console.log("   - 投稿数:", data.length);
      console.log("   - データ例:", data);
    }
  } catch (err) {
    console.log("❌ postsテーブル接続エラー:", err.message);
  }

  console.log("\n3. get_posts_with_counts関数の動作確認:");
  try {
    const { data, error } = await supabase.rpc("get_posts_with_counts");

    if (error) {
      console.log("❌ get_posts_with_counts関数エラー:", error.message);
      console.log("   - エラーコード:", error.code);
    } else {
      console.log("✅ get_posts_with_counts関数: 正常動作");
      console.log("   - 取得件数:", data.length);
      if (data.length > 0) {
        console.log(
          "   - データ例 (完全版):",
          JSON.stringify(data[0], null, 2),
        );

        // 各フィールドが正しく含まれているかチェック
        const sampleData = data[0];
        const requiredFields = [
          "id",
          "title",
          "content",
          "created_at",
          "image_url",
          "avatar_url",
          "vote_count",
          "comment_count",
          "vote_deadline",
          "community_id",
          "user_id",
          "parent_post_id",
          "nest_level",
          "target_vote_choice",
        ];

        console.log("   - フィールドチェック:");
        requiredFields.forEach((field) => {
          const exists = field in sampleData;
          const value = sampleData[field];
          console.log(
            `     ${exists ? "✅" : "❌"} ${field}: ${exists ? (value !== null ? value : "null") : "missing"}`,
          );
        });
      }
    }
  } catch (err) {
    console.log("❌ get_posts_with_counts関数接続エラー:", err.message);
  }

  console.log("\n4. 特定の投稿の投票情報確認:");
  try {
    // 投稿ID 61の投票データを確認
    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("post_id", 61);

    if (error) {
      console.log("❌ 投稿61の投票データエラー:", error.message);
    } else {
      console.log("✅ 投稿61の投票データ:");
      console.log("   - 投票数:", data.length);
      console.log("   - データ:", data);
    }
  } catch (err) {
    console.log("❌ 投票データ取得エラー:", err.message);
  }

  console.log("\n5. 関数の更新とテスト:");
  try {
    // 関数を更新
    const updateFunction = `
      CREATE OR REPLACE FUNCTION get_posts_with_counts()
      RETURNS TABLE (
          id int8,
          title text,
          content text,
          created_at timestamptz,
          image_url text,
          avatar_url text,
          vote_deadline timestamptz,
          community_id int8,
          user_id text,
          parent_post_id int8,
          nest_level integer,
          target_vote_choice integer,
          vote_count int8,
          comment_count int8
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              p.id,
              p.title,
              p.content,
              p.created_at,
              p.image_url,
              p.avatar_url,
              p.vote_deadline,
              p.community_id,
              p.user_id,
              p.parent_post_id,
              COALESCE(p.nest_level, 0) as nest_level,
              p.target_vote_choice,
              COALESCE(v.vote_count, 0) as vote_count,
              COALESCE(c.comment_count, 0) as comment_count
          FROM posts p
          LEFT JOIN (
              SELECT post_id, COUNT(*) as vote_count
              FROM votes
              GROUP BY post_id
          ) v ON p.id = v.post_id
          LEFT JOIN (
              SELECT post_id, COUNT(*) as comment_count
              FROM comments
              GROUP BY post_id
          ) c ON p.id = c.post_id
          ORDER BY p.created_at DESC;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: funcError } = await supabase.rpc("exec", {
      sql: updateFunction,
    });

    if (funcError) {
      console.log("❌ 関数更新エラー:", funcError.message);

      // 別の方法で関数を更新
      console.log(
        "⚠️  SQL実行権限がない可能性があります。代替案を確認します。",
      );
    } else {
      console.log("✅ 関数が正常に更新されました");
    }
  } catch (err) {
    console.log("❌ 関数更新エラー:", err.message);
  }

  console.log("\n6. 投稿61の詳細情報:");
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", 61)
      .single();

    if (error) {
      console.log("❌ 投稿61が見つかりません:", error.message);
      console.log("   - 投稿61は存在しない可能性があります");
    } else {
      console.log("✅ 投稿61の詳細:", data);
    }
  } catch (err) {
    console.log("❌ 投稿61取得エラー:", err.message);
  }
}

debugDatabase();
