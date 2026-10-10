import {
  Activity,
  Briefcase,
  Factory,
  EyeOff,
  ListChecks,
  Sun,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useMe } from '../api/auth';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  admin?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Today', icon: Sun },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/industries', label: 'Industries', icon: Factory },
  { to: '/tracker', label: 'Tracker', icon: ListChecks },
  { to: '/excluded', label: 'Excluded', icon: EyeOff },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/system', label: 'System', icon: Activity, admin: true },
];

/** Nav entries the current user can see (System is for admins). */
export function useNav(): NavItem[] {
  const me = useMe();
  return NAV.filter((n) => !n.admin || me.data?.is_admin);
}
