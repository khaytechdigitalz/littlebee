import { defineConfig, drivers } from '@adonisjs/core/hash'
import type { InferHashers } from '@adonisjs/core/types'

const hashConfig = defineConfig({
  default: 'scrypt',
  list: {
    // Matches what User model's AuthFinder mixin (hash.use('scrypt')) and
    // AuthController (changePassword, verifyPin) both rely on — and what
    // scripts/db-setup.ts's standalone `new Scrypt({})` call produces, so
    // passwords hashed at setup time verify correctly through the app's
    // normal login flow.
    scrypt: drivers.scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    }),
  },
})

export default hashConfig

declare module '@adonisjs/core/types' {
  export interface HashersList extends InferHashers<typeof hashConfig> {}
}
