<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string
  label: string
  placeholder?: string
  currencyIcon: string
  isNonEur: boolean
  currency: string
  isLoading: boolean
  autofocus?: boolean
}>(), {
  placeholder: '',
  autofocus: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': []
  'toggle-currency': []
  'blur': []
}>()

const inputRef = ref<{ $el: HTMLElement } | null>(null)

const getInputEl = () =>
  inputRef.value?.$el?.querySelector?.('input') as HTMLInputElement | null

const blurInput = () => getInputEl()?.blur()
const focusInput = () => getInputEl()?.focus()

defineExpose({ blurInput, focusInput })
</script>

<template>
  <form @submit.prevent="emit('submit')">
    <UFormField
      :label="label"
      :ui="{ label: 'text-sm text-dimmed' }"
    >
      <UInput
        ref="inputRef"
        :model-value="modelValue"
        type="number"
        :placeholder="placeholder"
        size="lg"
        class="w-full"
        :ui="{ trailing: 'pe-1!' }"
        :autofocus="autofocus"
        @update:model-value="emit('update:modelValue', $event as string)"
        @blur="emit('blur')"
      >
        <template #leading>
          <UTooltip text="Switch input currency. Output is always in EUR.">
            <button
              type="button"
              aria-label="Switch input currency"
              class="flex items-center cursor-pointer"
              @click="emit('toggle-currency')"
            >
              <UIcon
                :name="currencyIcon"
                class="size-5 text-dimmed"
              />
            </button>
          </UTooltip>
        </template>
        <template #trailing>
          <UButton
            color="primary"
            variant="link"
            size="lg"
            icon="mdi:send"
            type="submit"
            aria-label="Calculate"
            :loading="isLoading"
          />
        </template>
      </UInput>
      <p v-if="isNonEur" class="text-xs text-dimmed mt-1">
        Input in {{ currency }} — results will be converted to EUR
      </p>
    </UFormField>
  </form>
</template>
