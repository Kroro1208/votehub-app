-- 簡単な関数クリーンアップ（UUID型の古い関数のみ削除）

-- UUID型の古い関数を削除
DROP FUNCTION IF EXISTS create_persuasion_comment_safe(INTEGER, TEXT, UUID, TEXT);

-- 現在存在する関数を確認
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE p.proname LIKE '%persuasion_comment%' 
    AND n.nspname = 'public'
ORDER BY p.proname, arguments;