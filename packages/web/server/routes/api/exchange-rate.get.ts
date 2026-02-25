interface CachedRate {
  rate: number
  timestamp: string
  cachedAt: number
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
let cachedRate: CachedRate | null = null

async function fetchUsdToEurRate(): Promise<{ rate: number, timestamp: string }> {
  const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR')
  if (!res.ok) {
    throw new Error(`Exchange rate API returned ${res.status}`)
  }
  const data = await res.json() as { rates: { EUR: number }, date: string }
  return {
    rate: data.rates.EUR,
    timestamp: data.date,
  }
}

export default defineEventHandler(async () => {
  const now = Date.now()

  if (cachedRate && (now - cachedRate.cachedAt) < CACHE_TTL_MS) {
    return {
      from: 'USD',
      to: 'EUR',
      rate: cachedRate.rate,
      date: cachedRate.timestamp,
    }
  }

  try {
    const { rate, timestamp } = await fetchUsdToEurRate()
    cachedRate = { rate, timestamp, cachedAt: now }
    return {
      from: 'USD',
      to: 'EUR',
      rate,
      date: timestamp,
    }
  }
  catch (error) {
    // If we have a stale cache, use it rather than failing
    if (cachedRate) {
      return {
        from: 'USD',
        to: 'EUR',
        rate: cachedRate.rate,
        date: cachedRate.timestamp,
        stale: true,
      }
    }
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch exchange rate',
    })
  }
})
