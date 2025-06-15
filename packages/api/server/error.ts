import type { H3Error, H3Event } from 'h3'

export default defineNitroErrorHandler((error: H3Error, event: H3Event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseStatus(event, (error.cause as any).status || (error as any).status || 500)

  return send(event, JSON.stringify({
    ...(error.cause as any) ?? {},
    fatal: (error as any).fatal,
    unhandled: (error as any).unhandled,
  }))
})
