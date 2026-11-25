<script setup lang="ts">
import type { BadgeStatus } from '@/types/infusion'
import { computed } from 'vue'
const props = defineProps<{ status: BadgeStatus }>()
const map: Record<BadgeStatus, { label: string; classes: string }> = {
  normal: { label: 'Normal', classes: 'border-primary bg-primary text-on-primary' },
  warning: { label: 'Warning', classes: 'border-secondary-container bg-secondary-container text-secondary' },
  critical: { label: 'Kritis', classes: 'border-secondary bg-secondary text-on-secondary' },
  running: { label: 'Sedang Berjalan', classes: 'border-primary bg-primary text-on-primary' },
  ready: { label: 'Terpasang', classes: 'border-secondary-container bg-secondary-container text-secondary' },
  done: { label: 'Selesai', classes: 'border-secondary-container bg-secondary-container text-secondary' },
}
const config = computed(() => map[props.status])
</script>
<template><span class="inline-flex items-center gap-2 rounded-[6px] border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" :class="config.classes"><span class="h-1.5 w-1.5 rounded-full bg-current" />{{ config.label }}</span></template>
