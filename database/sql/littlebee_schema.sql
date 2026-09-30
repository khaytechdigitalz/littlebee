-- =====================================================================
-- LittleBee — full MySQL schema, generated from database/migrations/*.
-- Import this directly (phpMyAdmin "Import", or `mysql -u USER -p DB <
-- littlebee_schema.sql`) if `node ace migration:run` isn't working for you.
--
-- Safe to run on an EMPTY database only — it does not drop existing
-- tables. If you need to re-run it, drop the tables first (see the
-- commented DROP block at the very bottom).
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(254) NOT NULL,
  `password_hash` VARCHAR(180) NOT NULL,
  `country` VARCHAR(100) NULL,
  `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  `account_type` ENUM('demo','live') NOT NULL DEFAULT 'demo',
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `transaction_pin_hash` VARCHAR(180) NULL,
  `two_factor_secret` VARCHAR(100) NULL,
  `is_2fa_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `is_suspended` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_index` (`role`),
  KEY `users_is_suspended_index` (`is_suspended`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- auth_access_tokens  (bearer tokens issued by @adonisjs/auth)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `auth_access_tokens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_id` INT UNSIGNED NOT NULL,
  `type` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NULL,
  `hash` VARCHAR(255) NOT NULL,
  `abilities` TEXT NOT NULL,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  `last_used_at` TIMESTAMP NULL,
  `expires_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  KEY `auth_access_tokens_tokenable_id_index` (`tokenable_id`),
  CONSTRAINT `auth_access_tokens_tokenable_id_foreign`
    FOREIGN KEY (`tokenable_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- wallets
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `mode` ENUM('demo','live') NOT NULL DEFAULT 'demo',
  `currency_code` VARCHAR(12) NOT NULL,
  `address` VARCHAR(191) NULL,
  `qr_code_url` VARCHAR(500) NULL,
  `label` VARCHAR(191) NULL,
  `coinremitter_wallet_id` VARCHAR(191) NULL,
  `balance` DECIMAL(24,8) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wallets_user_mode_currency_unique` (`user_id`,`mode`,`currency_code`),
  KEY `wallets_address_index` (`address`),
  CONSTRAINT `wallets_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- trades
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `trades` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `mode` ENUM('demo','live') NOT NULL DEFAULT 'demo',
  `market_type` ENUM('crypto','stock','forex') NOT NULL,
  `symbol` VARCHAR(32) NOT NULL,
  `trade_type` ENUM('long','short') NOT NULL,
  `order_type` ENUM('market','limit','stop') NOT NULL DEFAULT 'market',
  `entry_price` DECIMAL(18,8) NOT NULL,
  `exit_price` DECIMAL(18,8) NULL,
  `leverage` DECIMAL(6,2) NOT NULL DEFAULT 1,
  `position_size` DECIMAL(18,8) NOT NULL,
  `margin_used` DECIMAL(18,8) NOT NULL,
  `sl_price` DECIMAL(18,8) NULL,
  `tp_price` DECIMAL(18,8) NULL,
  `status` ENUM('open','closed') NOT NULL DEFAULT 'open',
  `close_reason` VARCHAR(20) NULL,
  `pnl` DECIMAL(18,8) NULL,
  `opened_at` TIMESTAMP NOT NULL,
  `closed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `trades_user_mode_status_index` (`user_id`,`mode`,`status`),
  KEY `trades_symbol_status_index` (`symbol`,`status`),
  CONSTRAINT `trades_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- payment_gateways
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_gateways` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `type` ENUM('crypto','fiat') NOT NULL,
  `coin_symbol` VARCHAR(12) NULL,
  `deposit_address_or_iban` VARCHAR(255) NULL,
  `qr_code_url` VARCHAR(500) NULL,
  `instructions` TEXT NULL,
  `min_deposit` DECIMAL(18,8) NOT NULL DEFAULT 0,
  `max_deposit` DECIMAL(18,8) NULL,
  `deposit_fee_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `withdrawal_fee_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payment_gateways_type_is_active_index` (`type`,`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `wallet_id` INT UNSIGNED NOT NULL,
  `gateway_id` INT UNSIGNED NULL,
  `mode` ENUM('demo','live') NOT NULL DEFAULT 'demo',
  `type` ENUM('deposit','withdrawal') NOT NULL,
  `amount` DECIMAL(24,8) NOT NULL,
  `fee` DECIMAL(24,8) NOT NULL DEFAULT 0,
  `blockchain_txid` VARCHAR(191) NULL,
  `payment_proof_url` VARCHAR(500) NULL,
  `destination_address` VARCHAR(255) NULL,
  `status` ENUM('pending','approved','declined','completed') NOT NULL DEFAULT 'pending',
  `admin_note` TEXT NULL,
  `reviewed_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transactions_blockchain_txid_unique` (`blockchain_txid`),
  KEY `transactions_user_type_status_index` (`user_id`,`type`,`status`),
  KEY `transactions_status_index` (`status`),
  CONSTRAINT `transactions_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transactions_wallet_id_foreign`
    FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transactions_gateway_id_foreign`
    FOREIGN KEY (`gateway_id`) REFERENCES `payment_gateways` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transactions_reviewed_by_foreign`
    FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- system_settings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(100) NOT NULL,
  `value` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_settings_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- login_sessions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `login_sessions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `device_type` VARCHAR(100) NULL,
  `location` VARCHAR(150) NULL,
  `is_current` TINYINT(1) NOT NULL DEFAULT 0,
  `revoked` TINYINT(1) NOT NULL DEFAULT 0,
  `last_active` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `login_sessions_user_revoked_index` (`user_id`,`revoked`),
  CONSTRAINT `login_sessions_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- kyc_documents
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kyc_documents` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `tier_level` INT NOT NULL,
  `document_type` VARCHAR(100) NOT NULL,
  `document_url` VARCHAR(500) NOT NULL,
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `rejection_reason` TEXT NULL,
  `reviewed_by` INT UNSIGNED NULL,
  `reviewed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `kyc_documents_user_tier_index` (`user_id`,`tier_level`),
  KEY `kyc_documents_status_index` (`status`),
  CONSTRAINT `kyc_documents_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kyc_documents_reviewed_by_foreign`
    FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- Optional: lets `node ace migration:run` recognize these 9 tables as
-- already migrated, so it won't try to re-create them later if you get
-- the Node environment working again. Safe to skip this block entirely
-- if you're only using this SQL file and not planning to run Adonis
-- migrations against this database.
-- =====================================================================
-- CREATE TABLE IF NOT EXISTS `adonis_schema` (
--   `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
--   `name` VARCHAR(255) NOT NULL,
--   `batch` INT NOT NULL,
--   `migration_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   PRIMARY KEY (`id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
--
-- CREATE TABLE IF NOT EXISTS `adonis_schema_versions` (
--   `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
--   `version` INT NOT NULL,
--   PRIMARY KEY (`id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
--
-- INSERT INTO `adonis_schema_versions` (`version`) VALUES (2);
-- INSERT INTO `adonis_schema` (`name`, `batch`) VALUES
--   ('database/migrations/1_create_users_table', 1),
--   ('database/migrations/2_create_access_tokens_table', 1),
--   ('database/migrations/3_create_wallets_table', 1),
--   ('database/migrations/4_create_trades_table', 1),
--   ('database/migrations/5_create_payment_gateways_table', 1),
--   ('database/migrations/6_create_transactions_table', 1),
--   ('database/migrations/7_create_system_settings_table', 1),
--   ('database/migrations/8_create_login_sessions_table', 1),
--   ('database/migrations/9_create_kyc_documents_table', 1);


-- =====================================================================
-- To wipe and re-import from scratch, run this block first (uncomment):
-- =====================================================================
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS `kyc_documents`, `login_sessions`, `system_settings`,
--   `transactions`, `payment_gateways`, `trades`, `wallets`,
--   `auth_access_tokens`, `users`, `adonis_schema`, `adonis_schema_versions`;
-- SET FOREIGN_KEY_CHECKS = 1;
