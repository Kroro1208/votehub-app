-- Security Audit RPC Functions
-- GitHub Issue #69対応: セキュリティ監査の複雑なクエリをRPC関数化

-- 1. 孤立した投票レコードをチェックする関数
CREATE OR REPLACE FUNCTION check_orphaned_votes()
RETURNS TABLE(
    id int8,
    post_id int8,
    user_id text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT v.id, v.post_id, v.user_id, v.created_at
    FROM votes v
    LEFT JOIN posts p ON v.post_id = p.id
    WHERE p.id IS NULL
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 孤立したコメントレコードをチェックする関数
CREATE OR REPLACE FUNCTION check_orphaned_comments()
RETURNS TABLE(
    id int8,
    post_id int8,
    user_id text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.post_id, c.user_id, c.created_at
    FROM comments c
    LEFT JOIN posts p ON c.post_id = p.id
    WHERE p.id IS NULL
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 異常な投票パターンをチェックする関数
CREATE OR REPLACE FUNCTION check_abnormal_voting_patterns()
RETURNS TABLE(
    user_id text,
    vote_count int8,
    last_vote_time timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT v.user_id, COUNT(*) as vote_count, MAX(v.created_at) as last_vote_time
    FROM votes v
    WHERE v.created_at > NOW() - INTERVAL '1 hour'
    GROUP BY v.user_id
    HAVING COUNT(*) > 50
    ORDER BY COUNT(*) DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 異常な投稿パターンをチェックする関数
CREATE OR REPLACE FUNCTION check_abnormal_posting_patterns()
RETURNS TABLE(
    user_id text,
    post_count int8,
    last_post_time timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.user_id, COUNT(*) as post_count, MAX(p.created_at) as last_post_time
    FROM posts p
    WHERE p.created_at > NOW() - INTERVAL '24 hours'
    GROUP BY p.user_id
    HAVING COUNT(*) > 20
    ORDER BY COUNT(*) DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 包括的なデータ整合性チェック関数
CREATE OR REPLACE FUNCTION comprehensive_data_integrity_check()
RETURNS JSON AS $$
DECLARE
    result JSON;
    orphaned_votes_count INTEGER;
    orphaned_comments_count INTEGER;
    orphaned_bookmarks_count INTEGER;
    orphaned_notifications_count INTEGER;
BEGIN
    -- 孤立した投票をカウント
    SELECT COUNT(*) INTO orphaned_votes_count
    FROM votes v
    LEFT JOIN posts p ON v.post_id = p.id
    WHERE p.id IS NULL;
    
    -- 孤立したコメントをカウント
    SELECT COUNT(*) INTO orphaned_comments_count
    FROM comments c
    LEFT JOIN posts p ON c.post_id = p.id
    WHERE p.id IS NULL;
    
    -- 孤立したブックマークをカウント
    SELECT COUNT(*) INTO orphaned_bookmarks_count
    FROM bookmarks b
    LEFT JOIN posts p ON b.post_id = p.id
    WHERE p.id IS NULL;
    
    -- 孤立した通知をカウント
    SELECT COUNT(*) INTO orphaned_notifications_count
    FROM notifications n
    LEFT JOIN posts p ON n.post_id = p.id
    WHERE n.post_id IS NOT NULL AND p.id IS NULL;
    
    -- JSON結果を構築
    result := json_build_object(
        'orphaned_votes', orphaned_votes_count,
        'orphaned_comments', orphaned_comments_count,
        'orphaned_bookmarks', orphaned_bookmarks_count,
        'orphaned_notifications', orphaned_notifications_count,
        'total_issues', orphaned_votes_count + orphaned_comments_count + orphaned_bookmarks_count + orphaned_notifications_count,
        'checked_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLSポリシーの状態をチェックする関数
CREATE OR REPLACE FUNCTION check_rls_policies()
RETURNS TABLE(
    table_name text,
    rls_enabled boolean,
    policy_count int8
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::text,
        t.rowsecurity as rls_enabled,
        COALESCE(p.policy_count, 0) as policy_count
    FROM pg_tables t
    LEFT JOIN (
        SELECT 
            schemaname || '.' || tablename as full_table_name,
            COUNT(*) as policy_count
        FROM pg_policies 
        GROUP BY schemaname, tablename
    ) p ON t.schemaname || '.' || t.tablename = p.full_table_name
    WHERE t.schemaname = 'public'
    AND t.tablename IN ('posts', 'votes', 'comments', 'notifications', 'communities', 'bookmarks', 'user_points')
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. セキュリティ監査の包括的な実行関数
CREATE OR REPLACE FUNCTION run_security_audit()
RETURNS JSON AS $$
DECLARE
    audit_result JSON;
    data_integrity JSON;
    rls_status JSON;
    abnormal_votes JSON;
    abnormal_posts JSON;
    audit_timestamp TIMESTAMPTZ;
BEGIN
    audit_timestamp := NOW();
    
    -- データ整合性チェック
    SELECT comprehensive_data_integrity_check() INTO data_integrity;
    
    -- RLSポリシー状況
    SELECT json_agg(row_to_json(t)) INTO rls_status
    FROM check_rls_policies() t;
    
    -- 異常な投票パターン
    SELECT json_agg(row_to_json(t)) INTO abnormal_votes
    FROM check_abnormal_voting_patterns() t;
    
    -- 異常な投稿パターン
    SELECT json_agg(row_to_json(t)) INTO abnormal_posts
    FROM check_abnormal_posting_patterns() t;
    
    -- 総合結果を構築
    audit_result := json_build_object(
        'audit_timestamp', audit_timestamp,
        'data_integrity', data_integrity,
        'rls_policies', rls_status,
        'abnormal_voting_patterns', abnormal_votes,
        'abnormal_posting_patterns', abnormal_posts,
        'status', 'completed'
    );
    
    RETURN audit_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限の付与
GRANT EXECUTE ON FUNCTION check_orphaned_votes() TO authenticated;
GRANT EXECUTE ON FUNCTION check_orphaned_comments() TO authenticated;
GRANT EXECUTE ON FUNCTION check_abnormal_voting_patterns() TO authenticated;
GRANT EXECUTE ON FUNCTION check_abnormal_posting_patterns() TO authenticated;
GRANT EXECUTE ON FUNCTION comprehensive_data_integrity_check() TO authenticated;
GRANT EXECUTE ON FUNCTION check_rls_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION run_security_audit() TO authenticated;

-- 成功メッセージ
SELECT 'Security audit RPC functions created successfully!' as status;