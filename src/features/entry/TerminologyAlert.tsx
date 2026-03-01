import React from 'react';
import type { TerminologyMatch } from '../../lib/terminology';

export interface TerminologyAlertProps {
  matches: TerminologyMatch[];
}

export function TerminologyAlert({ matches }: TerminologyAlertProps): React.ReactElement | null {
  if (matches.length === 0) return null;

  // Deduplicate by term (case-insensitive)
  const seen = new Set<string>();
  const unique = matches.filter((m) => {
    const key = m.term.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs">
      <div className="mb-1 font-semibold text-red-700">Terminology warning</div>
      <ul className="space-y-1">
        {unique.map((m, idx) => (
          <li key={idx} className="text-red-600">
            <span className="font-medium">&ldquo;{m.term}&rdquo;</span>
            {' → '}
            <span className="text-graystone-700">{m.useInstead}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TerminologyAlert;
