import SidePanel from '@/layouts/SidePanel.vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: SidePanel,
    children: [
      { path: '', name: 'monitoring', meta: { title: 'Monitoring Infus' }, component: () => import('@/views/DashboardView.vue') },
      { path: 'rooms', name: 'rooms', meta: { title: 'Ruangan · Monitoring Infus' }, component: () => import('@/views/RoomsView.vue') },
      { path: 'devices', name: 'perangkat', meta: { title: 'Perangkat Infus · Monitoring Infus' }, component: () => import('@/views/DeviceView.vue') },
      { path: 'perangkat/:id', name: 'detail-perangkat', meta: { title: 'Detail Perangkat · Monitoring Infus' }, component: () => import('@/views/DetailPerangkatView.vue'), props: true },
      { path: 'history', name: 'riwayat', meta: { title: 'Riwayat Infus · Monitoring Infus' }, component: () => import('@/views/HistoryView.vue') },
      { path: 'notify', name: 'peringatan', meta: { title: 'Peringatan · Monitoring Infus' }, component: () => import('@/views/NotifView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })
router.beforeEach((to) => { document.title = String(to.meta.title ?? 'Monitoring Infus') })
export default router
