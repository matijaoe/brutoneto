import type { H3Error } from 'h3'

export default defineEventHandler((event) => {
  // TODO: use real type
  const error = event.context.error as H3Error & { data?: Record<string, any>, cause: { status?: number, message?: string }, status?: number }

  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseStatus(event, error?.cause?.status || error?.status || 500)

  return {
    error: true,
    url: event.path,
    statusCode: error?.cause?.status || error?.status || 500,
    statusMessage: error?.statusMessage || error?.message || 'Internal Server Error',
    message: error?.cause?.message || error?.message || 'An error occurred',
    ...(error?.data || {}),
  }
})
