/**
 * postinstall — plain JS, no TS loader needed for this one. Creates .env
 * from .env.example on first install and fills in the two secrets nothing
 * else can reasonably default: APP_KEY (always) and DEFAULT_ADMIN_PASSWORD
 * (only if you haven't set one), so `npm run db:setup` has everything it
 * needs without you hand-editing .env first.
 *
 * Never overwrites an existing .env or a value you've already set.
 */
import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const envPath = join(root, '.env')
const examplePath = join(root, '.env.example')

if (!existsSync(envPath)) {
  copyFileSync(examplePath, envPath)
  console.log('Created .env from .env.example')
}

let contents = readFileSync(envPath, 'utf-8')
let changed = false

function setIfBlank(key, valueFn) {
  const re = new RegExp(`^${key}=\\s*$`, 'm')
  if (re.test(contents)) {
    const value = valueFn()
    contents = contents.replace(re, `${key}=${value}`)
    changed = true
    return value
  }
  return null
}

setIfBlank('APP_KEY', () => randomBytes(32).toString('base64'))

const generatedAdminPassword = setIfBlank('DEFAULT_ADMIN_PASSWORD', () => randomBytes(12).toString('base64url'))

if (changed) {
  writeFileSync(envPath, contents)
  console.log('Filled in missing secrets in .env (APP_KEY, and DEFAULT_ADMIN_PASSWORD if it was blank)')
}

if (generatedAdminPassword) {
  console.log('')
  console.log('─────────────────────────────────────────────────────────')
  console.log(' Generated an admin password since DEFAULT_ADMIN_PASSWORD')
  console.log(' was blank. `npm run db:setup` will create this account:')
  console.log('')
  console.log(`   email:    (see DEFAULT_ADMIN_EMAIL in .env)`)
  console.log(`   password: ${generatedAdminPassword}`)
  console.log('')
  console.log(' Copy this down now — it is only printed once. Change it')
  console.log(' any time by editing DEFAULT_ADMIN_PASSWORD in .env before')
  console.log(' running db:setup, or from the app after logging in.')
  console.log('─────────────────────────────────────────────────────────')
}

console.log('')
console.log('Next: fill in DB_HOST / DB_USER / DB_PASSWORD / DB_DATABASE in .env')
console.log('if the defaults do not match your MySQL setup, then run: npm run db:setup')
