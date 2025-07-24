-- 派生質問制限の強化 - データベースレベル制約とトリガー
-- 実行日: 2025-07-24

-- 1. より厳密なデータベース制約を追加
ALTER TABLE posts 
    ADD CONSTRAINT check_nested_post_constraints 
    CHECK (
        -- ネストレベル制約
        (nest_level >= 0 AND nest_level <= 3) AND
        -- 親投稿IDが存在する場合のネストレベル整合性
        (parent_post_id IS NULL OR nest_level > 0) AND
        -- ネストレベル0の場合は親投稿IDがnull
        (nest_level = 0 OR parent_post_id IS NOT NULL) AND
        -- target_vote_choiceは親投稿がある場合のみ設定可能
        (parent_post_id IS NULL OR target_vote_choice IN (-1, 1))
    );

-- 2. 派生質問作成前の検証トリガー関数
CREATE OR REPLACE FUNCTION validate_nested_post_creation()
RETURNS TRIGGER AS $$
DECLARE
    parent_nest_level integer;
    parent_author text;
BEGIN
    -- 親投稿が存在する場合の検証
    IF NEW.parent_post_id IS NOT NULL THEN
        -- 親投稿の存在確認とネストレベル、作成者取得
        SELECT nest_level, user_id INTO parent_nest_level, parent_author
        FROM posts 
        WHERE id = NEW.parent_post_id;
        
        -- 親投稿が存在しない場合
        IF parent_nest_level IS NULL THEN
            RAISE EXCEPTION '親投稿が存在しません: %', NEW.parent_post_id;
        END IF;
        
        -- ネストレベル制限チェック
        IF parent_nest_level >= 3 THEN
            RAISE EXCEPTION 'ネストレベルは最大3階層までです。親投稿のレベル: %', parent_nest_level;
        END IF;
        
        -- 正しいネストレベル設定の強制
        IF NEW.nest_level != parent_nest_level + 1 THEN
            RAISE EXCEPTION 'ネストレベルが不正です。期待値: %, 実際値: %', parent_nest_level + 1, NEW.nest_level;
        END IF;
        
        -- target_vote_choice必須チェック
        IF NEW.target_vote_choice IS NULL THEN
            RAISE EXCEPTION 'ネスト投稿にはtarget_vote_choiceが必須です';
        END IF;
        
        -- target_vote_choiceの値チェック
        IF NEW.target_vote_choice NOT IN (-1, 1) THEN
            RAISE EXCEPTION 'target_vote_choiceは-1または1である必要があります: %', NEW.target_vote_choice;
        END IF;
        
        -- 投稿主の場合は投票チェックを免除
        -- （投稿主以外の場合の投票チェックはアプリケーションレベルで実行）
        
    ELSE
        -- 親投稿がない場合の検証
        IF NEW.nest_level != 0 THEN
            RAISE EXCEPTION 'ルート投稿のネストレベルは0である必要があります: %', NEW.nest_level;
        END IF;
        
        IF NEW.target_vote_choice IS NOT NULL THEN
            RAISE EXCEPTION 'ルート投稿にはtarget_vote_choiceを設定できません';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. トリガーの設定
DROP TRIGGER IF EXISTS trigger_validate_nested_post ON posts;
CREATE TRIGGER trigger_validate_nested_post
    BEFORE INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION validate_nested_post_creation();

-- 4. 投票権限チェック関数
CREATE OR REPLACE FUNCTION can_user_vote_on_nested_post(
    user_id_param text,
    nested_post_id int8
)
RETURNS boolean AS $$
DECLARE
    parent_post_id_val int8;
    target_vote_choice_val integer;
    nested_post_author text;
    parent_post_author text;
    user_parent_vote integer;
BEGIN
    -- ネスト投稿の情報を取得
    SELECT parent_post_id, target_vote_choice, user_id 
    INTO parent_post_id_val, target_vote_choice_val, nested_post_author
    FROM posts 
    WHERE id = nested_post_id;
    
    -- ルート投稿の場合は常に投票可能
    IF parent_post_id_val IS NULL THEN
        RETURN true;
    END IF;
    
    -- target_vote_choiceが設定されていない場合は全員投票可能
    IF target_vote_choice_val IS NULL THEN
        RETURN true;
    END IF;
    
    -- ネスト投稿の作成者は常に投票可能
    IF nested_post_author = user_id_param THEN
        RETURN true;
    END IF;
    
    -- 親投稿の作成者を取得
    SELECT user_id INTO parent_post_author
    FROM posts 
    WHERE id = parent_post_id_val;
    
    -- 親投稿の作成者も常に投票可能
    IF parent_post_author = user_id_param THEN
        RETURN true;
    END IF;
    
    -- その他のユーザーは親投稿への投票を確認
    SELECT vote INTO user_parent_vote
    FROM votes 
    WHERE user_id = user_id_param AND post_id = parent_post_id_val
    LIMIT 1;
    
    -- 親投稿に投票していない場合は投票不可
    IF user_parent_vote IS NULL THEN
        RETURN false;
    END IF;
    
    -- target_vote_choiceと一致する場合のみ投票可能
    RETURN user_parent_vote = target_vote_choice_val;
END;
$$ LANGUAGE plpgsql;

-- 5. 投票時の権限チェックトリガー関数
CREATE OR REPLACE FUNCTION validate_nested_post_vote()
RETURNS TRIGGER AS $$
BEGIN
    -- ネスト投稿への投票権限チェック
    IF NOT can_user_vote_on_nested_post(NEW.user_id, NEW.post_id) THEN
        RAISE EXCEPTION 'この投稿への投票権限がありません。親投稿への投票が必要です。';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 投票テーブルにトリガー設定
DROP TRIGGER IF EXISTS trigger_validate_nested_vote ON votes;
CREATE TRIGGER trigger_validate_nested_vote
    BEFORE INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION validate_nested_post_vote();

-- 7. RLSポリシーの強化
-- ネスト投稿の表示制限
CREATE POLICY "nested_post_visibility" ON posts FOR SELECT USING (
    -- ルート投稿は全員表示可能
    parent_post_id IS NULL OR
    -- target_vote_choiceが設定されていない場合は全員表示可能  
    target_vote_choice IS NULL OR
    -- 認証されていない場合は表示不可
    auth.uid() IS NULL OR
    -- 親投稿に適切に投票している場合のみ表示可能
    EXISTS (
        SELECT 1 FROM votes v 
        WHERE v.user_id = auth.uid()::text 
        AND v.post_id = posts.parent_post_id 
        AND v.vote = posts.target_vote_choice
    )
);

-- 8. 投票制限のRLSポリシー
CREATE POLICY "nested_post_vote_restriction" ON votes FOR INSERT WITH CHECK (
    can_user_vote_on_nested_post(auth.uid()::text, post_id)
);

-- マイグレーション完了
-- この強化により以下が実現されます：
-- 1. データベースレベルでの厳密な制約チェック
-- 2. ネストレベル制限の強制
-- 3. target_vote_choice必須化
-- 4. 投票権限の厳密なチェック
-- 5. RLSによる表示・操作制限