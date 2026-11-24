<script setup lang="ts">
import type { BadgeStatus } from '@/types/infusion'
import { computed } from 'vue'
const props = defineProps<{ status: BadgeStatus }>()
const map: Record<BadgeStatus, { label: string; classes: string }> = {
  normal: { label: 'Normal', classes: 'border-primary bg-primary text-white' },
  warning: { label: 'Warning', classes: 'border-warning bg-warning-container text-on-warning-container' },
  critical: { label: 'Kritis', classes: 'border-error bg-error text-white' },
  running: { label: 'Sedang Berjalan', classes: 'border-primary bg-primary text-white' },
  ready: { label: 'Terpasang', classes: 'border-info bg-info-container text-on-info-container' },
  done: { label: 'Selesai', classes: 'border-outline-variant bg-secondary-container text-on-surface' },
}
const config = computed(() => map[props.status])
</script>
<template><span class="inline-flex items-center gap-2 border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" :class="config.classes"><span class="h-1.5 w-1.5 bg-current" />{{ config.label }}</span></template>
