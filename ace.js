/*
|--------------------------------------------------------------------------
| JavaScript entrypoint for running ace commands
|--------------------------------------------------------------------------
|
| Not part of the normal setup flow anymore (see package.json scripts and
| README — db:setup/dev/start all run their TypeScript entry files directly
| via `tsx`, bypassing ace's command-loading machinery entirely, since that
| machinery is what threw `loaderInstance.getMetaData is not a function` on
| Node 24 with the previous loader). Kept working for one-off `node ace
| <command>` use (e.g. `node ace make:controller`) via tsx's loader instead.
|
*/
import { register } from 'tsx/esm/api'

register()

await import('./bin/console.ts')
