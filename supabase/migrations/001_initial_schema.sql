-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Packages table
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  data_limit TEXT NOT NULL,
  data_limit_bytes BIGINT NOT NULL,
  duration_label TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  mikrotik_profile TEXT NOT NULL,
  signal_bars INTEGER NOT NULL DEFAULT 1 CHECK (signal_bars BETWEEN 1 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL,
  hubtel_reference TEXT,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  package_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  phone TEXT NOT NULL,
  mac_address TEXT NOT NULL,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'expired')),
  payment_method TEXT DEFAULT 'mtn-momo',
  voucher_code TEXT,
  mikrotik_username TEXT,
  mikrotik_synced BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  sms_status TEXT CHECK (sms_status IN ('sent', 'failed', NULL)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Routers table
CREATE TABLE IF NOT EXISTS public.routers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  campus TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  api_port INTEGER NOT NULL DEFAULT 443,
  api_username TEXT NOT NULL,
  api_status TEXT NOT NULL DEFAULT 'unknown' CHECK (api_status IN ('online', 'offline', 'unknown')),
  router_model TEXT DEFAULT 'RB5009UG+S+',
  router_os_version TEXT DEFAULT '7.19.6',
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active packages for captive portal
DROP POLICY IF EXISTS "Public can view active packages" ON public.packages;
CREATE POLICY "Public can view active packages" ON public.packages
  FOR SELECT USING (is_active = true);

-- Allow public read access to transactions by reference (for status polling)
DROP POLICY IF EXISTS "Public can view transaction status by reference" ON public.transactions;
CREATE POLICY "Public can view transaction status by reference" ON public.transactions
  FOR SELECT USING (true);

-- Authenticated admin users have full access to all tables
DROP POLICY IF EXISTS "Admins have full access to packages" ON public.packages;
CREATE POLICY "Admins have full access to packages" ON public.packages
  FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins have full access to transactions" ON public.transactions;
CREATE POLICY "Admins have full access to transactions" ON public.transactions
  FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins have full access to routers" ON public.routers;
CREATE POLICY "Admins have full access to routers" ON public.routers
  FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins have full access to settings" ON public.settings;
CREATE POLICY "Admins have full access to settings" ON public.settings
  FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins have full access to activity logs" ON public.activity_logs;
CREATE POLICY "Admins have full access to activity logs" ON public.activity_logs
  FOR ALL TO authenticated USING (true);
