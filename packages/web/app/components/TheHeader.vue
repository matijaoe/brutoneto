<script setup lang="ts">
const { $config } = useNuxtApp()
const { apiUrl } = $config.public
</script>

<template>
  <header>
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-bold">
            Brutoneto
          </h1>
          <UBadge color="warning" variant="outline">
            beta
          </UBadge>
        </div>

        <nav class="hidden md:flex space-x-8">
          <ULink to="/">
            Calculator
          </ULink>
          <ULink to="/places">
            Places
          </ULink>
          <ULink external :href="`${apiUrl}/_scalar`" target="_blank">
            API
          </ULink>
        </nav>
      </div>
    </div>
  </header>
</template>
