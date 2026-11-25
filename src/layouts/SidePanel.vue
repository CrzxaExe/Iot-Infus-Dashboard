<script setup lang="ts">
import SidebarNavigation from '@/components/navigations/SidebarNavigation.vue'
import PixelNotificationToast from '@/components/ui/PixelNotificationToast.vue'
import { RouterView } from 'vue-router'
</script>
<template>
  <div class="min-h-screen bg-secondary">
    <SidebarNavigation />
    <main class="min-h-screen min-w-0 bg-surface transition-[margin] duration-200 lg:ml-60 lg:rounded-tl-[18px] lg:rounded-bl-[18px]"><div class="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8"><RouterView /></div></main>
    <PixelNotificationToast />
  </div>
</template>
