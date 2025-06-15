// https://nitro.unjs.io/config
export default defineNitroConfig({
  compatibilityDate: '2025-01-15',
  srcDir: 'server',
  errorHandler: '~/error',
  experimental: {
    openAPI: true,
  },
  openAPI: {
    meta: {
      title: 'Brutoneto API',
      description: 'Croatian salary calculations API for bruto/neto conversions',
      version: '1.0.0',
    },
    ui: {
      scalar: { route: '/_scalar' },
      swagger: { route: '/_swagger' },
    },
  },
  output: {
    dir: '../../.vercel/output',
  },
})
