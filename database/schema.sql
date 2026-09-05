-- Supabase SQL editor/psql entrypoint. The ordered migration is idempotent.
\i migrations/001_initial_schema.sql
\i migrations/002_authentication_extensions.sql
\i migrations/003_email_verification.sql
