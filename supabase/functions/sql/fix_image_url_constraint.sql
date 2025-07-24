-- image_urlカラムのNOT NULL制約を修正
-- 実行日: 2025-07-24

-- image_urlカラムをNULLABLEに変更
ALTER TABLE posts ALTER COLUMN image_url DROP NOT NULL;

-- 既存のNULLデータがある場合の確認
-- SELECT COUNT(*) FROM posts WHERE image_url IS NULL;

-- テーブル構造の確認
-- \d posts;