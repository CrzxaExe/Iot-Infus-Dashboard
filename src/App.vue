<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useRealtimeStore } from '@/stores/realtime'
import { useServerNotificationStore } from '@/stores/serverNotification'
import PixelNotificationToast from '@/components/ui/PixelNotificationToast.vue'

const realtime = useRealtimeStore()
const serverNotifications = useServerNotificationStore()

// Toast dipasang di root agar tampil di halaman mana pun, terlepas dari layout.
watch(() => realtime.status, (status) => {
  if (status === 'connected') void serverNotifications.loadHistory()
})

onMounted(() => realtime.start())
onUnmounted(() => realtime.stop())
</script>

<template>
  <RouterView />
  <PixelNotificationToast />
</template>

<style scoped></style>
