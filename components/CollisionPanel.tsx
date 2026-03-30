'use client';

// CollisionPanel — modal showing detailed collision warnings for waypoints.
// Grouped by severity: DANGER → WARNING → CAUTION.
// Shown when user clicks "Zobrazit detail" in the collision banner.

import { Collision, Severity, highestSeverity } from '@/lib/collisionDetection';
import { severityClasses } from '@/lib/severityColor';

interface CollisionPanelProps {
  collisions: Collision[];
  onClose: () => void;
}

const SEVERITY_CONFIG: Record<Severity, { label: string; icon: string; bg: string; border: string; text: string }> = {
  DANGER:  { label: 'Zakázaná zóna',    icon: '⛔', bg: 'bg-red-900/30',    border: 'border-red-700',    text: 'text-red-300' },
  WARNING: { label: 'Omezená zóna',     icon: '⚠️', bg: 'bg-orange-900/30', border: 'border-orange-700', text: 'text-orange-300' },
  CAUTION: { label: 'Zvýšená opatrnost', icon: 'ℹ️', bg: 'bg-yellow-900/30', border: 'border-yellow-700', text: 'text-yellow-300' },
};

const SEVERITY_ORDER: Severity[] = ['DANGER', 'WARNING', 'CAUTION'];

export default function CollisionPanel({ collisions, onClose }: CollisionPanelProps) {
  const top = highestSeverity(collisions);
  const sc = severityClasses(top);

  // Group collisions by severity
  const grouped = SEVERITY_ORDER
    .map((sev) => ({ sev, items: collisions.filter((c) => c.severity === sev) }))
    .filter(({ items }) => items.length > 0);

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative bg-[#0f1117] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-700 rounded-t-xl ${sc.bg20}`}>
          <div>
            <h2 className="text-sm font-semibold text-white">
              Varování kolizí ({collisions.length})
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {collisions.length} waypointů v omezených zónách
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
            aria-label="Zavřít"
          >
            ✕
          </button>
        </div>

        {/* Collision list — scrollable */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
          {grouped.map(({ sev, items }) => {
            const cfg = SEVERITY_CONFIG[sev];
            return (
              <div key={sev}>
                {/* Severity group header */}
                <div className={`flex items-center gap-1.5 mb-2 text-xs font-semibold ${cfg.text}`}>
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                  <span className="text-gray-500 font-normal">({items.length})</span>
                </div>

                {/* Individual collision cards */}
                <div className="space-y-2">
                  {items.map((c, idx) => (
                    <div
                      key={`${c.waypointId}-${c.zoneName}-${idx}`}
                      className={`rounded-lg p-3 border ${cfg.bg} ${cfg.border}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-white text-xs font-medium leading-snug">
                          {c.zoneName}
                        </span>
                        <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded border ${cfg.border} ${cfg.text} bg-black/20`}>
                          WP {c.waypointIndex + 1}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mb-1.5">
                        Typ zóny: <span className="text-gray-300">{c.zoneType}</span>
                      </p>
                      <p className="text-xs leading-relaxed text-gray-300">
                        {c.instructions}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-700 flex-shrink-0">
          <p className="text-xs text-gray-500 mb-2">
            Ověřte podmínky před letem:{' '}
            <a
              href="https://www.dronemap.gov.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              dronemap.gov.cz
            </a>
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-[#1a1d27] text-gray-300 text-sm rounded-lg border border-gray-600 hover:border-gray-400 transition-colors"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
}
