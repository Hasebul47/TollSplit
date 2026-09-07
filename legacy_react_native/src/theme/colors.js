// Theme colors for TollSplit - Dark mode with teal/emerald accents
export const Colors = {
  // Base
  background: '#0a0f1a',
  surface: '#111827',
  surfaceLight: '#1a2332',
  surfaceElevated: '#1f2937',
  card: '#162033',
  
  // Primary - Teal/Emerald gradient
  primary: '#14b8a6',
  primaryLight: '#2dd4bf',
  primaryDark: '#0d9488',
  primaryGlow: 'rgba(20, 184, 166, 0.15)',
  primaryGlow2: 'rgba(20, 184, 166, 0.08)',
  
  // Accent
  accent: '#06b6d4',
  accentLight: '#22d3ee',
  
  // Gradient stops
  gradientStart: '#14b8a6',
  gradientEnd: '#06b6d4',
  
  // Text
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textInverse: '#0a0f1a',
  
  // Status
  success: '#22c55e',
  successBg: 'rgba(34, 197, 94, 0.12)',
  warning: '#f59e0b',
  warningBg: 'rgba(245, 158, 11, 0.12)',
  danger: '#ef4444',
  dangerBg: 'rgba(239, 68, 68, 0.12)',
  info: '#3b82f6',
  infoBg: 'rgba(59, 130, 246, 0.12)',
  
  // Balance status colors
  balanceGood: '#22c55e',
  balanceMedium: '#f59e0b',
  balanceLow: '#ef4444',
  balanceNegative: '#dc2626',
  
  // Borders
  border: '#1e293b',
  borderLight: '#334155',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Tab bar
  tabBarBg: '#0f1729',
  tabBarBorder: '#1e293b',
  tabBarActive: '#14b8a6',
  tabBarInactive: '#475569',
};

export const Gradients = {
  primary: ['#14b8a6', '#06b6d4'],
  primaryDark: ['#0d9488', '#0891b2'],
  card: ['#162033', '#111827'],
  header: ['#0a0f1a', '#111827'],
  success: ['#22c55e', '#16a34a'],
  danger: ['#ef4444', '#dc2626'],
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
};
