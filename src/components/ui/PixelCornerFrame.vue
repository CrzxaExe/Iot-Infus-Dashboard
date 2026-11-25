<script setup lang="ts">
withDefaults(defineProps<{ critical?: boolean; dark?: boolean; class?: string }>(), { critical: false, dark: false, class: '' })
</script>
<template>
  <div class="relative rounded-[10px] border border-[#C6DED6]/65 shadow-[0_2px_12px_rgba(0,20,18,0.04)]" :class="[$props.dark ? 'bg-secondary text-on-secondary' : 'bg-surface', $props.class]">
    <template v-if="critical">
      <span class="l-corner-pulse pointer-events-none absolute -left-px -top-px h-3.5 w-3.5 rounded-tl-[10px] border-l-2 border-t-2" />
      <span class="l-corner-pulse pointer-events-none absolute -right-px -top-px h-3.5 w-3.5 rounded-tr-[10px] border-r-2 border-t-2" />
      <span class="l-corner-pulse pointer-events-none absolute -bottom-px -left-px h-3.5 w-3.5 rounded-bl-[10px] border-b-2 border-l-2" />
      <span class="l-corner-pulse pointer-events-none absolute -bottom-px -right-px h-3.5 w-3.5 rounded-br-[10px] border-b-2 border-r-2" />
    </template>
    <slot />
  </div>
</template>
