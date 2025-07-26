-- 強制的にUUID型の関数を削除

-- 全てのcreate_persuasion_comment_safe関数を削除
DROP FUNCTION IF EXISTS public.create_persuasion_comment_safe(integer, text, uuid, text);
DROP FUNCTION IF EXISTS public.create_persuasion_comment_safe(integer, text, text, text);

-- スキーマ指定での削除も試行
DROP FUNCTION IF EXISTS create_persuasion_comment_safe(integer, text, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS create_persuasion_comment_safe(integer, text, text, text) CASCADE;

-- 動的削除
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.proname = 'create_persuasion_comment_safe' AND n.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
                      func_record.nspname, func_record.proname, func_record.args);
        RAISE NOTICE 'Dropped function: %.%(%)', func_record.nspname, func_record.proname, func_record.args;
    END LOOP;
END
$$;

-- 確認
SELECT 'All create_persuasion_comment_safe functions removed' as status;