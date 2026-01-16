import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Input, Label, Textarea, Badge } from '../../components/ui';
import { TrashIcon, PlatformIcon } from '../../components/common';
import { cx, uuid } from '../../lib/utils';
import { selectBaseClasses } from '../../lib/styles';
import {
  ALL_PLATFORMS,
  INFLUENCER_STATUSES,
  INFLUENCER_NICHES,
  INFLUENCER_STATUS_COLORS,
} from '../../constants';
import type { Influencer, Entry, InfluencerStatus } from '../../types/models';

export interface InfluencerModalProps {
  open: boolean;
  influencer: Influencer | null;
  entries: Entry[];
  currentUser: string;
  onClose: () => void;
  onSave: (influencer: Influencer) => void;
  onDelete: (id: string) => void;
  onLinkEntry: (influencerId: string, entryId: string) => void;
  onUnlinkEntry: (entryId: string) => void;
}

const emptyInfluencer = (): Omit<Influencer, 'id' | 'createdAt' | 'createdBy'> => ({
  name: '',
  handle: '',
  profileUrl: '',
  platform: 'Instagram',
  followerCount: 0,
  engagementRate: undefined,
  contactEmail: '',
  niche: '',
  estimatedRate: undefined,
  notes: '',
  status: 'Discovery',
});

export const InfluencerModal: React.FC<InfluencerModalProps> = ({
  open,
  influencer,
  entries,
  currentUser,
  onClose,
  onSave,
  onDelete,
  onLinkEntry,
  onUnlinkEntry,
}) => {
  const isNew = !influencer;
  const [draft, setDraft] =
    useState<Omit<Influencer, 'id' | 'createdAt' | 'createdBy'>>(emptyInfluencer());
  const [showLinkPicker, setShowLinkPicker] = useState(false);

  useEffect(() => {
    if (open) {
      if (influencer) {
        const { id, createdAt, createdBy, ...rest } = influencer;
        setDraft(rest);
      } else {
        setDraft(emptyInfluencer());
      }
      setShowLinkPicker(false);
    }
  }, [open, influencer]);

  const linkedEntries = useMemo(
    () => (influencer ? entries.filter((e) => e.influencerId === influencer.id) : []),
    [entries, influencer],
  );

  const availableEntries = useMemo(
    () => entries.filter((e) => !e.influencerId && !e.deletedAt),
    [entries],
  );

  const handleFieldChange = (field: keyof typeof draft, value: unknown) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!draft.name.trim()) return;

    const saved: Influencer = influencer
      ? { ...influencer, ...draft }
      : {
          id: uuid(),
          createdAt: new Date().toISOString(),
          createdBy: currentUser,
          ...draft,
        };
    onSave(saved);
    onClose();
  };

  const handleDelete = () => {
    if (influencer && window.confirm('Delete this influencer? This cannot be undone.')) {
      onDelete(influencer.id);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="influencer-modal-title">
      <div className="flex h-full max-h-[85vh] flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-graystone-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              id="influencer-modal-title"
              className="heading-font text-lg font-semibold text-ocean-900"
            >
              {isNew ? 'Add Influencer' : draft.name || 'Edit Influencer'}
            </div>
            {!isNew && (
              <Badge className={INFLUENCER_STATUS_COLORS[draft.status as InfluencerStatus]}>
                {draft.status}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <Button variant="ghost" size="sm" onClick={handleDelete}>
                <TrashIcon className="h-4 w-4 text-red-500" />
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!draft.name.trim()}>
              {isNew ? 'Add' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left column - Basic info */}
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Influencer name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Platform</Label>
                  <select
                    value={draft.platform}
                    onChange={(e) => handleFieldChange('platform', e.target.value)}
                    className={cx(selectBaseClasses, 'w-full px-3 py-2')}
                  >
                    {ALL_PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Handle</Label>
                  <Input
                    value={draft.handle}
                    onChange={(e) => handleFieldChange('handle', e.target.value)}
                    placeholder="@username"
                  />
                </div>
              </div>

              <div>
                <Label>Profile URL</Label>
                <Input
                  value={draft.profileUrl}
                  onChange={(e) => handleFieldChange('profileUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Followers</Label>
                  <Input
                    type="number"
                    value={draft.followerCount || ''}
                    onChange={(e) =>
                      handleFieldChange('followerCount', parseInt(e.target.value) || 0)
                    }
                    placeholder="10000"
                  />
                </div>
                <div>
                  <Label>Engagement Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={draft.engagementRate ?? ''}
                    onChange={(e) =>
                      handleFieldChange(
                        'engagementRate',
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    placeholder="3.5"
                  />
                </div>
              </div>
            </div>

            {/* Right column - Business info */}
            <div className="space-y-4">
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={draft.contactEmail}
                  onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Niche</Label>
                  <select
                    value={draft.niche}
                    onChange={(e) => handleFieldChange('niche', e.target.value)}
                    className={cx(selectBaseClasses, 'w-full px-3 py-2')}
                  >
                    <option value="">Select niche</option>
                    {INFLUENCER_NICHES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Est. Rate ($)</Label>
                  <Input
                    type="number"
                    value={draft.estimatedRate ?? ''}
                    onChange={(e) =>
                      handleFieldChange(
                        'estimatedRate',
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                    placeholder="500"
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <select
                  value={draft.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className={cx(selectBaseClasses, 'w-full px-3 py-2')}
                >
                  {INFLUENCER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={draft.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  rows={3}
                  placeholder="Additional notes about this influencer..."
                />
              </div>
            </div>
          </div>

          {/* Linked Entries Section (only for existing influencers) */}
          {!isNew && influencer && (
            <div className="mt-6 border-t border-graystone-200 pt-6">
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-base">Linked Content ({linkedEntries.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLinkPicker(!showLinkPicker)}
                >
                  {showLinkPicker ? 'Cancel' : 'Link Entry'}
                </Button>
              </div>

              {showLinkPicker && (
                <div className="mb-4 rounded-xl border border-aqua-200 bg-aqua-50 p-3">
                  <Label className="mb-2 block text-sm">Select entry to link:</Label>
                  <select
                    className={cx(selectBaseClasses, 'w-full px-3 py-2')}
                    onChange={(e) => {
                      if (e.target.value) {
                        onLinkEntry(influencer.id, e.target.value);
                        setShowLinkPicker(false);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Choose an entry...</option>
                    {availableEntries.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.date} - {entry.caption?.slice(0, 50) || 'No caption'}...
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {linkedEntries.length > 0 ? (
                <div className="space-y-2">
                  {linkedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl border border-graystone-200 bg-white p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {entry.platforms.map((p) => (
                            <span key={p}>
                              <PlatformIcon platform={p} size="sm" />
                            </span>
                          ))}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{entry.date}</div>
                          <div className="text-xs text-graystone-500">
                            {entry.caption?.slice(0, 60) || 'No caption'}...
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => onUnlinkEntry(entry.id)}>
                        Unlink
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-graystone-500">
                  No content linked yet. Link entries to track influencer performance.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
