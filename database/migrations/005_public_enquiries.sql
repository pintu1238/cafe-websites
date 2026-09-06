BEGIN;
CREATE TABLE IF NOT EXISTS public_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_key uuid NOT NULL UNIQUE,
  payload_hash text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('contact', 'support', 'partner')),
  full_name varchar(100) NOT NULL,
  email varchar(254) NOT NULL,
  phone varchar(30),
  campus varchar(150) NOT NULL,
  topic varchar(80) NOT NULL,
  order_number varchar(80),
  business_name varchar(160),
  message text NOT NULL CHECK (char_length(message) BETWEEN 20 AND 4000),
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'IN_PROGRESS', 'RESOLVED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS public_enquiries_queue_idx ON public_enquiries(status, created_at DESC);
ALTER TABLE public_enquiries ENABLE ROW LEVEL SECURITY;
COMMIT;

