-- UUID型の古い関数のみ削除して競合を解決

DROP FUNCTION IF EXISTS create_persuasion_comment_safe(INTEGER, TEXT, UUID, TEXT);

-- 確認
SELECT 'UUID function removed, TEXT function should work now' as status;