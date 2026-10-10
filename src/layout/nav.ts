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
  /** Shown in the phone bottom bar (the rest live in the ⌘K palette). */
  mobile?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Today', icon: Sun, mobile: true },
  { to: '/jobs', label: 'Jobs', icon: Briefcase, mobile: true },
  { to: '/industries', label: 'Industries', icon: Factory, mobile: true },
  { to: '/tracker', label: 'Tracker', icon: ListChecks, mobile: true },
  { to: '/excluded', label: 'Excluded', icon: EyeOff },
  { to: '/profile', label: 'Profile', icon: UserRound, mobile: true },
  { to: '/system', label: 'System', icon: Activity, admin: true },
];

/** Nav entries the current user can see (System is for admins). */
export function useNav(): NavItem[] {
  const me = useMe();
  return NAV.filter((n) => !n.admin || me.data?.is_admin);
}
