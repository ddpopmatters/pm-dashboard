import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Input, Badge, Button } from '../../components/ui';
import { PlatformIcon, SearchIcon, XIcon } from '../../components/common';
import { cx } from '../../lib/utils';
import type { Entry, Idea, Influencer } from '../../types/models';

export interface GlobalSearchProps {
  /** All entries to search */
  entries: Entry[];
  /** All ideas to search */
  ideas: Idea[];
  /** All influencers to search */
  influencers?: Influencer[];
  /** Callback when entry is selected */
  onSelectEntry: (id: string) => void;
  /** Callback when idea is selected */
  onSelectIdea?: (id: string) => void;
  /** Callback when influencer is selected */
  onSelectInfluencer?: (id: string) => void;
}

type SearchResultType = 'entry' | 'idea' | 'influencer';

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  badges?: string[];
  platform?: string;
}

function normalizeText(text: string | undefined | null): string {
  return (text || '').toLowerCase().trim();
}

function matchScore(text: string, query: string): number {
  const normalized = normalizeText(text);
  if (!normalized || !query) return 0;
  if (normalized === query) return 100;
  if (normalized.startsWith(query)) return 80;
  if (normalized.includes(query)) return 60;
  return 0;
}

export function GlobalSearch({
  entries,
  ideas,
  influencers = [],
  onSelectEntry,
  onSelectIdea,
  onSelectInfluencer,
}: GlobalSearchProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search results
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];

    const normalizedQuery = normalizeText(query);
    const searchResults: (SearchResult & { score: number })[] = [];

    // Search entries
    entries.forEach((entry) => {
      if (entry.deletedAt) return;
      const captionScore = matchScore(entry.caption, normalizedQuery);
      const authorScore = matchScore(entry.author, normalizedQuery);
      const campaignScore = matchScore(entry.campaign, normalizedQuery);
      const pillarScore = matchScore(entry.contentPillar, normalizedQuery);
      const platformScore = entry.platforms.some((p) => matchScore(p, normalizedQuery) > 0)
        ? 50
        : 0;

      const score = Math.max(captionScore, authorScore, campaignScore, pillarScore, platformScore);

      if (score > 0) {
        searchResults.push({
          id: entry.id,
          type: 'entry',
          title: entry.caption || 'Untitled entry',
          subtitle: `${entry.assetType} | ${entry.date}`,
          badges: entry.platforms.slice(0, 2),
          platform: entry.platforms[0],
          score,
        });
      }
    });

    // Search ideas
    ideas.forEach((idea) => {
      const titleScore = matchScore(idea.title, normalizedQuery);
      const notesScore = matchScore(idea.notes, normalizedQuery);

      const score = Math.max(titleScore, notesScore);

      if (score > 0) {
        searchResults.push({
          id: idea.id,
          type: 'idea',
          title: idea.title,
          subtitle: idea.notes?.slice(0, 50) || 'No notes',
          badges: [idea.type],
          score,
        });
      }
    });

    // Search influencers
    influencers.forEach((influencer) => {
      const nameScore = matchScore(influencer.name, normalizedQuery);
      const nicheScore = matchScore(influencer.niche, normalizedQuery);
      const handleScore = Object.values(influencer.handles).some(
        (h) => matchScore(h, normalizedQuery) > 0,
      )
        ? 50
        : 0;
      const tagScore = influencer.tags?.some((t) => matchScore(t, normalizedQuery) > 0) ? 40 : 0;

      const score = Math.max(nameScore, nicheScore, handleScore, tagScore);

      if (score > 0) {
        searchResults.push({
          id: influencer.id,
          type: 'influencer',
          title: influencer.name,
          subtitle: influencer.niche || influencer.status,
          badges: Object.keys(influencer.handles).slice(0, 2),
          score,
        });
      }
    });

    // Sort by score and limit
    return searchResults.sort((a, b) => b.score - a.score).slice(0, 20);
  }, [entries, ideas, influencers, query]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (results.length > 0) {
            setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (results.length > 0) {
            setSelectedIndex((i) => Math.max(i - 1, 0));
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
      }
    },
    [results, selectedIndex],
  );

  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'entry':
        onSelectEntry(result.id);
        break;
      case 'idea':
        onSelectIdea?.(result.id);
        break;
      case 'influencer':
        onSelectInfluencer?.(result.id);
        break;
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 text-graystone-500"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden rounded bg-graystone-100 px-1.5 py-0.5 text-[10px] font-medium text-graystone-500 md:inline">
          {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
        </kbd>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Search Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        className="relative w-full max-w-xl rounded-xl border border-graystone-200 bg-white shadow-2xl"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-graystone-200 px-4 py-3">
          <SearchIcon className="h-5 w-5 text-graystone-400" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search entries, ideas, influencers..."
            className="flex-1 border-0 p-0 text-base focus:ring-0"
          />
          <Button variant="ghost" size="sm" onClick={handleClose} aria-label="Close search">
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-sm text-graystone-500">
              Start typing to search...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-graystone-500">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cx(
                    'w-full rounded-lg px-3 py-2 text-left transition',
                    selectedIndex === index
                      ? 'bg-ocean-50 text-ocean-900'
                      : 'hover:bg-graystone-50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Type indicator */}
                      <span
                        className={cx(
                          'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
                          result.type === 'entry' && 'bg-ocean-100 text-ocean-700',
                          result.type === 'idea' && 'bg-amber-100 text-amber-700',
                          result.type === 'influencer' && 'bg-emerald-100 text-emerald-700',
                        )}
                      >
                        {result.type}
                      </span>
                      {/* Platform icons */}
                      {result.badges?.map((badge) => (
                        <PlatformIcon key={badge} platform={badge} size="xs" />
                      ))}
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="line-clamp-1 text-sm font-medium">{result.title}</p>
                    {result.subtitle && (
                      <p className="line-clamp-1 text-xs text-graystone-500">{result.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="border-t border-graystone-200 px-4 py-2 text-xs text-graystone-500">
            <kbd className="rounded bg-graystone-100 px-1 py-0.5">↑↓</kbd> to navigate,{' '}
            <kbd className="rounded bg-graystone-100 px-1 py-0.5">↵</kbd> to select,{' '}
            <kbd className="rounded bg-graystone-100 px-1 py-0.5">esc</kbd> to close
          </div>
        )}
      </div>
    </div>
  );
}

export default GlobalSearch;
