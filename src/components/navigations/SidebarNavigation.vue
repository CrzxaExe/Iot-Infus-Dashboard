<script setup lang="ts">
import { navigations } from '@/constant/routes'
import { useSettings } from '@/stores/settings'
import { computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const settings = useSettings()

const router = useRoute()
const path = computed(() => router.fullPath)

watch(path, (newPath) => {
  settings.syncIndex(newPath)
})

onMounted(() => {
  settings.syncIndex(path.value)
})
</script>

<template>
  <aside
    class="min-h-screen bg-secondary fixed left-0 flex flex-col justify-between w-full max-w-60 lg:translate-x-0 animatable"
    :class="[settings.isOpen ? 'translate-x-[0%]' : '-translate-x-full']"
  >
    <div>
      <div
        class="w-full flex gap-2 items-center px-3 lg:px-4 py-4 cursor-pointer animatable"
        :class="[settings.isOpen ? 'translate-x-[0%]' : 'translate-x-[94%] lg:translate-x-[0%]']"
        @click="settings.setOpen()"
      >
        <div
          class="block bg-primary aspect-square w-10 animatable rounded-l-lg lg:rounded-r-lg lg:opacity-100"
          :class="[
            settings.isOpen
              ? 'rounded-r-lg opacity-100'
              : 'rounded-r-4xl opacity-40 hover:opacity-100',
          ]"
        ></div>

        <p
          class="tracking-tight text-2xl font-bold text-white -mt-1 lg:block lg:w-full animatable overflow-hidden"
          :class="[settings.isOpen ? 'block w-full' : 'hidden w-[0%]']"
        >
          Infu<span class="text-primary">care</span>
        </p>
      </div>

      <span class="block uppercase font-medium text-xs mt-2 lg:mt-4 px-3 lg:px-4 text-zinc-700"
        >nurse station</span
      >
      <nav class="mt-0.5 px-1.5 flex flex-col gap-1">
        <RouterLink
          v-for="({ icon, label, to }, i) in navigations"
          :key="label"
          :to
          class="flex items-center gap-2 px-1.5 lg:px-2.5 hover:bg-tertier py-2 rounded-xl animatable hover:text-black"
          :class="[settings.curIndex === i ? 'text-white bg-primary' : 'text-zinc-700']"
        >
          <component :is="icon" />
          <span class="font-medium">{{ label }}</span>
        </RouterLink>
      </nav>
    </div>

    <div class="px-3 py-2">
      <span class="font-light text-xs text-zinc-500 tracking-widest">v1.0</span>
    </div>
  </aside>
</template>
