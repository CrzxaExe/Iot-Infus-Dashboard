import type { InfusionSnapshot } from '@/types/infusion'

export const initialInfusionSnapshot: InfusionSnapshot = {
  devices: [
    { id: 'INF-001', room: 'Ruang 01', patient: 'Alya Putri', nurse: 'Ns. Dewi Lestari', fluid: 'NaCl 0.9%', volumePct: 4, remainingMl: 20, totalMl: 500, rateTpm: 22, targetTpm: 22, status: 'running', paused: false, updatedAt: '08:42' },
    { id: 'INF-002', room: 'Ruang 02', patient: 'Bima Pratama', nurse: 'Ns. Rina Amelia', fluid: 'Ringer Laktat', volumePct: 10, remainingMl: 50, totalMl: 500, rateTpm: 20, targetTpm: 20, status: 'running', paused: false, updatedAt: '08:40' },
    { id: 'INF-003', room: 'Ruang 03', patient: 'Citra Maharani', nurse: 'Ns. Siti Rahma', fluid: 'D5 ½ NS', volumePct: 46, remainingMl: 230, totalMl: 500, rateTpm: 18, targetTpm: 18, status: 'running', paused: false, updatedAt: '08:38' },
    { id: 'INF-004', room: '', patient: '', nurse: '', fluid: 'NaCl 0.9%', volumePct: 72, remainingMl: 360, totalMl: 500, rateTpm: 24, targetTpm: 24, status: 'ready', paused: false, updatedAt: '08:35' },
  ],
  history: [
    { id: 'HIS-2401', patient: 'Nadia Putri', room: 'Ruang 05', fluid: 'NaCl 0.9%', startedAt: '07:10', endedAt: '09:15', createdAt: '07:10', status: 'done', nurse: 'Ns. Dewi Lestari' },
    { id: 'HIS-2402', patient: 'Rafi Akbar', room: 'Ruang 02', fluid: 'Ringer Laktat', startedAt: '08:00', endedAt: '—', createdAt: '08:00', status: 'running', nurse: 'Ns. Rina Amelia' },
    { id: 'HIS-2403', patient: 'Maya Sari', room: 'Ruang 03', fluid: 'D5 ½ NS', startedAt: '06:45', endedAt: '—', createdAt: '06:45', status: 'ready', nurse: 'Ns. Siti Rahma' },
  ],
}
