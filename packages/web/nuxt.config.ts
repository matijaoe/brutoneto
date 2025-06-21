import process from 'node:process'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/icon', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:4000',
    },
  },
  ui: {
    colorMode: false,
  },
})
