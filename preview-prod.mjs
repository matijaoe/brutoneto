#!/usr/bin/env node

/**
 * Production Preview Proxy
 * Simulates Vercel's routing locally
 *
 * Run AFTER building:
 *   pnpm run build
 *   node preview-proxy.mjs
 *
 * Then open: http://localhost:8080
 */

import http from 'node:http'
import { spawn } from 'node:child_process'
import process from 'node:process'

const PROXY_PORT = 8080
const API_PORT = 4001
const WEB_PORT = 3001

let apiServer = null
let webServer = null

// Start API server
console.log('🚀 Starting API server...')
apiServer = spawn('node', ['packages/api/.output/server/index.mjs'], {
  env: { ...process.env, PORT: API_PORT },
  stdio: 'pipe',
})

apiServer.stdout.on('data', (data) => {
  console.log(`[API] ${data.toString().trim()}`)
})

apiServer.stderr.on('data', (data) => {
  console.error(`[API ERROR] ${data.toString().trim()}`)
})

// Start Web server
console.log('🚀 Starting Web server...')
webServer = spawn('node', ['packages/web/.output/server/index.mjs'], {
  env: { ...process.env, PORT: WEB_PORT, HOST: '0.0.0.0' },
  stdio: 'pipe',
})

webServer.stdout.on('data', (data) => {
  console.log(`[WEB] ${data.toString().trim()}`)
})

webServer.stderr.on('data', (data) => {
  console.error(`[WEB ERROR] ${data.toString().trim()}`)
})

// Wait for servers to start
setTimeout(() => {
  // Create proxy server
  const proxy = http.createServer(async (req, res) => {
    const url = req.url || '/'

    // Route /api/* to API server
    if (url.startsWith('/api')) {
      const options = {
        hostname: 'localhost',
        port: API_PORT,
        path: url,
        method: req.method,
        headers: req.headers,
      }

      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
        proxyRes.pipe(res)
      })

      proxyReq.on('error', (err) => {
        console.error('[PROXY] API error:', err.message)
        res.writeHead(502)
        res.end('API server unavailable')
      })

      req.pipe(proxyReq)
    }
    // Route everything else to Web server
    else {
      const options = {
        hostname: 'localhost',
        port: WEB_PORT,
        path: url,
        method: req.method,
        headers: req.headers,
      }

      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
        proxyRes.pipe(res)
      })

      proxyReq.on('error', (err) => {
        console.error('[PROXY] Web error:', err.message)
        res.writeHead(502)
        res.end('Web server unavailable')
      })

      req.pipe(proxyReq)
    }
  })

  proxy.listen(PROXY_PORT, () => {
    console.log(`\n${'='.repeat(60)}`)
    console.log('✨ Production Preview Running (Vercel Simulation)')
    console.log('='.repeat(60))
    console.log(`\n  🌐 Main:    http://localhost:${PROXY_PORT}`)
    console.log(`  📡 API:     http://localhost:${PROXY_PORT}/api`)
    console.log(`  🏠 Web:     http://localhost:${PROXY_PORT}`)
    console.log(`\n${'='.repeat(60)}`)
    console.log(`  API Server: http://localhost:${API_PORT} (internal)`)
    console.log(`  Web Server: http://localhost:${WEB_PORT} (internal)`)
    console.log(`${'='.repeat(60)}\n`)
    console.log('Press Ctrl+C to stop all servers\n')
  })
}, 2000)

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down servers...')
  if (apiServer) {
    apiServer.kill()
  }
  if (webServer) {
    webServer.kill()
  }
  process.exit(0)
})

process.on('SIGTERM', () => {
  if (apiServer) {
    apiServer.kill()
  }
  if (webServer) {
    webServer.kill()
  }
  process.exit(0)
})
