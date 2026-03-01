import React, { useState } from 'react';
import { cx } from '../../lib/utils';
import { FULL_ASSESSMENT_LEVELS } from '../../constants';

export interface FullAssessmentScores {
  mission?: number;
  platform?: number;
  engagement?: number;
  voice?: number;
  pillar?: number;
}

export interface FullAssessmentProps {
  scores: FullAssessmentScores;
  onChange: (scores: FullAssessmentScores) => void;
  readOnly?: boolean;
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Fails',
  2: 'Weak',
  3: 'Adequate',
  4: 'Strong',
  5: 'Excellent',
};

const SCORE_COLORS: Record<number, string> = {
  1: 'bg-red-500 text-white',
  2: 'bg-amber-400 text-white',
  3: 'bg-yellow-400 text-graystone-800',
  4: 'bg-emerald-400 text-white',
  5: 'bg-emerald-600 text-white',
};

export function FullAssessment({
  scores,
  onChange,
  readOnly = false,
}: FullAssessmentProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  const scoredCount = FULL_ASSESSMENT_LEVELS.filter(
    (level) => scores[level.key as keyof FullAssessmentScores] !== undefined,
  ).length;
  const avgScore =
    scoredCount > 0
      ? FULL_ASSESSMENT_LEVELS.reduce(
          (sum, level) => sum + (scores[level.key as keyof FullAssessmentScores] || 0),
          0,
        ) / scoredCount
      : 0;

  const setScore = (key: string, value: number) => {
    if (readOnly) return;
    onChange({ ...scores, [key]: value });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-graystone-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ocean-700">Content Assessment</h3>
          {scoredCount > 0 && (
            <span
              className={cx(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                avgScore >= 4
                  ? 'bg-emerald-100 text-emerald-700'
                  : avgScore >= 3
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700',
              )}
            >
              {avgScore.toFixed(1)} avg ({scoredCount}/5)
            </span>
          )}
        </div>
        <span className="text-xs text-graystone-400">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="space-y-3 pt-1">
          <p className="text-xs text-graystone-500">
            Score each dimension 1-5. Level 1 (Mission Alignment) must pass before other levels
            matter.
          </p>
          {FULL_ASSESSMENT_LEVELS.map((level) => {
            const currentScore = scores[level.key as keyof FullAssessmentScores];
            return (
              <div key={level.key} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-graystone-700">{level.label}</span>
                  {level.mustPass && (
                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                      Must pass
                    </span>
                  )}
                  {currentScore !== undefined && (
                    <span className="text-[11px] text-graystone-500">
                      {SCORE_LABELS[currentScore]}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-graystone-500">{level.description}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={readOnly}
                      onClick={() => setScore(level.key, n)}
                      title={`${n} — ${SCORE_LABELS[n]}`}
                      className={cx(
                        'h-7 w-7 rounded-md text-xs font-semibold transition-colors',
                        currentScore === n
                          ? SCORE_COLORS[n]
                          : 'bg-graystone-100 text-graystone-500 hover:bg-graystone-200',
                        readOnly && 'cursor-default',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FullAssessment;
