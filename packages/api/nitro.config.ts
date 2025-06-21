// https://nitro.unjs.io/config
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const packageJsonPath = join(process.cwd(), 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

export default defineNitroConfig({
  compatibilityDate: '2025-01-15',
  srcDir: 'server',
  errorHandler: '~/error',
  devServer: {
    port: 4000,
  },
  experimental: {
    openAPI: true,
  },
  openAPI: {
    meta: {
      title: 'Brutoneto API',
      description: 'Croatian salary calculations API for bruto/neto conversions',
      version: packageJson.version,
    },
    ui: {
      scalar: { route: '/_scalar' },
      swagger: { route: '/_swagger' },
    },
  },
  output: {
    dir: '../../.vercel/output',
  },
})
