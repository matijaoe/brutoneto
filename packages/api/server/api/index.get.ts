export default defineEventHandler((event) => {
  const host = getHeader(event, 'host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'

  return {
    name: 'Brutoneto API',
    version: '1.0.0',
    description: 'Croatian salary calculations API',
    documentation: `${protocol}://${host}/_scalar`,
  }
})
