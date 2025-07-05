-- 投稿制限状況確認・リセット用SQLスクリプト
-- Supabase SQL Editorで実行してください

-- テスト用のユーザーID（認証されていない場合）
DO $$
DECLARE
    test_user_id TEXT := 'test-user-123';
    current_user_id UUID;
BEGIN
    -- 認証されているかチェック
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'ユーザーが認証されていません。テスト用ユーザーID: %を使用します', test_user_id;
        -- テスト用ユーザーの会員情報を作成
        INSERT INTO user_memberships (user_id, membership_type, daily_post_limit)
        VALUES (test_user_id, 'free', 2)
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'ポイントテーブルはauth.usersが必要なためスキップします';
    ELSE
        RAISE NOTICE '認証済みユーザーID: %', current_user_id;
        
        -- 認証済みユーザーのポイントを確認・作成
        INSERT INTO user_points (user_id, total_points)
        VALUES (current_user_id, 100)
        ON CONFLICT (user_id) DO UPDATE SET total_points = 100;
    END IF;
END $$;

-- 1. 現在のユーザーIDを取得
SELECT COALESCE(auth.uid()::text, 'test-user-123') as current_user_id;

-- 2. 現在の投稿制限状況を確認
SELECT * FROM check_user_post_limit(COALESCE(auth.uid()::text, 'test-user-123'));

-- 3. 現在の会員情報を確認
SELECT * FROM user_memberships WHERE user_id = COALESCE(auth.uid()::text, 'test-user-123');

-- 4. 今日の投稿数を確認
SELECT * FROM daily_post_counts 
WHERE user_id = COALESCE(auth.uid()::text, 'test-user-123')
AND post_date = CURRENT_DATE;

-- 5. ポイント残高を確認（認証済みユーザーのみ）
SELECT * FROM user_points WHERE user_id = auth.uid();

-- === リセット処理（必要に応じて実行） ===

-- 6. 今日の投稿数をリセット（0に戻す）
DELETE FROM daily_post_counts 
WHERE user_id = COALESCE(auth.uid()::text, 'test-user-123')
AND post_date = CURRENT_DATE;

-- 7. 会員グレードを無料会員にリセット
UPDATE user_memberships 
SET daily_post_limit = 2, membership_type = 'free'
WHERE user_id = COALESCE(auth.uid()::text, 'test-user-123');

-- 8. ポイントを追加（認証済みユーザーのみ）
DO $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO user_points (user_id, total_points)
        VALUES (auth.uid(), 100)
        ON CONFLICT (user_id) 
        DO UPDATE SET total_points = 100;
    ELSE
        RAISE NOTICE 'ユーザーが認証されていないため、ポイント操作をスキップします';
    END IF;
END $$;

-- 9. リセット後の状況を確認
SELECT * FROM check_user_post_limit(COALESCE(auth.uid()::text, 'test-user-123'));