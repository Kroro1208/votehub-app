-- 説得タイム中の投票変更追跡機能のためのマイグレーション
-- 実行日: 2025-06-23
-- Issue: 説得タイム中の投票変更を追跡するためのフィールド追加

-- votesテーブルに説得タイム追跡用フィールドを追加
ALTER TABLE votes 
ADD COLUMN persuasion_vote_changed BOOLEAN DEFAULT FALSE,
ADD COLUMN original_vote INTEGER,
ADD COLUMN changed_at TIMESTAMPTZ,
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- インデックスを追加（パフォーマンス最適化）
CREATE INDEX idx_votes_persuasion_changed ON votes(persuasion_vote_changed);
CREATE INDEX idx_votes_changed_at ON votes(changed_at);

-- 投票更新時のタイムスタンプを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_vote_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
CREATE TRIGGER trigger_update_vote_timestamp
    BEFORE UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_vote_timestamp();

-- 説得タイム中の投票変更を追跡する関数（1回制限付き）
CREATE OR REPLACE FUNCTION track_persuasion_vote_change(
    p_post_id BIGINT,
    p_user_id TEXT,
    p_new_vote INTEGER
) RETURNS jsonb AS $$
DECLARE
    existing_vote RECORD;
    is_persuasion_time BOOLEAN;
    post_deadline TIMESTAMPTZ;
BEGIN
    -- 投稿の期限を取得
    SELECT vote_deadline INTO post_deadline 
    FROM posts 
    WHERE id = p_post_id;
    
    -- 説得タイム（期限の1時間前）かどうかをチェック
    -- UTCで統一して判定
    is_persuasion_time := (
        NOW() AT TIME ZONE 'UTC' >= (post_deadline AT TIME ZONE 'UTC' - INTERVAL '1 hour') 
        AND NOW() AT TIME ZONE 'UTC' < post_deadline AT TIME ZONE 'UTC'
    );
    
    -- 既存の投票を取得
    SELECT * INTO existing_vote 
    FROM votes 
    WHERE post_id = p_post_id AND user_id = p_user_id;
    
    -- 説得タイム中かつ既存投票がある場合（投票値が同じでも制限を適用）
    IF is_persuasion_time AND existing_vote IS NOT NULL THEN
        -- 既に説得タイム中に投票を変更している場合はエラー
        IF existing_vote.persuasion_vote_changed = TRUE THEN
            RAISE EXCEPTION '説得タイム中の投票変更は1回までです';
        END IF;
        
        -- 投票を更新し、変更を追跡（投票値が異なる場合のみ更新）
        IF existing_vote.vote != p_new_vote THEN
            UPDATE votes 
            SET 
                vote = p_new_vote,
                persuasion_vote_changed = TRUE,
                original_vote = COALESCE(original_vote, existing_vote.vote),
                changed_at = NOW()
            WHERE id = existing_vote.id;
        ELSE
            -- 同じ投票値でも説得タイム中の変更フラグをセット
            UPDATE votes 
            SET 
                persuasion_vote_changed = TRUE,
                original_vote = COALESCE(original_vote, existing_vote.vote),
                changed_at = NOW()
            WHERE id = existing_vote.id;
        END IF;
        
        RETURN jsonb_build_object(
            'action', 'persuasion_change',
            'data', jsonb_build_object(
                'id', existing_vote.id,
                'post_id', p_post_id,
                'user_id', p_user_id,
                'vote', p_new_vote,
                'persuasion_vote_changed', TRUE,
                'original_vote', COALESCE(existing_vote.original_vote, existing_vote.vote),
                'changed_at', NOW()
            )
        );
    ELSE
        -- 通常の投票更新
        UPDATE votes 
        SET vote = p_new_vote
        WHERE id = existing_vote.id;
        
        RETURN jsonb_build_object(
            'action', 'normal_update',
            'data', jsonb_build_object(
                'id', existing_vote.id,
                'post_id', p_post_id,
                'user_id', p_user_id,
                'vote', p_new_vote,
                'persuasion_vote_changed', FALSE
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 説得タイム中の投票変更統計を取得する関数
CREATE OR REPLACE FUNCTION get_persuasion_vote_stats(p_post_id BIGINT)
RETURNS TABLE (
    total_votes BIGINT,
    changed_votes BIGINT,
    change_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_votes,
        COUNT(*) FILTER (WHERE persuasion_vote_changed = TRUE) as changed_votes,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(
                    (COUNT(*) FILTER (WHERE persuasion_vote_changed = TRUE)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
                    2
                )
            ELSE 0
        END as change_rate
    FROM votes 
    WHERE post_id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 投稿別の説得効果レポート関数
CREATE OR REPLACE FUNCTION get_persuasion_effectiveness_report(p_post_id BIGINT)
RETURNS TABLE (
    original_vote_value INTEGER,
    new_vote_value INTEGER,
    change_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.original_vote,
        v.vote as new_vote_value,
        COUNT(*) as change_count
    FROM votes v
    WHERE v.post_id = p_post_id 
      AND v.persuasion_vote_changed = TRUE
    GROUP BY v.original_vote, v.vote
    ORDER BY change_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION track_persuasion_vote_change(BIGINT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_persuasion_vote_stats(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_persuasion_effectiveness_report(BIGINT) TO authenticated;

-- マイグレーション完了
-- このマイグレーションにより以下が可能になります：
-- 1. 説得タイム中の投票変更を自動追跡
-- 2. 元の投票値の保持
-- 3. 投票変更日時の記録
-- 4. 説得効果の統計分析
-- 5. 投稿別の説得効果レポート作成