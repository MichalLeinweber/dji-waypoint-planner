// severityColor.ts — shared Tailwind class bundles for collision severity levels.
// Used by Sidebar.tsx (collision banner) and CollisionPanel.tsx (header).
// All class strings are static literals so Tailwind includes them in the build.

import { Severity } from '@/lib/collisionDetection';

export interface SeverityClasses {
  /** Background with 30% opacity — for inline banners */
  bg30: string;
  /** Background with 20% opacity — for modal/panel headers */
  bg20: string;
  /** Border color */
  border: string;
  /** Medium text color (300) */
  text: string;
  /** Muted text color (400) — for links and secondary buttons */
  textMuted: string;
  /** Hover text color class — hover:text-*-200 */
  textHover: string;
}

/** Returns the full set of Tailwind classes for a given severity level. */
export function severityClasses(severity: Severity | null): SeverityClasses {
  switch (severity) {
    case 'DANGER':
      return {
        bg30:      'bg-red-900/30',
        bg20:      'bg-red-900/20',
        border:    'border-red-700',
        text:      'text-red-300',
        textMuted: 'text-red-400',
        textHover: 'hover:text-red-200',
      };
    case 'WARNING':
      return {
        bg30:      'bg-orange-900/30',
        bg20:      'bg-orange-900/20',
        border:    'border-orange-700',
        text:      'text-orange-300',
        textMuted: 'text-orange-400',
        textHover: 'hover:text-orange-200',
      };
    default: // CAUTION or null
      return {
        bg30:      'bg-yellow-900/30',
        bg20:      'bg-yellow-900/20',
        border:    'border-yellow-700',
        text:      'text-yellow-300',
        textMuted: 'text-yellow-400',
        textHover: 'hover:text-yellow-200',
      };
  }
}
