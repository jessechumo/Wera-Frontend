import { Activity, Briefcase, EyeOff, ListChecks, Sun, type LucideIcon } from 'lucide-react';
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
  { to: '/tracker', label: 'Tracker', icon: ListChecks },
  { to: '/excluded', label: 'Excluded', icon: EyeOff },
  { to: '/system', label: 'System', icon: Activity, admin: true },
];

/** Nav entries the current user can see (System is for admins). */
export function useNav(): NavItem[] {
  const me = useMe();
  return NAV.filter((n) => !n.admin || me.data?.is_admin);
}
