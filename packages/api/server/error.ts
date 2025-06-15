import type { H3Error, H3Event } from 'h3'

export default defineNitroErrorHandler((error: H3Error, event: H3Event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  // @ts-ignore
  // eslint-disable-next-line ts/no-unsafe-argument
  setResponseStatus(event, error.cause.status || error.status || 500)

  return send(event, JSON.stringify({
    ...error.cause ?? {},
    fatal: error.fatal,
    unhandled: error.unhandled,
  }))
})