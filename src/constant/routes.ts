import { Icons } from './icons'

export const navigations: Navigations[] = [
  {
    icon: Icons.Dashboard,
    label: 'Dashboard',
    to: '/',
  },
  {
    icon: Icons.Bed,
    label: 'Ruangan',
    to: '/rooms',
  },
  {
    icon: Icons.WaterDrop,
    label: 'Perangkat Infus',
    to: '/devices',
  },
  {
    icon: Icons.Notification,
    label: 'Peringatan',
    to: '/notify',
  },
]
