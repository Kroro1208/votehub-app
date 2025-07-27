-- 投稿数リセット用RPC関数
-- テスト用に今日の投稿数をリセットする関数

CREATE OR REPLACE FUNCTION reset_user_daily_post_count(
    p_user_id TEXT,
    p_post_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 指定された日付の投稿数記録を削除
    DELETE FROM daily_post_counts 
    WHERE user_id = p_user_id 
    AND post_date = p_post_date;
    
    -- 投稿制限解除履歴も削除（必要に応じて）
    DELETE FROM post_limit_removals
    WHERE user_id = p_user_id
    AND removal_date = p_post_date;
    
    RETURN TRUE;
END;
$$;

-- 権限設定
GRANT EXECUTE ON FUNCTION reset_user_daily_post_count(TEXT, DATE) TO authenticated;