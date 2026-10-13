import {
  Bitcoin, Bot, BrainCircuit, Briefcase, Building, Car, Clapperboard, Cloud, CreditCard, Cpu, Dna, Factory, Gamepad2,
  GraduationCap, Handshake, HeartPulse, Landmark, Leaf, Plane, RadioTower, ShieldCheck, ShieldHalf, ShoppingBag,
  Smartphone, ChartCandlestick, Truck, Umbrella, Zap, Shapes, type LucideIcon,
} from 'lucide-react';

/**
 * An icon and a signature color per industry. The colors are mid-tone
 * (Tailwind 500 level) so they read on both the light and the dark card;
 * tiles tint them in CSS, so one value serves both themes.
 */
export const INDUSTRY_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  ai_ml: { icon: BrainCircuit, color: '#8b5cf6' },
  big_tech: { icon: Cpu, color: '#3b82f6' },
  cloud: { icon: Cloud, color: '#0ea5e9' },
  trading: { icon: ChartCandlestick, color: '#10b981' },
  fintech: { icon: CreditCard, color: '#14b8a6' },
  banking: { icon: Landmark, color: '#0d9488' },
  crypto: { icon: Bitcoin, color: '#f59e0b' },
  insurance: { icon: Umbrella, color: '#6366f1' },
  healthcare: { icon: HeartPulse, color: '#ef4444' },
  biotech: { icon: Dna, color: '#22c55e' },
  aerospace: { icon: Plane, color: '#0284c7' },
  defense: { icon: ShieldHalf, color: '#64748b' },
  automotive: { icon: Car, color: '#f97316' },
  robotics: { icon: Bot, color: '#06b6d4' },
  manufacturing: { icon: Factory, color: '#a16207' },
  energy: { icon: Zap, color: '#eab308' },
  logistics: { icon: Truck, color: '#d97706' },
  ecommerce: { icon: ShoppingBag, color: '#ec4899' },
  consumer: { icon: Smartphone, color: '#d946ef' },
  media: { icon: Clapperboard, color: '#e11d48' },
  gaming: { icon: Gamepad2, color: '#a855f7' },
  education: { icon: GraduationCap, color: '#2563eb' },
  enterprise: { icon: Briefcase, color: '#4f46e5' },
  consulting: { icon: Handshake, color: '#7c3aed' },
  telecom: { icon: RadioTower, color: '#0891b2' },
  security: { icon: ShieldCheck, color: '#16a34a' },
  real_estate: { icon: Building, color: '#c2410c' },
  nonprofit: { icon: Leaf, color: '#65a30d' },
};

const FALLBACK = { icon: Shapes, color: '#78716c' };

export function industryIcon(id: string) {
  return INDUSTRY_ICONS[id] ?? FALLBACK;
}
