-- ポイント付与システムの見直し
-- 実行日: 2025-06-28
-- Issue #29: ポイント付与の見直し

-- 1. 自分の投稿に投票が入ったら0.5ポイント自分に付与されるようにする
-- 2. 説得コメントはポイントに加算しない

-- 既存のトリガー関数を更新
DROP TRIGGER IF EXISTS trigger_vote_points ON votes;
DROP TRIGGER IF EXISTS trigger_comment_points ON comments;

-- 投票時のポイント付与トリガー関数を更新
CREATE OR REPLACE FUNCTION trigger_add_vote_points()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id text;
    current_vote_count integer;
BEGIN
    -- 投稿者のIDを取得
    SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
    
    -- 投票者に1ポイント付与（同じユーザーが同じ投稿に投票した履歴があるかチェック）
    IF NOT EXISTS (
        SELECT 1 FROM point_transactions
        WHERE user_id = NEW.user_id::UUID
        AND transaction_type = 'vote'
        AND reference_id = NEW.post_id
        AND reference_table = 'posts'
    ) THEN
        -- 初回投票の場合のみ1ポイント付与
        PERFORM add_user_points(
            NEW.user_id::UUID,
            1.0,
            'vote',
            NEW.post_id,
            'posts',
            '投稿への投票（初回）'
        );
    END IF;
    
    -- 投稿者に0.5ポイント付与（投票を受けた時）
    -- 自分の投稿に自分で投票した場合は除外
    IF post_author_id != NEW.user_id THEN
        -- 同じ投票者から既にポイントを受け取っているかチェック
        IF NOT EXISTS (
            SELECT 1 FROM point_transactions
            WHERE user_id = post_author_id::UUID
            AND transaction_type = 'vote_received'
            AND reference_id = NEW.post_id
            AND reference_table = 'posts'
            AND description = CONCAT('投票を受けた（', NEW.user_id, 'から）')
        ) THEN
            PERFORM add_user_points(
                post_author_id::UUID,
                0.5,
                'vote_received',
                NEW.post_id,
                'posts',
                CONCAT('投票を受けた（', NEW.user_id, 'から）')
            );
        END IF;
    END IF;
    
    -- 現在の投票数を取得
    SELECT COUNT(*) INTO current_vote_count FROM votes WHERE post_id = NEW.post_id;
    
    -- 100票達成時に自動拡散ポイントをチェック
    IF current_vote_count = 100 THEN
        -- 投稿者にまだ自動拡散ポイントが付与されていない場合
        IF NOT EXISTS (
            SELECT 1 FROM point_transactions
            WHERE user_id = post_author_id::UUID
            AND transaction_type = 'auto_spread'
            AND reference_id = NEW.post_id
        ) THEN
            PERFORM add_user_points(
                post_author_id::UUID,
                10.0,
                'auto_spread',
                NEW.post_id,
                'posts',
                '投稿の自動拡散達成（100票）'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- コメント時のポイント付与トリガー関数を更新（説得コメント除外）
CREATE OR REPLACE FUNCTION trigger_add_comment_points()
RETURNS TRIGGER AS $$
BEGIN
    -- 説得コメントの場合はポイント付与しない
    IF NEW.is_persuasion_comment = true THEN
        RETURN NEW;
    END IF;
    
    -- 同じユーザーが同じ投稿にコメントした履歴があるかチェック
    IF NOT EXISTS (
        SELECT 1 FROM point_transactions
        WHERE user_id = NEW.user_id::UUID
        AND transaction_type = 'comment'
        AND reference_id = NEW.post_id
        AND reference_table = 'posts'
    ) THEN
        -- 初回コメントの場合のみ0.5ポイント付与
        PERFORM add_user_points(
            NEW.user_id::UUID,
            0.5,
            'comment',
            NEW.post_id,
            'posts',
            'コメント投稿（初回）'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを再作成
CREATE TRIGGER trigger_vote_points
    AFTER INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_add_vote_points();

CREATE TRIGGER trigger_comment_points
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_add_comment_points();

-- transaction_typeに新しいタイプ'vote_received'を追加するためのコメント
-- point_transactionsテーブルのtransaction_typeカラムには制約がないため、
-- 新しい値'vote_received'はそのまま使用可能