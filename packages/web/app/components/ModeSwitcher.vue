<script setup lang="ts">
type Mode = 'gross-to-net' | 'net-to-gross' | 'doo'

type Props = {
  mode: Mode
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:mode': [value: Mode]
}>()

const isActiveMode = (value: Mode) => props.mode === value
const arrowIcon = computed(() =>
  isActiveMode('gross-to-net') ? 'mdi:arrow-right' : 'mdi:arrow-left',
)

const setMode = (value: Mode) => emit('update:mode', value)
const toggleMode = () =>
  setMode(isActiveMode('net-to-gross') ? 'gross-to-net' : 'net-to-gross')
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2 px-2 py-2 -ml-2">
      <UTooltip
        text="Calculate gross (net → gross)"
        :content="{ side: 'top' }"
      >
        <button type="button" @click="setMode('net-to-gross')">
          <span
            class="text-2xl sm:text-lg uppercase tracking-wide font-unifontex font-bold"
            :class="isActiveMode('net-to-gross') ? 'text-foreground' : 'text-muted'"
          >
            Gross
          </span>
        </button>
      </UTooltip>
      <UTooltip
        text="Switch mode"
        :content="{ side: 'top' }"
      >
        <UButton
          color="primary"
          variant="link"
          size="xl"
          :icon="arrowIcon"
          class="scale-110 sm:scale-100"
          @click="toggleMode"
        />
      </UTooltip>
      <UTooltip
        text="Calculate net (gross → net)"
        :content="{ side: 'top' }"
      >
        <button type="button" @click="setMode('gross-to-net')">
          <span
            class="text-2xl sm:text-lg uppercase tracking-wide font-unifontex font-bold"
            :class="isActiveMode('gross-to-net') ? 'text-foreground' : 'text-muted'"
          >
            Net
          </span>
        </button>
      </UTooltip>

      <span class="text-muted mx-1">|</span>

      <UTooltip
        text="d.o.o. salary + dividend calculator"
        :content="{ side: 'top' }"
      >
        <button type="button" @click="setMode('doo')">
          <span
            class="text-2xl sm:text-lg uppercase tracking-wide font-unifontex font-bold"
            :class="isActiveMode('doo') ? 'text-foreground' : 'text-muted'"
          >
            d.o.o.
          </span>
        </button>
      </UTooltip>
    </div>
  </div>
</template>
