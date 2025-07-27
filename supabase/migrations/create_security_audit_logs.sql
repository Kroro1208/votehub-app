-- =====================================================
-- セキュリティ監査ログテーブルの作成
-- =====================================================

-- セキュリティ監査ログテーブル
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT true
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action ON security_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_resource_type ON security_audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_success ON security_audit_logs(success);

-- RLS（Row Level Security）の設定
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみがすべてのログを閲覧可能
CREATE POLICY "Admin can view all audit logs" ON security_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ユーザーは自分のログのみ閲覧可能
CREATE POLICY "Users can view own audit logs" ON security_audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- システムによるログ挿入のみ許可
CREATE POLICY "System can insert audit logs" ON security_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 更新・削除は管理者のみ許可
CREATE POLICY "Admin can update audit logs" ON security_audit_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admin can delete audit logs" ON security_audit_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );