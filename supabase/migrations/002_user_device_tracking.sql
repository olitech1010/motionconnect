-- Migration 002: User Device Tracking & Telemetry

-- Add telemetry columns to transactions table if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='device_info') THEN
        ALTER TABLE public.transactions ADD COLUMN device_info TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='data_used_bytes') THEN
        ALTER TABLE public.transactions ADD COLUMN data_used_bytes BIGINT NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='expires_at') THEN
        ALTER TABLE public.transactions ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create indexes for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_transactions_mac_address ON public.transactions(mac_address);
CREATE INDEX IF NOT EXISTS idx_transactions_status_expires ON public.transactions(status, expires_at);

-- Insert 1 GHS Live Test Package for real Mobile Money verification
INSERT INTO public.packages (id, name, slug, data_limit, data_limit_bytes, duration_label, duration_seconds, amount, mikrotik_profile, signal_bars, is_active, sort_order)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '1 GHS Live Test',
  'test-1ghs',
  '500MB',
  524288000,
  '1 Hour Test Access',
  3600,
  1.00,
  'weekly',
  5,
  true,
  0
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  amount = EXCLUDED.amount,
  duration_label = EXCLUDED.duration_label,
  duration_seconds = EXCLUDED.duration_seconds,
  is_active = true,
  sort_order = 0;
