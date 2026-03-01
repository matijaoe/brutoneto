<template>
  <!-- Desktop: sticky sidebar -->
  <aside
    class="hidden lg:block shrink-0 w-[420px] sticky top-6 self-start overflow-y-auto"
    :style="{ maxHeight: 'calc(100vh - 3rem)' }"
  >
    <div class="pr-6">
      <slot />
    </div>
  </aside>

  <!-- Mobile: top section -->
  <div class="lg:hidden py-1">
    <slot />
  </div>
</template>
