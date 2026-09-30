/**
 * npm run db:setup — replaces `node ace migration:run && node ace db:seed`.
 *
 * Run via `tsx scripts/db-setup.ts` (see package.json). Deliberately does
 * NOT boot AdonisJS's Ignitor/ace at all — it talks to MySQL directly via
 * mysql2 and hashes the admin password with AdonisJS's own Scrypt driver
 * (imported standalone, not through the app), so the app's own login flow
 * can verify it later. This sidesteps the ace command-loading machinery
 * entirely, which is where `generate:key` failed.
 *
 * Safe to re-run: tables use CREATE TABLE IF NOT EXISTS, settings/gateways
 * upsert, and the admin user is only created if it doesn't already exist.
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import mysql from 'mysql2/promise'
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

function loadEnv(): Record<string, string> {
  const envPath = join(root, '.env')
  if (!existsSync(envPath)) {
    console.error('No .env found. Run `npm install` first (it creates one via postinstall).')
    process.exit(1)
  }
  const env: Record<string, string> = {}
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

async function run() {
  const env = loadEnv()
  const host = env.DB_HOST || '127.0.0.1'
  const port = Number(env.DB_PORT || 3306)
  const user = env.DB_USER || 'littlebee'
  const password = env.DB_PASSWORD || ''
  const database = env.DB_DATABASE || 'littlebee'

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`)

  // 1. Connect without selecting a database yet, and create it if missing.
  const root_conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true }).catch((err) => {
    console.error(`Could not connect to MySQL: ${err.message}`)
    console.error('Check DB_HOST / DB_PORT / DB_USER / DB_PASSWORD in .env, and that MySQL is running.')
    process.exit(1)
  })
  await root_conn!.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4`)
  await root_conn!.end()
  console.log(`Database "${database}" ready.`)

  // 2. Reconnect with that database selected, and run the schema + seed SQL.
  const conn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: true })

  const schemaSql = readFileSync(join(root, 'database/sql/littlebee_schema.sql'), 'utf-8')
  await conn.query(schemaSql)
  console.log('Schema applied (9 tables).')

  const seedSql = readFileSync(join(root, 'database/sql/littlebee_seed.sql'), 'utf-8')
  // The seed file's own admin-promotion line is commented out (SQL can't hash
  // passwords) — strip any leftover -- comment lines before executing the rest.
  const seedStatements = seedSql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
  await conn.query(seedStatements)
  console.log('Starter settings and payment gateways seeded.')

  // 3. Create the default admin, if configured and not already present.
  const adminEmail = env.DEFAULT_ADMIN_EMAIL || 'admin@littlebee.io'
  const adminPassword = env.DEFAULT_ADMIN_PASSWORD

  if (!adminPassword) {
    console.log('DEFAULT_ADMIN_PASSWORD is blank in .env — skipping admin creation.')
  } else {
    const [existing] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [adminEmail])
    if (Array.isArray(existing) && existing.length > 0) {
      console.log(`Admin ${adminEmail} already exists — leaving it as-is.`)
    } else {
      const passwordHash = await new Scrypt({}).make(adminPassword)
      const [result] = await conn.query(
        `INSERT INTO users (full_name, email, password_hash, role, account_type, is_verified, created_at, updated_at)
         VALUES (?, ?, ?, 'admin', 'live', 1, NOW(), NOW())`,
        ['LittleBee Admin', adminEmail, passwordHash],
      )
      const adminId = (result as mysql.ResultSetHeader).insertId

      // Match WalletService#provisionDefaultWallets: a demo and a live USD wallet.
      await conn.query(
        `INSERT INTO wallets (user_id, mode, currency_code, balance, is_active, created_at, updated_at) VALUES
         (?, 'demo', 'USD', 10000, 1, NOW(), NOW()),
         (?, 'live', 'USD', 0, 1, NOW(), NOW())`,
        [adminId, adminId],
      )
      console.log(`Created admin: ${adminEmail}`)
    }
  }

  await conn.end()
  console.log('')
  console.log('Database setup complete. Run `npm run dev` to start the app.')
}

run().catch((err) => {
  console.error('db:setup failed:', err.message)
  process.exit(1)
})
