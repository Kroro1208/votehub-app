-- 手動テスト用SQLスクリプト
-- 実際のユーザーIDに置き換えて実行してください

-- 1. まず認証状態を確認
SELECT auth.uid() as current_user_id;

-- 2. もしauth.uid()がnullの場合、実際のユーザーIDを手動で設定
-- ブラウザの開発者コンソールで以下を実行してユーザーIDを取得：
-- console.log(supabase.auth.getUser())

-- 3. 実際のユーザーIDを使ってテスト（ここを置き換えてください）
-- 例: SELECT * FROM check_user_post_limit('12345678-1234-1234-1234-123456789abc');

-- 4. 手動で会員データを作成（実際のユーザーIDに置き換え）
-- INSERT INTO user_memberships (user_id, membership_type, daily_post_limit)
-- VALUES ('your-actual-user-id-here', 'free', 2);

-- 5. 手動で今日の投稿数をリセット
-- DELETE FROM daily_post_counts 
-- WHERE user_id = 'your-actual-user-id-here' 
-- AND post_date = CURRENT_DATE;

-- 6. 手動でポイントを設定
-- INSERT INTO user_points (user_id, points)
-- VALUES ('your-actual-user-id-here', 100)
-- ON CONFLICT (user_id) 
-- DO UPDATE SET points = 100;