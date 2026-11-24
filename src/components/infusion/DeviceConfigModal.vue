<script setup lang="ts">
import { reactive, watch, onMounted, onUnmounted } from 'vue'
import type { DeviceConfigForm, InfusionDevice } from '@/types/infusion'
const props = defineProps<{ open: boolean; device: InfusionDevice | null }>()
const emit = defineEmits<{ close: []; save: [payload: DeviceConfigForm] }>()
const form = reactive({ deviceId: '', nurse: '', patient: '', room: '', fluid: 'NaCl 0.9%', totalMl: 500, targetTpm: 20 })
watch(() => [props.open, props.device] as const, () => {
  form.deviceId = props.device?.id ?? `INF-${String(Date.now()).slice(-3)}`
  form.nurse = props.device?.nurse ?? ''
  form.patient = props.device?.patient ?? ''
  form.room = props.device?.room ?? ''
  form.fluid = props.device?.fluid ?? 'NaCl 0.9%'
  form.totalMl = props.device?.totalMl ?? 500
  form.targetTpm = props.device?.targetTpm ?? 20
}, { immediate: true })
function onKeydown(event: KeyboardEvent) { if (event.key === 'Escape' && props.open) emit('close') }
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
function submit() { emit('save', { ...form }) }
</script>
<template>
  <Transition name="modal-fade"><div v-if="open" class="fixed inset-0 z-[60] flex items-center justify-center bg-secondary/70 p-4" @click.self="emit('close')">
    <section role="dialog" aria-modal="true" aria-labelledby="config-title" class="max-h-[90vh] w-full max-w-xl overflow-y-auto border-2 border-secondary bg-white p-5 shadow-2xl sm:p-7">
      <header class="mb-5 flex items-start justify-between border-b border-outline-variant pb-4"><div><p class="font-telemetry text-[10px] uppercase tracking-widest text-primary">{{ form.deviceId }}</p><h2 id="config-title" class="mt-1 font-display text-2xl">{{ device ? 'Konfigurasi perangkat' : 'Pasang perangkat infus' }}</h2></div><button type="button" aria-label="Tutup dialog" class="border border-outline-variant px-3 py-1 text-lg hover:bg-secondary hover:text-white" @click="emit('close')">×</button></header>
      <form class="space-y-4" @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-2"><label class="block text-xs font-semibold">ID PERANGKAT<input v-model="form.deviceId" readonly class="mt-1 w-full border border-outline-variant bg-surface px-3 py-2 text-sm" /></label><label class="block text-xs font-semibold">RUANGAN (OPSIONAL)<input v-model="form.room" placeholder="Ruang 01" class="mt-1 w-full border border-outline-variant bg-surface px-3 py-2 text-sm" /></label></div>
        <label class="block text-xs font-semibold">NAMA PASIEN (OPSIONAL)<input v-model="form.patient" placeholder="Isi jika perangkat sudah digunakan" class="mt-1 w-full border border-outline-variant bg-surface px-3 py-2 text-sm" /></label>
        <label class="block text-xs font-semibold">PERAWAT PENANGGUNG JAWAB (OPSIONAL)<input v-model="form.nurse" placeholder="Isi jika perangkat sudah digunakan" class="mt-1 w-full border border-outline-variant bg-surface px-3 py-2 text-sm" /></label>
        <label class="block text-xs font-semibold">JENIS CAIRAN<select v-model="form.fluid" required class="mt-1 w-full border border-outline-variant bg-surface px-3 py-2 text-sm"><option>NaCl 0.9%</option><option>Ringer Laktat</option><option>D5 ½ NS</option><option>Dextrose 5%</option></select></label>
        <div class="grid gap-4 sm:grid-cols-2"><label class="block text-xs font-semibold">VOLUME TOTAL (mL)<input v-model.number="form.totalMl" type="number" min="1" required class="mt-1 w-full border border-outline-variant bg-surface px-3 py-2 text-sm font-telemetry" /></label><label class="block text-xs font-semibold">TARGET LAJU (tpm)<input v-model.number="form.targetTpm" type="number" min="1" max="60" required class="mt-1 w-full border border-outline-variant bg-surface px-3 py-2 text-sm font-telemetry" /></label></div>
        <p class="text-[11px] text-muted">Jenis cairan, volume, dan target wajib diisi. Perangkat menjadi terpakai setelah nama pasien dan perawat diisi.</p>
        <div class="flex justify-end gap-2 border-t border-outline-variant pt-4"><button type="button" class="border border-outline-variant px-4 py-2 text-xs font-bold uppercase" @click="emit('close')">Batal</button><button type="submit" class="bg-primary px-5 py-2 text-xs font-bold uppercase text-white hover:bg-primary-container">Simpan konfigurasi</button></div>
      </form>
    </section>
  </div></Transition>
</template>
