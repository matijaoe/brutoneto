import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'packages/api/package.json'), 'utf-8'))

export default defineEventHandler((event) => {
  const host = getHeader(event, 'host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'

  return {
    name: 'Brutoneto API',
    version: packageJson.version,
    description: 'Croatian salary calculations API',
    documentation: `${protocol}://${host}/_scalar`,
  }
})
