import { defineConfig } from '@adonisjs/static'

/** Serves public/uploads/* (KYC docs, payment receipts) and anything else in public/. */
const staticConfig = defineConfig({
  enabled: true,
  etag: true,
  lastModified: true,
  dotFiles: 'ignore',
})

export default staticConfig
