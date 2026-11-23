<script setup lang="ts">
import { useNow } from '@vueuse/core';

const days = ["Minggu", "Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const month = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]
const now = useNow()
</script>

<template>
  <header class="flex flex-col lg:flex-row justify-between items-start px-3 lg:px-0 py-3">
    <div class="flex flex-col">
      <h1 class="text-3xl lg:text-4xl font-bold">Monitoring Infus</h1>
      <h2>Pasien atas nama yoga</h2>
    </div>

    <div>
      <div class="px-3 lg:px-4 py-1 border border-zinc-400 text-zinc-700 rounded-xl">
        <span>{{ days[now.getDay()] }}</span>,
        <span>{{ now.getDate() }}</span>
        <span class="ml-1">{{ month[now.getMonth()] }}</span>
        <span class="ml-1">{{ now.getFullYear() }}</span> -
        <span class="ml-1">{{ String(now.getHours()).padStart(2,"0") }}</span>:
        <span class="-ml-1">{{ String(now.getMinutes()).padStart(2,"0") }}</span>
      </div>
    </div>
  </header>

  <section>
    <div></div>
  </section>
</template>
