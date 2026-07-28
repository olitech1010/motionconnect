-- Seed Default WiFi Packages
INSERT INTO public.packages (name, slug, data_limit, data_limit_bytes, duration_label, duration_seconds, amount, mikrotik_profile, signal_bars, is_active, sort_order)
VALUES
  ('1 GHS Live Test', 'test-1ghs', '500MB', 524288000, '1 Hour Test Access', 3600, 1.00, 'weekly', 5, true, 0),
  ('Weekly Access', 'weekly', '5GB', 5368709120, '7 Days Access', 604800, 11.00, 'weekly', 1, true, 1),
  ('24hr Speed Boost', 'boost24', '10GB', 10737418240, '24 Hours Access', 86400, 15.00, 'boost24', 2, true, 2),
  ('Bi-Weekly Value', 'biweekly', '15GB', 16106127360, '14 Days Access', 1209600, 25.00, 'biweekly', 3, true, 3),
  ('Bi-Weekly Pro', 'bwpro', '25GB', 26843545600, '14 Days Access', 1209600, 40.00, 'bwpro', 4, true, 4),
  ('Monthly Unlimited', 'monthly', '50GB', 53687091200, '30 Days Access', 2592000, 70.00, 'monthly', 5, true, 5)
ON CONFLICT (slug) DO UPDATE SET amount = EXCLUDED.amount, is_active = true;

-- Seed Default Router
INSERT INTO public.routers (name, campus, ip_address, api_port, api_username, api_status, router_model, router_os_version)
VALUES
  ('Main Campus Router', 'Main Campus', '192.168.20.1', 443, 'motion-api', 'online', 'RB5009UG+S+', '7.19.6');

-- Seed Default Settings
INSERT INTO public.settings (key, value)
VALUES
  ('company_name', 'Motion Connect'),
  ('support_phone', '0240000000'),
  ('currency', 'GHS')
ON CONFLICT (key) DO NOTHING;
