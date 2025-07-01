-- ユーザーポイントシステムのテーブルとトリガー作成（修正版）

-- user_pointsテーブルの作成
CREATE TABLE IF NOT EXISTS user_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_points INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- user_pointsテーブルのRLS設定
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のポイントを閲覧可能
CREATE POLICY "Users can view their own points" ON user_points
    FOR SELECT USING (auth.uid() = user_id);

-- 全ユーザーのポイントを閲覧可能（ランキング表示用）
CREATE POLICY "Anyone can view user points" ON user_points
    FOR SELECT USING (true);

-- point_transactionsテーブル（ポイント履歴管理）
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    points INTEGER NOT NULL, -- 正数：獲得、負数：消費
    transaction_type TEXT NOT NULL, -- 'vote', 'comment', 'auto_spread', 'priority_display', 'daily_limit_remove', 'space_creation'
    reference_id UUID, -- 関連する投稿ID、コメントIDなど
    reference_table TEXT, -- 'posts', 'comments', 'votes'など
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- point_transactionsテーブルのRLS設定
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のポイント履歴を閲覧可能
CREATE POLICY "Users can view their own point transactions" ON point_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_reference ON point_transactions(reference_table, reference_id);

-- ユーザーポイント取得関数
CREATE OR REPLACE FUNCTION get_user_points(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_points_count INTEGER;
BEGIN
    SELECT COALESCE(total_points, 0) INTO user_points_count
    FROM user_points
    WHERE user_id = target_user_id;
    
    -- ユーザーが存在しない場合は0を返す
    IF user_points_count IS NULL THEN
        RETURN 0;
    END IF;
    
    RETURN user_points_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ポイント追加関数（型を明示的に指定）
CREATE OR REPLACE FUNCTION add_user_points(
    target_user_id UUID,
    points_to_add INTEGER,
    transaction_type TEXT,
    reference_id UUID DEFAULT NULL,
    reference_table TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 既存のポイント取得または新規作成
    INSERT INTO user_points (user_id, total_points)
    VALUES (target_user_id, points_to_add)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_points = user_points.total_points + points_to_add,
        updated_at = NOW();
    
    -- ポイント履歴の記録
    INSERT INTO point_transactions (
        user_id, 
        points, 
        transaction_type, 
        reference_id, 
        reference_table, 
        description
    ) VALUES (
        target_user_id, 
        points_to_add, 
        transaction_type, 
        reference_id, 
        reference_table, 
        description
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 投票時のポイント付与トリガー関数
CREATE OR REPLACE FUNCTION trigger_add_vote_points()
RETURNS TRIGGER AS $$
BEGIN
    -- 投票者に1ポイント付与（型を明示的にキャスト）
    PERFORM add_user_points(
        NEW.user_id::UUID,
        1::INTEGER,
        'vote'::TEXT,
        NEW.post_id::UUID,
        'posts'::TEXT,
        '投稿への投票'::TEXT
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- コメント時のポイント付与トリガー関数
CREATE OR REPLACE FUNCTION trigger_add_comment_points()
RETURNS TRIGGER AS $$
BEGIN
    -- コメント投稿者に1ポイント付与（型を明示的にキャスト）
    PERFORM add_user_points(
        NEW.user_id::UUID,
        1::INTEGER,
        'comment'::TEXT,
        NEW.post_id::UUID,
        'posts'::TEXT,
        'コメント投稿'::TEXT
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のトリガーを削除してから新しいトリガーを作成
DROP TRIGGER IF EXISTS trigger_vote_points ON votes;
CREATE TRIGGER trigger_vote_points
    AFTER INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_add_vote_points();

DROP TRIGGER IF EXISTS trigger_comment_points ON comments;
CREATE TRIGGER trigger_comment_points
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_add_comment_points();

-- 自動拡散機能のポイント付与（手動実行用）
CREATE OR REPLACE FUNCTION check_and_reward_auto_spread()
RETURNS VOID AS $$
DECLARE
    post_record RECORD;
BEGIN
    -- 100票達成した投稿を検索
    FOR post_record IN
        SELECT 
            p.id,
            p.user_id,
            p.title,
            COUNT(v.id) as vote_count
        FROM posts p
        LEFT JOIN votes v ON p.id = v.post_id
        GROUP BY p.id, p.user_id, p.title
        HAVING COUNT(v.id) >= 100
    LOOP
        -- 既にポイントが付与されているかチェック
        IF NOT EXISTS (
            SELECT 1 FROM point_transactions
            WHERE user_id = post_record.user_id
            AND transaction_type = 'auto_spread'
            AND reference_id = post_record.id
        ) THEN
            -- 10ポイント付与（型を明示的にキャスト）
            PERFORM add_user_points(
                post_record.user_id::UUID,
                10::INTEGER,
                'auto_spread'::TEXT,
                post_record.id::UUID,
                'posts'::TEXT,
                '投稿の自動拡散達成（100票）'::TEXT
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;