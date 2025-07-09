-- ユーザー評価システムのデータベーステーブル作成
-- GitHub Issue #43: 品質度スコアと共感ポイントシステム

-- 1. ユーザー品質度スコアテーブル
CREATE TABLE IF NOT EXISTS user_quality_scores (
    id bigserial PRIMARY KEY,
    user_id text NOT NULL,
    post_id int8 NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    vote_efficiency_score numeric(5,2) DEFAULT 0,
    discussion_activity_score numeric(5,2) DEFAULT 0,
    persuasion_effectiveness_score numeric(5,2) DEFAULT 0,
    sustained_interest_score numeric(5,2) DEFAULT 0,
    total_quality_score numeric(5,2) DEFAULT 0,
    quality_rank text DEFAULT 'F' CHECK (quality_rank IN ('S', 'A', 'B', 'C', 'D', 'F')),
    calculated_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, post_id)
);

-- 2. ユーザー共感ポイントテーブル
CREATE TABLE IF NOT EXISTS user_empathy_points (
    id bigserial PRIMARY KEY,
    user_id text UNIQUE NOT NULL,
    post_evaluation_score numeric(10,2) DEFAULT 0,
    comment_evaluation_score numeric(10,2) DEFAULT 0,
    participation_continuity_score numeric(10,2) DEFAULT 0,
    community_contribution_score numeric(10,2) DEFAULT 0,
    interaction_score numeric(10,2) DEFAULT 0,
    total_empathy_points numeric(10,2) DEFAULT 0,
    empathy_rank text DEFAULT 'new' CHECK (empathy_rank IN ('legend', 'master', 'expert', 'active', 'contributor', 'participant', 'new')),
    badge_icon text DEFAULT '👶',
    empathy_ranking_position integer DEFAULT 999999,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. インデックス作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_user_quality_scores_user_id ON user_quality_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quality_scores_post_id ON user_quality_scores(post_id);
CREATE INDEX IF NOT EXISTS idx_user_quality_scores_total_score ON user_quality_scores(total_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_empathy_points_user_id ON user_empathy_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_empathy_points_total_points ON user_empathy_points(total_empathy_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_empathy_points_ranking ON user_empathy_points(empathy_ranking_position);

-- 4. 品質度スコア計算関数
CREATE OR REPLACE FUNCTION calculate_quality_score(input_post_id bigint, input_user_id text)
RETURNS numeric AS $$
DECLARE
    post_record RECORD;
    vote_count integer;
    comment_count integer;
    nested_post_count integer;
    vote_period_days numeric;
    vote_efficiency numeric DEFAULT 0;
    discussion_activity numeric DEFAULT 0;
    persuasion_effectiveness numeric DEFAULT 0;
    sustained_interest numeric DEFAULT 0;
    adjustment_factor numeric DEFAULT 1.0;
    quality_score numeric DEFAULT 0;
    quality_rank text DEFAULT 'F';
BEGIN
    -- 投稿情報取得
    SELECT * INTO post_record
    FROM posts 
    WHERE id = input_post_id AND user_id = input_user_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- 基本統計を取得
    SELECT COUNT(*) INTO vote_count
    FROM votes 
    WHERE post_id = input_post_id;
    
    SELECT COUNT(*) INTO comment_count
    FROM comments 
    WHERE post_id = input_post_id;
    
    SELECT COUNT(*) INTO nested_post_count
    FROM posts 
    WHERE parent_post_id = input_post_id;
    
    -- 投票期間日数を計算
    IF post_record.vote_deadline IS NOT NULL THEN
        vote_period_days := EXTRACT(EPOCH FROM (post_record.vote_deadline - post_record.created_at)) / 86400;
        vote_period_days := GREATEST(vote_period_days, 0.1); -- 最小0.1日
    ELSE
        vote_period_days := 7; -- デフォルト7日
    END IF;
    
    -- 1. 投票効率係数 (40%)
    vote_efficiency := (vote_count::numeric / vote_period_days) * adjustment_factor;
    
    -- 調整係数の計算
    IF post_record.image_url IS NOT NULL THEN
        adjustment_factor := adjustment_factor + 0.1;
    END IF;
    
    IF LENGTH(post_record.content) >= 300 THEN
        adjustment_factor := adjustment_factor + 0.1;
    END IF;
    
    IF nested_post_count > 0 THEN
        adjustment_factor := adjustment_factor + 0.2;
    END IF;
    
    IF vote_count >= 100 THEN
        adjustment_factor := adjustment_factor + 0.5;
    END IF;
    
    vote_efficiency := vote_efficiency * adjustment_factor;
    
    -- 2. 議論活発係数 (25%)
    discussion_activity := (comment_count * 1.0) + (nested_post_count * 2.0);
    
    -- 3. 説得効果係数 (20%) - 簡略化版
    persuasion_effectiveness := LEAST(vote_count * 0.1, 10);
    
    -- 4. 継続関心係数 (15%) - 簡略化版
    sustained_interest := LEAST(vote_count * 0.05, 10);
    
    -- 最終スコア計算
    quality_score := (vote_efficiency * 0.4) + (discussion_activity * 0.25) + 
                     (persuasion_effectiveness * 0.2) + (sustained_interest * 0.15);
    
    -- スコアを0-100に正規化
    quality_score := LEAST(quality_score, 100);
    
    -- ランク決定
    IF quality_score >= 90 THEN
        quality_rank := 'S';
    ELSIF quality_score >= 80 THEN
        quality_rank := 'A';
    ELSIF quality_score >= 70 THEN
        quality_rank := 'B';
    ELSIF quality_score >= 60 THEN
        quality_rank := 'C';
    ELSIF quality_score >= 50 THEN
        quality_rank := 'D';
    ELSE
        quality_rank := 'F';
    END IF;
    
    -- 結果を保存
    INSERT INTO user_quality_scores (
        user_id, post_id, vote_efficiency_score, discussion_activity_score,
        persuasion_effectiveness_score, sustained_interest_score, 
        total_quality_score, quality_rank
    ) VALUES (
        input_user_id, input_post_id, vote_efficiency, discussion_activity,
        persuasion_effectiveness, sustained_interest, quality_score, quality_rank
    )
    ON CONFLICT (user_id, post_id) 
    DO UPDATE SET 
        vote_efficiency_score = EXCLUDED.vote_efficiency_score,
        discussion_activity_score = EXCLUDED.discussion_activity_score,
        persuasion_effectiveness_score = EXCLUDED.persuasion_effectiveness_score,
        sustained_interest_score = EXCLUDED.sustained_interest_score,
        total_quality_score = EXCLUDED.total_quality_score,
        quality_rank = EXCLUDED.quality_rank,
        updated_at = now();
    
    RETURN quality_score;
END;
$$ LANGUAGE plpgsql;

-- 5. 共感ポイント計算関数
CREATE OR REPLACE FUNCTION calculate_empathy_points(input_user_id text)
RETURNS numeric AS $$
DECLARE
    post_eval_score numeric DEFAULT 0;
    comment_eval_score numeric DEFAULT 0;
    participation_score numeric DEFAULT 0;
    community_contrib_score numeric DEFAULT 0;
    interaction_score numeric DEFAULT 0;
    total_empathy numeric DEFAULT 0;
    empathy_rank text DEFAULT 'new';
    badge_icon text DEFAULT '👶';
    user_post_count integer;
    user_comment_count integer;
    user_vote_count integer;
    user_bookmark_count integer;
    ranking_position integer DEFAULT 999999;
BEGIN
    -- 基本統計取得
    SELECT COUNT(*) INTO user_post_count
    FROM posts WHERE user_id = input_user_id;
    
    SELECT COUNT(*) INTO user_comment_count
    FROM comments WHERE user_id = input_user_id;
    
    SELECT COUNT(*) INTO user_vote_count
    FROM votes WHERE user_id = input_user_id;
    
    SELECT COUNT(*) INTO user_bookmark_count
    FROM bookmarks WHERE user_id = input_user_id;
    
    -- 1. 投稿評価係数 (30%)
    SELECT COALESCE(SUM(
        (COALESCE(vote_count, 0) * 1.0) + 
        (COALESCE(comment_count, 0) * 0.7) + 
        (user_bookmark_count * 0.5)
    ), 0) INTO post_eval_score
    FROM (
        SELECT p.id, 
               (SELECT COUNT(*) FROM votes v WHERE v.post_id = p.id) as vote_count,
               (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
        FROM posts p 
        WHERE p.user_id = input_user_id
    ) post_stats;
    
    -- 2. コメント評価係数 (25%)
    SELECT COALESCE(SUM(
        COALESCE((SELECT COUNT(*) FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.vote = 1), 0) -
        COALESCE((SELECT COUNT(*) FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.vote = -1), 0)
    ), 0) INTO comment_eval_score
    FROM comments c
    WHERE c.user_id = input_user_id;
    
    -- 3. 参加継続係数 (20%)
    participation_score := (user_post_count * 2.0) + (user_vote_count * 1.0) + (user_comment_count * 1.5);
    
    -- 4. コミュニティ貢献係数 (15%)
    SELECT COALESCE(COUNT(*) * 5.0, 0) INTO community_contrib_score
    FROM communities WHERE id IN (
        SELECT DISTINCT community_id FROM posts WHERE user_id = input_user_id
    );
    
    -- 5. 相互作用係数 (10%)
    interaction_score := (user_comment_count * 0.3) + (user_vote_count * 0.1);
    
    -- 総合スコア計算
    total_empathy := (post_eval_score * 0.3) + (comment_eval_score * 0.25) + 
                     (participation_score * 0.2) + (community_contrib_score * 0.15) + 
                     (interaction_score * 0.1);
    
    -- ランクとバッジ決定
    IF total_empathy >= 10000 THEN
        empathy_rank := 'legend';
        badge_icon := '🏆';
    ELSIF total_empathy >= 5000 THEN
        empathy_rank := 'master';
        badge_icon := '💎';
    ELSIF total_empathy >= 2000 THEN
        empathy_rank := 'expert';
        badge_icon := '🌟';
    ELSIF total_empathy >= 1000 THEN
        empathy_rank := 'active';
        badge_icon := '⚡';
    ELSIF total_empathy >= 500 THEN
        empathy_rank := 'contributor';
        badge_icon := '🔥';
    ELSIF total_empathy >= 100 THEN
        empathy_rank := 'participant';
        badge_icon := '🌱';
    ELSE
        empathy_rank := 'new';
        badge_icon := '👶';
    END IF;
    
    -- 結果を保存
    INSERT INTO user_empathy_points (
        user_id, post_evaluation_score, comment_evaluation_score,
        participation_continuity_score, community_contribution_score,
        interaction_score, total_empathy_points, empathy_rank, badge_icon,
        empathy_ranking_position
    ) VALUES (
        input_user_id, post_eval_score, comment_eval_score,
        participation_score, community_contrib_score, interaction_score,
        total_empathy, empathy_rank, badge_icon, ranking_position
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        post_evaluation_score = EXCLUDED.post_evaluation_score,
        comment_evaluation_score = EXCLUDED.comment_evaluation_score,
        participation_continuity_score = EXCLUDED.participation_continuity_score,
        community_contribution_score = EXCLUDED.community_contribution_score,
        interaction_score = EXCLUDED.interaction_score,
        total_empathy_points = EXCLUDED.total_empathy_points,
        empathy_rank = EXCLUDED.empathy_rank,
        badge_icon = EXCLUDED.badge_icon,
        updated_at = now();
    
    RETURN total_empathy;
END;
$$ LANGUAGE plpgsql;

-- 6. 共感ポイントランキング更新関数
CREATE OR REPLACE FUNCTION update_empathy_rankings()
RETURNS void AS $$
BEGIN
    WITH ranked_users AS (
        SELECT user_id, 
               ROW_NUMBER() OVER (ORDER BY total_empathy_points DESC) as rank
        FROM user_empathy_points
        WHERE total_empathy_points > 0
    )
    UPDATE user_empathy_points 
    SET empathy_ranking_position = ranked_users.rank
    FROM ranked_users
    WHERE user_empathy_points.user_id = ranked_users.user_id;
END;
$$ LANGUAGE plpgsql;

-- 7. 初期データ挿入用関数
CREATE OR REPLACE FUNCTION initialize_user_empathy_points(input_user_id text)
RETURNS void AS $$
BEGIN
    INSERT INTO user_empathy_points (user_id) 
    VALUES (input_user_id)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;