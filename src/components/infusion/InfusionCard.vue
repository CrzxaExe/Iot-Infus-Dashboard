<script setup lang="ts">
import { computed } from 'vue'
import type { InfusionDevice } from '@/types/infusion'
import { useInfusionStore } from '@/stores/infusion'
import PixelCornerFrame from '@/components/ui/PixelCornerFrame.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
const props = defineProps<{ device: InfusionDevice }>()
const emit = defineEmits<{ openDetail: [device: InfusionDevice] }>()
const store = useInfusionStore()
const level = computed(() => store.getLevel(props.device))
</script>
<template>
  <PixelCornerFrame :critical="level === 'critical'" class="flex min-h-64 flex-col p-4 transition-colors hover:border-primary">
    <div class="flex items-start justify-between gap-3"><div><p class="font-telemetry text-[10px] font-bold tracking-widest text-primary">{{ device.id }}</p><h3 class="mt-1 font-display text-xl">{{ device.patient || 'Belum ditempati' }}</h3><p class="text-xs text-muted">{{ device.room ? `${device.room} · ` : '' }}{{ device.fluid }}</p></div><StatusBadge :status="level" /></div>
    <div class="my-5"><div class="mb-2 flex items-end justify-between"><span class="text-xs font-semibold uppercase tracking-wider text-muted">Sisa cairan</span><strong class="font-telemetry text-2xl" :class="level === 'critical' ? 'text-error' : level === 'warning' ? 'text-warning' : 'text-primary'">{{ device.volumePct }}%</strong></div><div class="h-2.5 w-full bg-surface-container-high"><div class="h-full transition-all" :class="level === 'critical' ? 'bg-error' : level === 'warning' ? 'bg-warning' : 'bg-primary'" :style="{ width: `${device.volumePct}%` }" /></div><div class="mt-2 flex justify-between font-telemetry text-[11px] text-muted"><template v-if="device.reportedVolume !== undefined"><span>Volume sensor</span><span>{{ device.reportedVolume }}</span></template><template v-else><span>{{ device.remainingMl }} mL tersisa</span><span>{{ device.totalMl }} mL total</span></template></div></div>
    <div class="mt-auto grid grid-cols-2 gap-3 border-t border-outline-variant pt-3 text-xs"><div><span class="block text-muted">Perawat</span><strong>{{ device.nurse || '—' }}</strong></div><div><span class="block text-muted">Laju tetes</span><strong class="font-telemetry">{{ device.rateTpm }} tpm</strong></div></div>
    <button type="button" class="mt-4 w-full bg-secondary px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-primary" @click="emit('openDetail', device)">Lihat detail perangkat →</button>
  </PixelCornerFrame>
</template>
