import { getDefaultTax } from '@brutoneto/core'

export default defineEventHandler(() => {
  // eslint-disable-next-line ts/no-unsafe-return, ts/no-unsafe-call
  return getDefaultTax()
})