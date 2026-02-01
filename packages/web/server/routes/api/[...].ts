import { withRelatedProject } from '@vercel/related-projects'

const apiHost = withRelatedProject({
  projectName: 'brutoneto-api',
  defaultHost: process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : 'https://brutoneto-api.vercel.app',
})

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, '_') || ''
  const query = getQuery(event)
  const queryString = new URLSearchParams(query as Record<string, string>).toString()
  const targetUrl = `${apiHost}/api/${path}${queryString ? `?${queryString}` : ''}`
  
  return proxyRequest(event, targetUrl)
})
