import React from 'react';

export interface MentionSuggestionListProps {
  /** List of name suggestions to display */
  suggestions: string[] | null | undefined;
  /** Callback when a suggestion is selected */
  onSelect?: (name: string) => void;
}

/**
 * MentionSuggestionList - Autocomplete dropdown for @mentions
 */
export const MentionSuggestionList: React.FC<MentionSuggestionListProps> = ({
  suggestions,
  onSelect,
}) => {
  if (!suggestions || !suggestions.length) return null;

  return (
    <div className="pointer-events-auto absolute inset-x-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-graystone-200 bg-white shadow-lg">
      {suggestions.map((name) => (
        <button
          type="button"
          key={name}
          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-graystone-700 hover:bg-aqua-50"
          onMouseDown={(event) => {
            event.preventDefault();
            onSelect?.(name);
          }}
        >
          <span>@{name}</span>
        </button>
      ))}
    </div>
  );
};

export default MentionSuggestionList;
