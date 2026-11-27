<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimeoutFn } from '@vueuse/core'
import { useNotificationStore } from '@/stores/notification'
import PixelCornerFrame from './PixelCornerFrame.vue'
const store = useNotificationStore()
const { toasts, burstCounter } = storeToRefs(store)
const stack = ref<HTMLElement | null>(null)
const particles = ref<Array<{ id: string; tx: string; ty: string; size: string; color: string }>>([])
const colors = ['#F6FBF2', '#00625C', '#001412', '#C6DED6']
const { start: clearLater } = useTimeoutFn(() => { particles.value = [] }, 700, { immediate: false })
watch(burstCounter, () => {
  particles.value = Array.from({ length: 24 }, (_, i) => {
    const angle = Math.PI * .25 + Math.random() * Math.PI * .2
    const distance = 80 + Math.random() * 160
    return { id: `${Date.now()}-${i}`, tx: `${Math.round(Math.cos(angle) * distance * -1)}px`, ty: `${Math.round(Math.sin(angle) * distance * -1)}px`, size: `${[7, 9, 12][i % 3]}px`, color: colors[i % colors.length] ?? '#00625C' }
  })
  clearLater()
})
watch(() => toasts.value.length, async () => {
  await nextTick()
  if (stack.value) stack.value.scrollTop = stack.value.scrollHeight
})
</script>
<template>
  <div v-for="particle in particles" :key="particle.id" class="pixel-particle" :style="{ right: '36px', bottom: '36px', backgroundColor: particle.color, '--tx': particle.tx, '--ty': particle.ty, '--size': particle.size }" />
  <div v-if="toasts.length" ref="stack" class="toast-stack fixed bottom-5 right-5 z-[80] max-h-[calc(100vh-2.5rem)] w-[min(24rem,calc(100vw-2.5rem))] overflow-y-auto pr-1">
    <TransitionGroup name="modal-fade" tag="div" class="flex flex-col gap-3">
      <div v-if="toasts.length > 1" class="sticky top-0 z-10 flex justify-end">
        <button type="button" class="toast-clear-button px-2 py-1 text-[10px] font-bold uppercase tracking-wider" @click="store.clearToasts()">Tutup semua ({{ toasts.length }})</button>
      </div>
      <PixelCornerFrame v-for="toast in toasts" :key="toast.id" :critical="toast.level === 'critical'" dark class="shrink-0 border-[#C6DED6]/65 p-4">
        <div class="flex items-start justify-between gap-3">
          <div><p class="font-telemetry text-[10px] uppercase tracking-widest text-primary">{{ toast.deviceId }} · {{ toast.time }}</p><h3 class="mt-1 font-display text-lg">{{ toast.title }}</h3><p class="mt-1 text-xs leading-relaxed text-secondary-container">{{ toast.message }}</p></div>
          <button type="button" :aria-label="`Tutup notifikasi ${toast.title}`" class="toast-dismiss-button px-2 py-1 text-sm" @click="store.dismissToast(toast.id)">×</button>
        </div>
      </PixelCornerFrame>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-dismiss-button {
  border: 1px solid rgb(198 222 214 / 55%);
  border-radius: 8px;
  background-color: #001412;
  color: #F6FBF2;
}

.toast-dismiss-button:hover {
  border-color: #00625C;
  background-color: #00625C;
  color: #F6FBF2;
}

.toast-clear-button {
  border: 1px solid rgb(198 222 214 / 55%);
  border-radius: 8px;
  background-color: rgb(0 20 18 / 92%);
  color: #C6DED6;
}

.toast-clear-button:hover {
  border-color: #00625C;
  color: #F6FBF2;
}

.toast-stack {
  scrollbar-width: thin;
  scrollbar-color: #00625C transparent;
}
</style>
