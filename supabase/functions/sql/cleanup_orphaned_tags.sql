-- Cleanup orphaned tags from deleted communities
-- This script removes tags that reference non-existent communities

-- まず、孤立したタグを確認
SELECT 
    t.id as tag_id,
    t.name as tag_name,
    t.community_id as orphaned_community_id,
    t.created_at
FROM tags t
LEFT JOIN communities c ON t.community_id = c.id
WHERE c.id IS NULL
ORDER BY t.created_at DESC;

-- 孤立したタグの数を確認
SELECT COUNT(*) as orphaned_tags_count
FROM tags t
LEFT JOIN communities c ON t.community_id = c.id
WHERE c.id IS NULL;

-- 孤立したタグを削除
DELETE FROM tags 
WHERE community_id NOT IN (
    SELECT id FROM communities
);

-- 削除後の確認 - 残っているタグの数
SELECT COUNT(*) as remaining_tags_count FROM tags;

-- 削除後の確認 - 各コミュニティのタグ数
SELECT 
    c.id as community_id,
    c.name as community_name,
    COUNT(t.id) as tag_count
FROM communities c
LEFT JOIN tags t ON c.id = t.community_id
GROUP BY c.id, c.name
ORDER BY c.id;

-- 成功メッセージ
SELECT 'Orphaned tags cleanup completed!' as status;