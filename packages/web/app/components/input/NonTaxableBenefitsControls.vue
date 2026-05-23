<script setup lang="ts">
import type { MealMode } from '@brutoneto/core'
import { NON_TAXABLE_BENEFIT_LIMITS_2026 } from '@brutoneto/core'
import { formatEur } from '~/utils/formatters'

const props = defineProps<{
  prigodneNagrade: boolean
  nagradaZaRezultate: boolean
  prehrana: MealMode
  radOdKuce: boolean
  odmorRadnika: boolean
  dopunskoZdravstveno: boolean
  treciStup: boolean
  hasAny: boolean
}>()

const emit = defineEmits<{
  'update:prigodneNagrade': [value: boolean]
  'update:nagradaZaRezultate': [value: boolean]
  'update:prehrana': [value: MealMode]
  'update:radOdKuce': [value: boolean]
  'update:odmorRadnika': [value: boolean]
  'update:dopunskoZdravstveno': [value: boolean]
  'update:treciStup': [value: boolean]
  'reset': []
}>()

// Prevents SSR hydration mismatch on useSessionStorage-backed state
const hasMounted = ref(false)
onMounted(() => { hasMounted.value = true })

const L = NON_TAXABLE_BENEFIT_LIMITS_2026

const open = useSessionStorage<boolean>('doo-benefits-open', false)

const mealOptions: Array<{ label: string, value: MealMode, max?: number }> = [
  { label: 'Off', value: 'off' },
  { label: `Paušal · ${formatEur(L.prehranaPausal.monthly)}`, value: 'pausal', max: L.prehranaPausal.monthly },
  { label: `Računi · ${formatEur(L.prehranaRacuni.monthly)}`, value: 'racuni', max: L.prehranaRacuni.monthly },
]

type ToggleKey = 'prigodneNagrade' | 'nagradaZaRezultate' | 'radOdKuce' | 'odmorRadnika' | 'dopunskoZdravstveno' | 'treciStup'
type Toggle = {
  key: ToggleKey
  label: string
  max: number
  hint?: string
  requirement?: string
  asset?: boolean
}

const toggles = computed<Toggle[]>(() => [
  { key: 'prigodneNagrade', label: L.prigodneNagrade.label, max: L.prigodneNagrade.monthly, hint: 'božićnica + regres + uskrsnica', requirement: L.prigodneNagrade.requirement },
  { key: 'nagradaZaRezultate', label: L.nagradaZaRezultate.label, max: L.nagradaZaRezultate.monthly, requirement: L.nagradaZaRezultate.requirement },
  { key: 'radOdKuce', label: L.radOdKuce.label, max: L.radOdKuce.monthly, requirement: L.radOdKuce.requirement },
  { key: 'odmorRadnika', label: L.odmorRadnika.label, max: L.odmorRadnika.monthly, requirement: L.odmorRadnika.requirement },
  { key: 'dopunskoZdravstveno', label: L.dopunskoZdravstveno.label, max: L.dopunskoZdravstveno.monthly, hint: 'polica, ne keš', requirement: L.dopunskoZdravstveno.requirement, asset: true },
  { key: 'treciStup', label: L.treciStup.label, max: L.treciStup.monthly, hint: 'mirovinska štednja, ne keš', requirement: L.treciStup.requirement, asset: true },
])

function getValue(key: ToggleKey): boolean {
  switch (key) {
    case 'prigodneNagrade': return props.prigodneNagrade
    case 'nagradaZaRezultate': return props.nagradaZaRezultate
    case 'radOdKuce': return props.radOdKuce
    case 'odmorRadnika': return props.odmorRadnika
    case 'dopunskoZdravstveno': return props.dopunskoZdravstveno
    case 'treciStup': return props.treciStup
  }
}

function setValue(key: ToggleKey, value: boolean) {
  switch (key) {
    case 'prigodneNagrade': return emit('update:prigodneNagrade', value)
    case 'nagradaZaRezultate': return emit('update:nagradaZaRezultate', value)
    case 'radOdKuce': return emit('update:radOdKuce', value)
    case 'odmorRadnika': return emit('update:odmorRadnika', value)
    case 'dopunskoZdravstveno': return emit('update:dopunskoZdravstveno', value)
    case 'treciStup': return emit('update:treciStup', value)
  }
}
</script>

<template>
  <UCollapsible v-model:open="open">
    <button
      type="button"
      class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-default hover:border-accented cursor-pointer transition-colors"
    >
      <div class="flex items-center gap-2">
        <span class="text-[10px]" :class="open ? 'rotate-90' : ''" style="display:inline-block;transition:transform 0.15s">&#x25B8;</span>
        <span class="text-sm font-unifontex uppercase tracking-wider text-foreground">
          Neoporezivi primici
        </span>
        <span
          v-if="hasMounted && hasAny"
          class="text-xs font-unifontex text-primary px-2 py-0.5 rounded-full bg-primary/10"
        >
          on
        </span>
      </div>
      <span class="text-xs text-dimmed">2026</span>
    </button>

    <template #content>
      <div class="mt-3 flex flex-col gap-3 px-1">
        <!-- Prehrana (three-state) -->
        <UFormField
          label="Prehrana"
          :ui="{ label: 'text-sm text-dimmed' }"
          help="Paušal i računi se međusobno isključuju"
        >
          <div class="flex w-full">
            <button
              v-for="(opt, i) in mealOptions"
              :key="opt.value"
              type="button"
              class="flex-1 px-2 py-2 text-xs sm:text-sm border cursor-pointer transition-colors"
              :class="[
                hasMounted && prehrana === opt.value
                  ? 'z-10 border-primary bg-primary/10 text-primary font-medium'
                  : 'border-muted text-dimmed hover:text-foreground hover:border-accented',
                i === 0 ? 'rounded-l-md' : '-ml-px',
                i === mealOptions.length - 1 ? 'rounded-r-md' : '',
              ]"
              @click="emit('update:prehrana', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </UFormField>

        <!-- Boolean toggles -->
        <div class="grid sm:grid-cols-2 gap-2">
          <button
            v-for="t in toggles"
            :key="t.key"
            type="button"
            class="flex flex-col gap-0.5 text-left p-3 rounded-md border cursor-pointer transition-colors"
            :class="[
              hasMounted && getValue(t.key)
                ? 'border-primary bg-primary/5'
                : 'border-default hover:border-accented',
            ]"
            :title="t.requirement"
            @click="setValue(t.key, !getValue(t.key))"
          >
            <div class="flex items-center justify-between gap-2">
              <span
                class="text-sm font-medium"
                :class="hasMounted && getValue(t.key) ? 'text-primary' : 'text-foreground'"
              >
                {{ t.label }}
              </span>
              <span class="text-xs text-dimmed tabular-nums">
                max {{ formatEur(t.max) }}/mj
              </span>
            </div>
            <span v-if="t.hint" class="text-xs text-dimmed">
              {{ t.hint }}
            </span>
          </button>
        </div>

        <div v-if="hasMounted && hasAny" class="flex justify-end">
          <button
            type="button"
            class="text-xs text-dimmed hover:text-foreground cursor-pointer"
            @click="emit('reset')"
          >
            Reset
          </button>
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
