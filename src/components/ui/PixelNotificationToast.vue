<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimeoutFn } from '@vueuse/core'
import { useNotificationStore } from '@/stores/notification'
import PixelCornerFrame from './PixelCornerFrame.vue'
const store = useNotificationStore()
const { activeToast, burstCounter } = storeToRefs(store)
const particles = ref<Array<{ id: string; tx: string; ty: string; size: string; color: string }>>([])
const colors = ['#15803D', '#BA1A1A', '#F59E0B', '#1D4ED8', '#79DB8D', '#FFFFFF', '#181D17']
const { start: clearLater } = useTimeoutFn(() => { particles.value = [] }, 700, { immediate: false })
watch(burstCounter, () => {
  particles.value = Array.from({ length: 24 }, (_, i) => {
    const angle = Math.PI * .25 + Math.random() * Math.PI * .2
    const distance = 80 + Math.random() * 160
    return { id: `${Date.now()}-${i}`, tx: `${Math.round(Math.cos(angle) * distance * -1)}px`, ty: `${Math.round(Math.sin(angle) * distance * -1)}px`, size: `${[7, 9, 12][i % 3]}px`, color: colors[i % colors.length] ?? '#15803D' }
  })
  clearLater()
})
</script>
<template>
  <div v-for="particle in particles" :key="particle.id" class="pixel-particle" :style="{ right: '36px', bottom: '36px', backgroundColor: particle.color, '--tx': particle.tx, '--ty': particle.ty, '--size': particle.size }" />
  <Transition name="modal-fade">
    <div v-if="activeToast" class="fixed bottom-5 right-5 z-[80] w-[min(24rem,calc(100vw-2.5rem))] shadow-2xl">
      <PixelCornerFrame :critical="activeToast.level === 'critical'" class="border-secondary bg-inverse-surface p-4 text-white">
        <div class="flex items-start justify-between gap-3">
          <div><p class="font-telemetry text-[10px] uppercase tracking-widest text-inverse-primary">{{ activeToast.deviceId }} · {{ activeToast.time }}</p><h3 class="mt-1 font-display text-lg">{{ activeToast.title }}</h3><p class="mt-1 text-xs leading-relaxed text-outline-variant">{{ activeToast.message }}</p></div>
          <button type="button" aria-label="Tutup notifikasi" class="toast-dismiss-button px-2 py-1 text-sm" @click="store.dismissToast()">×</button>
        </div>
      </PixelCornerFrame>
    </div>
  </Transition>
</template>

<style scoped>
.toast-dismiss-button {
  border: 1px solid rgb(255 255 255 / 55%);
  background-color: #181d17;
  color: #fff;
}

.toast-dismiss-button:hover {
  border-color: #ba1a1a;
  background-color: #ba1a1a;
}
</style>
