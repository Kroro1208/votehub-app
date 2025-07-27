-- useEmpathyPoints.ts用のRPC関数

-- ユーザーの共感ポイント取得関数
CREATE OR REPLACE FUNCTION get_user_empathy_points(p_user_id UUID)
RETURNS TABLE (
    points decimal
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT pt.points
    FROM point_transactions pt
    WHERE pt.user_id = p_user_id 
    AND pt.transaction_type = 'empathy';
END;
$$;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION get_user_empathy_points(UUID) TO authenticated;