DO $$ BEGIN
  CREATE TYPE auth_provider AS ENUM ('PASSWORD', 'GOOGLE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_provider auth_provider NOT NULL DEFAULT 'PASSWORD',
  ADD COLUMN IF NOT EXISTS google_subject TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_subject
  ON users(google_subject)
  WHERE google_subject IS NOT NULL;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_token_hash TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  code_reset_token_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  code_verified_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_created
  ON password_reset_tokens(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_active_link
  ON password_reset_tokens(link_token_hash)
  WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_active_code
  ON password_reset_tokens(code_hash)
  WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_active_code_reset
  ON password_reset_tokens(code_reset_token_hash)
  WHERE used_at IS NULL AND code_reset_token_hash IS NOT NULL;
