<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PixelCornerFrame from '@/components/ui/PixelCornerFrame.vue'
import { useInfusionStore } from '@/stores/infusion'
import { deviceIdOf, infusTypeOf, patientIdOf, percentOf, roomIdOf, tpmOf, volumeLabelOf } from '@/services/deviceFields'
import { deviceDetailPath } from '@/utils/deviceRoute'
import type { InfusionDevice, InfusionLevel } from '@/types/infusion'

type RoomFilter = 'all' | 'critical' | 'warning' | 'normal'
type RoomGroup = {
  name: string
  devices: InfusionDevice[]
  criticalCount: number
  warningCount: number
  level: InfusionLevel
}

const store = useInfusionStore()
const activeFilter = ref<RoomFilter>('all')
const searchQuery = ref('')
// Backend has no session status; include standby telemetry devices as well.
const visibleDevices = computed(() => store.devices.filter((device) => device.status !== 'done'))

const rooms = computed<RoomGroup[]>(() => {
  const grouped = new Map<string, InfusionDevice[]>()
  for (const device of visibleDevices.value) {
    const name = roomIdOf(device).trim() || 'Ruangan belum ditentukan'
    const devices = grouped.get(name) ?? []
    devices.push(device)
    grouped.set(name, devices)
  }

  return Array.from(grouped, ([name, devices]) => {
    const criticalCount = devices.filter((device) => store.getLevel(device) === 'critical').length
    const warningCount = devices.filter((device) => store.getLevel(device) === 'warning').length
    const level: InfusionLevel = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'normal'
    return { name, devices, criticalCount, warningCount, level }
  })
})

const roomCounts = computed(() => ({
  all: rooms.value.length,
  critical: rooms.value.filter((room) => room.criticalCount > 0).length,
  warning: rooms.value.filter((room) => room.warningCount > 0).length,
  normal: rooms.value.filter((room) => room.level === 'normal').length,
}))

const filteredRooms = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return rooms.value.filter((room) => {
    const matchesStatus = activeFilter.value === 'all'
      || (activeFilter.value === 'critical' && room.criticalCount > 0)
      || (activeFilter.value === 'warning' && room.warningCount > 0)
      || (activeFilter.value === 'normal' && room.level === 'normal')
    if (!matchesStatus) return false
    if (!query) return true

    return room.name.toLocaleLowerCase().includes(query)
      || room.devices.some((device) => deviceIdOf(device).toLocaleLowerCase().includes(query)
        || patientIdOf(device).toLocaleLowerCase().includes(query))
  })
})

function statusLabel(level: InfusionLevel) {
  if (level === 'critical') return 'GANTI'
  if (level === 'warning') return 'WARNING'
  return 'NORMAL'
}

function bottleFillClass(device: InfusionDevice) {
  return store.getLevel(device) === 'normal' ? 'bg-primary' : 'bg-secondary'
}

