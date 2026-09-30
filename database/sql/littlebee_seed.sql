-- =====================================================================
-- LittleBee — starter data (system settings + payment gateways).
-- Run this AFTER littlebee_schema.sql has been imported successfully.
--
-- Does NOT include an admin user — password hashing (scrypt) needs
-- Node's hashing library, which isn't practical to hand-write in SQL.
-- Instead: register a normal account once the backend is running, then
-- run the single UPDATE at the bottom of this file to promote it.
-- =====================================================================

INSERT INTO `system_settings` (`key`, `value`, `created_at`, `updated_at`) VALUES
  ('site_name', 'LittleBee', NOW(), NOW()),
  ('maintenance_mode', 'false', NOW(), NOW()),
  ('allow_registrations', 'true', NOW(), NOW()),
  ('default_demo_balance', '10000', NOW(), NOW()),
  ('coinremitter_auto_withdraw_enabled', 'false', NOW(), NOW()),
  ('kyc_required_for_withdrawal', 'true', NOW(), NOW()),
  ('support_email', 'support@littlebee.io', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

INSERT INTO `payment_gateways`
  (`name`, `type`, `coin_symbol`, `min_deposit`, `deposit_fee_percentage`, `withdrawal_fee_percentage`, `is_active`, `created_at`, `updated_at`)
VALUES
  ('Coinremitter BTC', 'crypto', 'BTC', 0.0005, 0, 0.5, 1, NOW(), NOW()),
  ('Coinremitter ETH', 'crypto', 'ETH', 0.01, 0, 0.5, 1, NOW(), NOW()),
  ('Coinremitter USDT-TRC20', 'crypto', 'USDT', 10, 0, 1, 1, NOW(), NOW()),
  ('Bank Wire', 'fiat', NULL, 100, 0, 1.5, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `is_active` = VALUES(`is_active`);


-- =====================================================================
-- Promote an existing user to admin — run this yourself, once, AFTER:
--   1. The backend is running (npm run dev)
--   2. You've registered a normal account through the app/API with the
--      email you want to use as your admin login
-- Then uncomment and run just this one line:
-- =====================================================================
-- UPDATE `users` SET `role` = 'admin', `is_verified` = 1 WHERE `email` = 'you@example.com';
