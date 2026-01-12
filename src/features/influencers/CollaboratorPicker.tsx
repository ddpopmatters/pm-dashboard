import React, { useState, useMemo } from 'react';
import { Button, Badge, Input } from '../../components/ui';
import { XIcon } from '../../components/common';
import { cx } from '../../lib/utils';
import type { Influencer } from '../../types/models';

export interface CollaboratorPickerProps {
  /** All available influencers */
  influencers: Influencer[];
  /** Currently selected collaborator IDs */
  selectedIds: string[];
  /** Callback when selection changes */
  onChange: (ids: string[]) => void;
  /** Optional label */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Component for selecting influencer collaborators on entries
 */
export function CollaboratorPicker({
  influencers,
  selectedIds,
  onChange,
  label = 'Collaborators',
  disabled,
}: CollaboratorPickerProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Get selected influencers
  const selectedInfluencers = useMemo(() => {
    const idSet = new Set(selectedIds);
    return influencers.filter((inf) => idSet.has(inf.id));
  }, [influencers, selectedIds]);

  // Filter available influencers by search query
  const filteredInfluencers = useMemo(() => {
    if (!searchQuery.trim()) return influencers;
    const query = searchQuery.toLowerCase();
    return influencers.filter(
      (inf) =>
        inf.name.toLowerCase().includes(query) ||
        inf.niche?.toLowerCase().includes(query) ||
        Object.values(inf.handles).some((h) => h.toLowerCase().includes(query)),
    );
  }, [influencers, searchQuery]);

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
    setSearchQuery('');
  };

  const handleRemove = (id: string) => {
    onChange(selectedIds.filter((sid) => sid !== id));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-graystone-700">{label}</label>

      {/* Selected collaborators */}
      {selectedInfluencers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedInfluencers.map((inf) => (
            <Badge key={inf.id} variant="secondary" className="flex items-center gap-1 pr-1">
              <span>{inf.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(inf.id)}
                  className="ml-1 rounded-full p-0.5 hover:bg-graystone-200"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      {!disabled && (
        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder="Search influencers..."
            className="w-full"
          />

          {/* Dropdown */}
          {isOpen && filteredInfluencers.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-graystone-200 bg-white shadow-lg">
              {filteredInfluencers.slice(0, 10).map((inf) => {
                const isSelected = selectedIds.includes(inf.id);
                return (
                  <button
                    key={inf.id}
                    type="button"
                    onClick={() => handleSelect(inf.id)}
                    className={cx(
                      'w-full px-3 py-2 text-left text-sm hover:bg-graystone-50',
                      isSelected && 'bg-ocean-50',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{inf.name}</span>
                        {inf.niche && <span className="ml-2 text-graystone-500">{inf.niche}</span>}
                      </div>
                      {isSelected && <span className="text-ocean-600">✓</span>}
                    </div>
                    <div className="text-xs text-graystone-400">
                      {Object.entries(inf.handles)
                        .slice(0, 2)
                        .map(([platform, handle]) => `${platform}: @${handle}`)
                        .join(' | ')}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {influencers.length === 0 && (
        <p className="text-sm text-graystone-500">
          No influencers in directory. Add influencers first.
        </p>
      )}
    </div>
  );
}

export default CollaboratorPicker;