function roomBadgeClass(room: RoomGroup) {
  if (room.level === 'critical') return 'bg-secondary text-on-secondary'
  if (room.level === 'warning') return 'bg-secondary-container text-secondary'
  return 'bg-secondary-container text-primary'
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="font-headline text-2xl text-[#001412]">Ruangan</h1>
      <p class="mt-1 text-sm text-[#00625C]">Perangkat infus yang sedang dipakai di setiap ruangan.</p>
    </header>

    <section class="flex flex-col justify-between gap-3 rounded-[10px] border border-[#C6DED6]/65 bg-[#F6FBF2] p-4 shadow-[0_2px_12px_rgba(0,20,18,0.04)] lg:flex-row lg:items-center">
      <div class="flex flex-wrap items-center gap-1">
        <button
          v-for="filter in [
            { id: 'all', label: `Semua Ruangan (${roomCounts.all})` },
            { id: 'critical', label: `Ada Kritis ≤5% (${roomCounts.critical})` },
            { id: 'warning', label: `Ada Warning 10% (${roomCounts.warning})` },
            { id: 'normal', label: `Normal (${roomCounts.normal})` },
          ] as const"
          :key="filter.id"
          type="button"
          class="whitespace-nowrap rounded-[8px] px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors"
          :class="activeFilter === filter.id ? 'bg-primary text-on-primary' : 'text-muted hover:bg-secondary-container/55'"
          @click="activeFilter = filter.id"
        >{{ filter.label }}</button>
      </div>

      <div class="relative w-full shrink-0 lg:w-64">
        <svg aria-hidden="true" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00625C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          aria-label="Cari kamar, perangkat, atau pasien"
          placeholder="Cari kamar, perangkat, pasien..."
          class="w-full rounded-[8px] border border-[#C6DED6] bg-[#F6FBF2] py-2 pl-9 pr-3 text-sm text-[#001412] placeholder:text-[#00625C]/70 focus:border-[#00625C] focus:outline-none"
        />
      </div>
    </section>

    <section class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PixelCornerFrame
        v-for="room in filteredRooms"
        :key="room.name"
        :critical="room.criticalCount > 0"
        class="p-4"
      >
        <header class="flex items-center justify-between gap-2 border-b border-[#C6DED6]/65 pb-3">
          <h2 class="font-headline text-lg text-[#001412]">{{ room.name }}</h2>
          <div class="flex shrink-0 items-center gap-2">
            <span class="font-telemetry text-xs text-[#00625C]">{{ room.devices.length }} infus</span>
            <span class="rounded-[6px] px-2 py-0.5 font-telemetry text-[11px] font-bold" :class="roomBadgeClass(room)">
              <template v-if="room.level === 'critical'">{{ room.criticalCount }} KRITIS ≤5%</template>
              <template v-else-if="room.level === 'warning'">{{ room.warningCount }} WARNING 10%</template>
              <template v-else>NORMAL</template>
            </span>
          </div>
        </header>

        <div class="mt-3 flex flex-col gap-2.5">
          <div
            v-for="device in room.devices"
            :key="device.id"
            class="flex items-center justify-between gap-4 rounded-[8px] bg-[#C6DED6]/25 p-3"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div
                role="img"
                :aria-label="`Sisa cairan ${percentOf(device)}%`"
                class="flex h-14 min-h-[56px] w-10 min-w-[40px] shrink-0 flex-col justify-end overflow-hidden rounded-[6px] border border-[#001412] bg-[#F6FBF2] p-0.5"
              >
                <div
                  class="w-full shrink-0 rounded-[3px] transition-[height]"
                  :class="bottleFillClass(device)"
                  :style="{ height: `${Math.max(8, percentOf(device))}%` }"
                />
              </div>

              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-1.5">
                  <p class="font-telemetry text-xs font-bold text-[#001412]">{{ device.bed ? `${device.bed} · ` : '' }}{{ deviceIdOf(device) }}</p>
                  <span
                    class="rounded-[4px] px-1.5 py-0.5 font-telemetry text-[11px] font-bold"
                    :class="store.getLevel(device) === 'critical' ? 'bg-[#001412] text-[#F6FBF2]' : store.getLevel(device) === 'warning' ? 'border border-[#001412] bg-[#C6DED6] text-[#001412]' : 'bg-[#C6DED6] text-[#00625C]'"
                  >{{ percentOf(device) }}% · {{ statusLabel(store.getLevel(device)) }}</span>
                </div>
                <p class="truncate text-sm font-semibold text-[#001412]">{{ patientIdOf(device) || 'Belum ditempati' }} · {{ infusTypeOf(device) }}</p>
                <p class="font-telemetry text-xs tabular-nums text-[#00625C]">{{ volumeLabelOf(device) }} · {{ tpmOf(device) }} tpm</p>
              </div>
            </div>

            <RouterLink
              :to="deviceDetailPath(device.id)"
              class="shrink-0 rounded-[8px] bg-[#C6DED6]/55 px-3 py-1.5 text-xs font-medium text-[#001412] transition-colors hover:bg-[#00625C] hover:text-[#F6FBF2]"
            >Detail →</RouterLink>
          </div>
        </div>
      </PixelCornerFrame>

      <div
        v-if="filteredRooms.length === 0"
        class="col-span-full rounded-[10px] border border-[#C6DED6]/65 bg-[#F6FBF2] p-8 text-center text-sm text-[#001412] shadow-[0_2px_12px_rgba(0,20,18,0.04)]"
      >Tidak ada ruangan atau perangkat yang cocok dengan filter.</div>
    </section>
  </div>
</template>
