<script lang="ts" setup>
import type { PlacesTaxesResponse } from '~/types/api'

const config = useRuntimeConfig()

const { data, pending } = await useLazyFetch<PlacesTaxesResponse>('/api/taxes', {
  baseURL: config.public.apiUrl,
})

const searchQuery = ref('')

// Normalize only the search query, not the place names
const normalizeQuery = (text: string) => text
  .toLowerCase()
  .replace(/[čć]/g, 'c')
  .replace(/š/g, 's')
  .replace(/ž/g, 'z')
  .replace(/đ/g, 'd')
  .replace(/[^a-z\s]/gi, '')

const places = computed(() => {
  if (!data.value?.places) {
    return []
  }

  const allPlaces = data.value.places

  if (!searchQuery.value.trim()) {
    return allPlaces
  }

  const query = searchQuery.value.trim().toLowerCase()

  return allPlaces.filter((place) => {
    const placeName = place.name.toLowerCase()

    // If query contains Croatian characters, only do exact match
    if (/[čćšžđ]/.test(query)) {
      return placeName.includes(query)
    }

    // If query contains only regular characters, check both:
    // 1. Original place name contains query (exact match)
    // 2. Normalized place name contains query (Croatian chars → regular chars)
    const normalizedPlaceName = normalizeQuery(placeName)
    return placeName.includes(query) || normalizedPlaceName.includes(query)
  })
})

const metadata = computed(() => data.value?.metadata)
const filteredCount = computed(() => places.value.length)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold">
        Porezi po općinama
      </h1>
      <UBadge v-if="metadata" variant="soft">
        {{ filteredCount }} / {{ metadata.totalPlaces }} places
      </UBadge>
    </div>

    <UCard>
      <UInput
        v-model="searchQuery"
        type="search"
        class="w-full"
        placeholder="Pretraži općine (npr. Zagreb, Split, Rijeka)"
        icon="i-heroicons-magnifying-glass"
        size="lg"
      />
    </UCard>

    <UCard v-if="metadata">
      <template #header>
        <h2 class="text-lg font-semibold">
          Database Info
        </h2>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span class="text-gray-500">Total Places:</span>
          <p class="font-medium">
            {{ metadata.totalPlaces }}
          </p>
        </div>
        <div>
          <span class="text-gray-500">Last Updated:</span>
          <p class="font-medium">
            {{ metadata.lastUpdated }}
          </p>
        </div>
        <div>
          <span class="text-gray-500">Source:</span>
          <ULink :href="metadata.sourceUrl" class="block" target="_blank">
            {{ metadata.sourceUrl }}
          </ULink>
        </div>
      </div>
    </UCard>

    <div v-if="pending" class="flex justify-center p-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <UCard v-for="place in places" :key="place.key" class="hover:shadow-lg transition-shadow">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="font-semibold text-base">
              {{ place.name }}
            </h3>
            <UBadge
              :color="place.taxRateHigh > 0.30 ? 'error' : place.taxRateHigh > 0.25 ? 'warning' : 'success'"
              variant="soft"
              size="sm"
            >
              +{{ Math.round((place.taxRateHigh - 0.30) * 100) }}%
            </UBadge>
          </div>
        </template>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm text-gray-500">
              Niža stopa:
            </p>
            <UBadge color="secondary" variant="soft" size="sm">
              {{ (place.taxRateLow * 100).toFixed(0) }}%
            </UBadge>
          </div>

          <div class="flex items-center justify-between gap-2">
            <p class="text-sm text-gray-500">
              Viša stopa:
            </p>
            <UBadge color="info" variant="soft" size="sm">
              {{ (place.taxRateHigh * 100).toFixed(0) }}%
            </UBadge>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
