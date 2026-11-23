import BedIcon from '@/components/icons/BedIcon.vue'
import DashboardIcon from '@/components/icons/DashboardIcon.vue'
import NotifIcon from '@/components/icons/NotifIcon.vue'
import PeopleIcon from '@/components/icons/PeopleIcon.vue'
import SettingsIcon from '@/components/icons/SettingsIcon.vue'
import WaterDropIcon from '@/components/icons/WaterDropIcon.vue'

export const Icons = {
  Bed: BedIcon,
  Dashboard: DashboardIcon,
  Notification: NotifIcon,
  People: PeopleIcon,
  Settings: SettingsIcon,
  WaterDrop: WaterDropIcon,
}

export type IconName = keyof typeof Icons
