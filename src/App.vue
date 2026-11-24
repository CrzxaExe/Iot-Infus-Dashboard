<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { connectInfusionRealtime } from '@/services/infusionRealtime'

let disconnect: (() => void) | undefined

onMounted(() => {
  disconnect = connectInfusionRealtime()
})

onUnmounted(() => disconnect?.())
</script>

<template>
  <RouterView></RouterView>
</template>

<style scoped></style>
