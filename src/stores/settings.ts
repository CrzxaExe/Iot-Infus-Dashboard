import { navigations } from '@/constant/routes'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettings = defineStore('settings', () => {
  const isOpen = ref(false)
  const curIndex = ref(-1)

  function setOpen(value: boolean = !isOpen.value) {
    isOpen.value = value
  }

  function syncIndex(path: string | undefined) {
    if(!path) return
    const list = navigations.map(e => e.to.slice(1))

    const splitedPath = path.split("/")
    const findIndex = list.findIndex(e => e === splitedPath[1])

    curIndex.value = findIndex
  }

  return {
    isOpen,
    curIndex,

    setOpen,
    syncIndex,
  }
})
