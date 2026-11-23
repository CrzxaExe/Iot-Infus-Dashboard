import SidePanel from '@/layouts/SidePanel.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: SidePanel,
      children: [
        {
          path: '',
          meta: {
            title: 'Dashboard',
          },
          component: async () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'rooms',
          meta: {
            title: 'Ruangan',
          },
          component: async () => import('@/views/RoomsView.vue'),
        },
        {
          path: 'devices',
          meta: {
            title: 'Perangkat',
          },
          component: async () => import('@/views/DeviceView.vue'),
        },
        {
          path: 'notify',
          meta: {
            title: 'Notif',
          },
          component: async () => import('@/views/NotifView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to, _from) => {
  if (!to.meta.title) return

  document.title = to.meta.title as string
  return true
})

export default router
