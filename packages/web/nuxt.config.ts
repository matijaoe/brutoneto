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
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://brutoneto-api.vercel.app',
    },
  },
  
  // Nitro server config for rewrites
  nitro: {
    routeRules: {
      '/api/**': {
        proxy: `${process.env.NUXT_PUBLIC_API_BASE_URL || 'https://brutoneto-api.vercel.app'}/**`,
      },
    },
  },
})
