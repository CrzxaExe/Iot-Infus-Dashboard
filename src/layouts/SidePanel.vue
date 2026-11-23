<script setup lang="ts">
import SidebarNavigation from '@/components/navigations/SidebarNavigation.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <main class="w-full min-h-screen flex gap-2 lg:gap-3 justify-center">
    <SidebarNavigation />

    <article class="block md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-6xl w-full">
      <RouterView></RouterView>
    </article>
  </main>
</template>
