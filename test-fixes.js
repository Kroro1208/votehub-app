import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rvgsxdggkipvjevphjzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3N4ZGdna2lwdmpldnBoanpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMjcwNTEsImV4cCI6MjA2MDcwMzA1MX0.hDd7p6BlwXjomCdxznl1hLYzw3dsbahUWHzde_VnO0c';

const supabase = createClient(supabaseUrl, supabaseKey);

// 修正されたfetchUserVoteForPost関数のテスト
async function testFetchUserVoteForPost(postId, userId) {
  console.log(`\n🧪 投稿ID ${postId} のユーザー投票テスト:`);
  
  if (!userId) {
    console.log('   - ユーザーIDがありません');
    return null;
  }

  const { data, error } = await supabase
    .from("votes")
    .select("vote")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle(); // single() ではなく maybeSingle() を使用

  if (error) {
    console.error("   ❌ 投票データ取得エラー:", error);
    return null;
  }
  
  const result = data ? data.vote : null;
  console.log(`   ✅ 結果: ${result !== null ? `投票値 ${result}` : '投票なし'}`);
  return result;
}

// 修正されたfetchNestedPosts関数のテスト
async function testFetchNestedPosts(parentId) {
  console.log(`\n🧪 投稿ID ${parentId} のネスト投稿テスト:`);
  
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      content,
      created_at,
      image_url,
      avatar_url,
      vote_deadline,
      community_id,
      user_id,
      parent_post_id,
      nest_level,
      target_vote_choice
    `)
    .eq("parent_post_id", parentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("   ❌ ネスト投稿取得エラー:", error);
    return [];
  }

  console.log(`   ✅ 子投稿数: ${data.length}`);
  
  if (data.length > 0) {
    // 各投稿の投票数とコメント数を取得
    const postsWithCounts = await Promise.all(
      data.map(async (post) => {
        // 投票数を取得
        const { data: voteData } = await supabase
          .from("votes")
          .select("id", { count: "exact" })
          .eq("post_id", post.id);

        // コメント数を取得
        const { data: commentData } = await supabase
          .from("comments")
          .select("id", { count: "exact" })
          .eq("post_id", post.id);

        return {
          ...post,
          vote_count: voteData?.length || 0,
          comment_count: commentData?.length || 0,
          nest_level: post.nest_level || 0,
          parent_post_id: post.parent_post_id || null,
          target_vote_choice: post.target_vote_choice || null,
          children: [],
        };
      })
    );

    console.log('   - 子投稿の詳細:');
    postsWithCounts.forEach((post, index) => {
      console.log(`     ${index + 1}. ID:${post.id}, タイトル:"${post.title}", 投票数:${post.vote_count}, コメント数:${post.comment_count}`);
    });
    
    return postsWithCounts;
  }
  
  console.log('   - 子投稿はありません');
  return [];
}

// 主要テスト関数
async function runTests() {
  console.log('🚀 修正されたバグ修正のテスト開始\n');
  
  // テスト1: 投稿61でのユーザー投票確認（投票がない場合のテスト）
  await testFetchUserVoteForPost(61, 'bda9e9ed-3ad5-40f1-8676-df036302aabb');
  
  // テスト2: 投稿42でのユーザー投票確認（投票がある場合のテスト）
  await testFetchUserVoteForPost(42, 'bda9e9ed-3ad5-40f1-8676-df036302aabb');
  
  // テスト3: 存在しない投稿でのテスト
  await testFetchUserVoteForPost(999, 'bda9e9ed-3ad5-40f1-8676-df036302aabb');
  
  // テスト4: ネスト投稿のテスト（いくつかの投稿IDでテスト）
  const testPostIds = [42, 44, 45, 61, 63];
  for (const postId of testPostIds) {
    await testFetchNestedPosts(postId);
  }
  
  console.log('\n✅ 全テスト完了');
}

runTests().catch(console.error);