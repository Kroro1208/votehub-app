-- 🔧 comment_votes テーブル リアルタイム機能有効化
-- コメントリアクションのリアルタイム更新を有効化するためのスクリプト

-- 1. comment_votes テーブルでリアルタイム機能を有効化
ALTER TABLE comment_votes REPLICA IDENTITY FULL;

-- 2. リアルタイムパブリケーション（subscription）を有効化
-- Supabase では supabase_realtime パブリケーションがデフォルトで存在
ALTER PUBLICATION supabase_realtime ADD TABLE comment_votes;

-- 3. 必要に応じて、関連するテーブルもリアルタイムに追加
-- votes テーブルも一緒に有効化
ALTER TABLE votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- 4. comments テーブルもリアルタイムに追加（既に追加済みの場合はエラーが出るが問題なし）
ALTER TABLE comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- ✅ リアルタイム機能有効化完了
-- このスクリプトを実行後、コメントリアクションがリアルタイムで更新されます