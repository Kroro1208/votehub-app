-- 日付変更時の投稿制限リセット機能

-- 既存関数を削除
DROP FUNCTION IF EXISTS ensure_daily_reset(TEXT, DATE);

-- 日次リセット確保関数
CREATE OR REPLACE FUNCTION ensure_daily_reset(
  p_user_id TEXT,
  p_current_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
  last_active_date DATE;
BEGIN
  -- ユーザーの最後のアクティブ日を取得
  SELECT MAX(post_date) INTO last_active_date
  FROM daily_post_counts
  WHERE user_id = p_user_id;
  
  -- 日付が変わった場合または初回の場合、今日のレコードを0で初期化
  IF last_active_date IS NULL OR last_active_date < p_current_date THEN
    INSERT INTO daily_post_counts (user_id, post_date, post_count, limit_removed_count)
    VALUES (p_user_id, p_current_date, 0, 0)
    ON CONFLICT (user_id, post_date) 
    DO UPDATE SET 
      post_count = 0,
      limit_removed_count = 0,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限の付与
GRANT EXECUTE ON FUNCTION ensure_daily_reset(TEXT, DATE) TO authenticated;

-- 完了メッセージ
SELECT 'Daily post reset function created successfully!' as status;