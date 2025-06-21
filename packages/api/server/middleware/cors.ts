export default defineEventHandler(async (event) => {
  // Only handle CORS for API routes
  if (!event.node.req.url?.startsWith('/api')) {
    return
  }

  // Set CORS headers
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  })

  // Handle preflight OPTIONS requests
  if (event.node.req.method === 'OPTIONS') {
    // Send empty response with CORS headers
    event.node.res.statusCode = 204
    event.node.res.end()
  }
})
