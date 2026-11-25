<script setup lang="ts">
import { computed } from 'vue'
import type { InfusionDevice } from '@/types/infusion'
import { useInfusionStore } from '@/stores/infusion'
import PixelCornerFrame from '@/components/ui/PixelCornerFrame.vue'
const props = defineProps<{ device: InfusionDevice }>()
const emit = defineEmits<{ openDetail: [device: InfusionDevice] }>()
const store = useInfusionStore()
const level = computed(() => store.getLevel(props.device))
const statusLabel = computed(() => level.value === 'critical' ? 'PERLU DIGANTI' : level.value === 'warning' ? 'WARNING' : 'NORMAL')
</script>
<template>
  <PixelCornerFrame :critical="level === 'critical'" class="flex min-h-64 flex-col p-4 transition-colors hover:border-primary">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <p class="font-telemetry text-[10px] font-bold tracking-widest text-primary">{{ device.id }}</p>
          <span class="rounded-[6px] px-2 py-1 font-telemetry text-[10px] font-bold" :class="level === 'critical' ? 'bg-secondary text-on-secondary' : level === 'warning' ? 'bg-secondary-container text-secondary' : 'bg-primary text-on-primary'">{{ device.volumePct }}% · {{ statusLabel }}</span>
        </div>
        <h3 class="mt-2 font-display text-xl">{{ device.patient || 'Belum ditempati' }}</h3>
        <p class="truncate text-xs text-muted">{{ device.room ? `${device.room} · ` : '' }}{{ device.fluid }}</p>
      </div>
      <div role="img" :aria-label="`Sisa cairan ${device.volumePct}%`" class="flex h-16 w-12 shrink-0 flex-col justify-end overflow-hidden rounded-[8px] border border-[#001412] bg-[#C6DED6]/40 p-0.5">
        <div class="w-full rounded-[4px] transition-[height]" :class="level === 'normal' ? 'bg-primary' : 'bg-secondary'" :style="{ height: `${Math.max(6, device.volumePct)}%` }" />
      </div>
    </div>
    <div class="mt-4 grid grid-cols-3 gap-2 rounded-[8px] bg-[#C6DED6]/25 p-2.5 text-xs">
      <div class="min-w-0"><span class="block text-[10px] text-muted">Sisa</span><strong class="font-telemetry tabular-nums">{{ device.remainingMl }} / {{ device.totalMl }} ml</strong></div>
      <div class="min-w-0"><span class="block text-[10px] text-muted">Laju</span><strong class="font-telemetry tabular-nums">{{ device.rateTpm }} tpm</strong></div>
      <div class="min-w-0"><span class="block text-[10px] text-muted">Perawat</span><strong class="block truncate">{{ device.nurse || '—' }}</strong></div>
    </div>
    <div class="mt-auto flex justify-end pt-4">
      <button type="button" class="rounded-[8px] bg-[#C6DED6]/55 px-3 py-2 text-xs font-bold text-[#001412] transition-colors hover:bg-[#00625C] hover:text-[#F6FBF2]" @click="emit('openDetail', device)">Detail perangkat →</button>
    </div>
  </PixelCornerFrame>
</template>
