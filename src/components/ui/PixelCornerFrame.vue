<script setup lang="ts">
withDefaults(defineProps<{ critical?: boolean; class?: string }>(), { critical: false, class: '' })
</script>
<template>
  <div class="relative border bg-white" :class="[critical ? 'border-error/40' : 'border-outline-variant', $props.class]">
    <template v-if="critical">
      <span class="l-corner-pulse pointer-events-none absolute -left-px -top-px h-3.5 w-3.5 border-l-2 border-t-2 border-error" />
      <span class="l-corner-pulse pointer-events-none absolute -right-px -top-px h-3.5 w-3.5 border-r-2 border-t-2 border-error" />
      <span class="l-corner-pulse pointer-events-none absolute -bottom-px -left-px h-3.5 w-3.5 border-b-2 border-l-2 border-error" />
      <span class="l-corner-pulse pointer-events-none absolute -bottom-px -right-px h-3.5 w-3.5 border-b-2 border-r-2 border-error" />
    </template>
    <slot />
  </div>
</template>
