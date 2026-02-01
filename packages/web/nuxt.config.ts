// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/test-utils',
    '@vueuse/nuxt',
    '@nuxt/ui',
  ],
  css: ['~/assets/css/main.css'],

  // API URL configuration for different environments
  runtimeConfig: {
    public: {
      // In dev: http://localhost:4000, In prod: must be set via NUXT_PUBLIC_API_BASE_URL env var
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : ''),
    },
  },

  // Nitro server config for API proxy (only if env var is set)
  nitro: process.env.NUXT_PUBLIC_API_BASE_URL
    ? {
        routeRules: {
          '/api/**': {
            proxy: `${process.env.NUXT_PUBLIC_API_BASE_URL}/**`,
          },
        },
      }
    : {},
})
