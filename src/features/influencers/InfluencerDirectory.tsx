import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
} from '../../components/ui';
import { PlatformIcon, PlusIcon, XIcon, SearchIcon } from '../../components/common';
import { cx } from '../../lib/utils';
import { ALL_PLATFORMS } from '../../constants';
import type {
  Influencer,
  InfluencerStatus,
  InfluencerInteraction,
  InfluencerInteractionType,
} from '../../types/models';

export interface InfluencerDirectoryProps {
  /** All influencers */
  influencers: Influencer[];
  /** Callback when influencer is added/updated */
  onSave: (influencer: Influencer) => void;
  /** Callback when influencer is deleted */
  onDelete: (id: string) => void;
  /** Current user for tracking who creates records */
  currentUser: string;
}

const STATUS_OPTIONS: { value: InfluencerStatus; label: string; color: string }[] = [
  { value: 'watching', label: 'Watching', color: 'bg-graystone-100 text-graystone-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-amber-100 text-amber-700' },
  { value: 'in_discussion', label: 'In Discussion', color: 'bg-ocean-100 text-ocean-700' },
  { value: 'partnered', label: 'Partnered', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'declined', label: 'Declined', color: 'bg-red-100 text-red-700' },
  { value: 'past_partner', label: 'Past Partner', color: 'bg-graystone-200 text-graystone-600' },
];

const INTERACTION_TYPES: { value: InfluencerInteractionType; label: string }[] = [
  { value: 'outreach', label: 'Outreach' },
  { value: 'response', label: 'Response' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'note', label: 'Note' },
];

function generateId(): string {
  return `inf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface InfluencerFormData {
  name: string;
  handles: Record<string, string>;
  niche: string;
  followerCount: string;
  contactInfo: string;
  notes: string;
  status: InfluencerStatus;
  nextAction: string;
  nextActionDate: string;
  audienceAlignmentRating: string;
  audienceAlignmentNotes: string;
  tags: string;
  source: string;
}

const emptyForm: InfluencerFormData = {
  name: '',
  handles: {},
  niche: '',
  followerCount: '',
  contactInfo: '',
  notes: '',
  status: 'watching',
  nextAction: '',
  nextActionDate: '',
  audienceAlignmentRating: '',
  audienceAlignmentNotes: '',
  tags: '',
  source: '',
};

export function InfluencerDirectory({
  influencers,
  onSave,
  onDelete,
  currentUser,
}: InfluencerDirectoryProps): React.ReactElement {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<InfluencerFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<InfluencerStatus | 'all'>('all');
  const [handlePlatform, setHandlePlatform] = useState('');
  const [handleValue, setHandleValue] = useState('');

  // Filter influencers
  const filteredInfluencers = useMemo(() => {
    let result = [...influencers];

    if (filterStatus !== 'all') {
      result = result.filter((i) => i.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          i.niche?.toLowerCase().includes(query) ||
          i.tags?.some((t) => t.toLowerCase().includes(query)) ||
          Object.values(i.handles).some((h) => h.toLowerCase().includes(query)),
      );
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [influencers, filterStatus, searchQuery]);

  const handleAddHandle = () => {
    if (!handlePlatform || !handleValue.trim()) return;
    setForm((prev) => ({
      ...prev,
      handles: { ...prev.handles, [handlePlatform]: handleValue.trim() },
    }));
    setHandlePlatform('');
    setHandleValue('');
  };

  const handleRemoveHandle = (platform: string) => {
    setForm((prev) => {
      const next = { ...prev.handles };
      delete next[platform];
      return { ...prev, handles: next };
    });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    const timestamp = new Date().toISOString();
    const influencer: Influencer = {
      id: editingId || generateId(),
      name: form.name.trim(),
      handles: form.handles,
      niche: form.niche || undefined,
      followerCount: form.followerCount ? Number(form.followerCount) : undefined,
      contactInfo: form.contactInfo || undefined,
      notes: form.notes || undefined,
      status: form.status,
      nextAction: form.nextAction || undefined,
      nextActionDate: form.nextActionDate || undefined,
      interactions: editingId
        ? influencers.find((i) => i.id === editingId)?.interactions || []
        : [],
      audienceAlignmentRating: form.audienceAlignmentRating
        ? Number(form.audienceAlignmentRating)
        : undefined,
      audienceAlignmentNotes: form.audienceAlignmentNotes || undefined,
      tags: form.tags
        ? form.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
      source: form.source || undefined,
      createdAt: editingId
        ? influencers.find((i) => i.id === editingId)?.createdAt || timestamp
        : timestamp,
      updatedAt: timestamp,
    };

    onSave(influencer);
    setForm(emptyForm);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (influencer: Influencer) => {
    setForm({
      name: influencer.name,
      handles: { ...influencer.handles },
      niche: influencer.niche || '',
      followerCount: influencer.followerCount !== undefined ? String(influencer.followerCount) : '',
      contactInfo: influencer.contactInfo || '',
      notes: influencer.notes || '',
      status: influencer.status,
      nextAction: influencer.nextAction || '',
      nextActionDate: influencer.nextActionDate || '',
      audienceAlignmentRating:
        influencer.audienceAlignmentRating !== undefined
          ? String(influencer.audienceAlignmentRating)
          : '',
      audienceAlignmentNotes: influencer.audienceAlignmentNotes || '',
      tags: influencer.tags?.join(', ') || '',
      source: influencer.source || '',
    });
    setEditingId(influencer.id);
    setIsAdding(true);
    setSelectedInfluencer(null);
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setIsAdding(false);
    setEditingId(null);
  };

  // Add interaction
  const [interactionForm, setInteractionForm] = useState({
    type: 'note' as InfluencerInteractionType,
    summary: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleAddInteraction = () => {
    if (!selectedInfluencer || !interactionForm.summary.trim()) return;

    const interaction: InfluencerInteraction = {
      id: `int-${Date.now()}`,
      type: interactionForm.type,
      summary: interactionForm.summary.trim(),
      date: interactionForm.date,
      createdBy: currentUser,
    };

    const updated: Influencer = {
      ...selectedInfluencer,
      interactions: [...selectedInfluencer.interactions, interaction],
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    setSelectedInfluencer(updated);
    setInteractionForm({ type: 'note', summary: '', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(300px,1fr)_minmax(400px,2fr)]">
      {/* List Panel */}
      <Card className="shadow-lg">
        <CardHeader className="border-b border-graystone-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-ocean-900">Influencer Directory</CardTitle>
            {!isAdding && (
              <Button size="sm" onClick={() => setIsAdding(true)}>
                <PlusIcon className="mr-1 h-4 w-4" />
                Add
              </Button>
            )}
          </div>
          {/* Search and Filter */}
          <div className="mt-3 space-y-2">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-graystone-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search influencers..."
                className="pl-8"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as InfluencerStatus | 'all')}
              className="w-full rounded-lg border border-graystone-300 px-2 py-1.5 text-sm"
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="max-h-[600px] overflow-y-auto">
          {/* Add/Edit Form */}
          {isAdding && (
            <div className="mb-4 rounded-lg border border-ocean-200 bg-ocean-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-ocean-900">
                  {editingId ? 'Edit Influencer' : 'Add New Influencer'}
                </h4>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Influencer name"
                    className="mt-1"
                  />
                </div>

                {/* Handles */}
                <div>
                  <Label className="text-xs">Social Handles</Label>
                  <div className="mt-1 flex gap-2">
                    <select
                      value={handlePlatform}
                      onChange={(e) => setHandlePlatform(e.target.value)}
                      className="rounded-lg border border-graystone-300 px-2 py-1 text-xs"
                    >
                      <option value="">Platform</option>
                      {ALL_PLATFORMS.filter((p) => !form.handles[p]).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={handleValue}
                      onChange={(e) => setHandleValue(e.target.value)}
                      placeholder="@handle"
                      className="flex-1 text-xs"
                    />
                    <Button size="sm" onClick={handleAddHandle} disabled={!handlePlatform}>
                      Add
                    </Button>
                  </div>
                  {Object.entries(form.handles).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(form.handles).map(([platform, handle]) => (
                        <Badge key={platform} variant="secondary" className="text-xs">
                          <PlatformIcon platform={platform} size="xs" className="mr-1" />
                          {handle}
                          <button
                            type="button"
                            onClick={() => handleRemoveHandle(platform)}
                            className="ml-1 text-graystone-400 hover:text-graystone-600"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Niche</Label>
                    <Input
                      value={form.niche}
                      onChange={(e) => setForm({ ...form, niche: e.target.value })}
                      placeholder="e.g., Environment"
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Follower Count</Label>
                    <Input
                      type="number"
                      value={form.followerCount}
                      onChange={(e) => setForm({ ...form, followerCount: e.target.value })}
                      placeholder="e.g., 50000"
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as InfluencerStatus })
                    }
                    className="mt-1 w-full rounded-lg border border-graystone-300 px-2 py-1 text-xs"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs">Tags (comma-separated)</Label>
                  <Input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="sustainability, vegan, etc."
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Notes</Label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-graystone-300 px-2 py-1 text-xs"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSubmit} disabled={!form.name.trim()}>
                    {editingId ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Influencer List */}
          {filteredInfluencers.length === 0 ? (
            <p className="py-4 text-center text-sm text-graystone-500">
              {searchQuery || filterStatus !== 'all'
                ? 'No influencers match your filters.'
                : 'No influencers added yet.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredInfluencers.map((influencer) => {
                const statusOption = STATUS_OPTIONS.find((s) => s.value === influencer.status);
                return (
                  <button
                    key={influencer.id}
                    type="button"
                    onClick={() => setSelectedInfluencer(influencer)}
                    className={cx(
                      'w-full rounded-lg border px-3 py-2 text-left transition',
                      selectedInfluencer?.id === influencer.id
                        ? 'border-ocean-300 bg-ocean-50'
                        : 'border-graystone-200 bg-white hover:border-graystone-300',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-graystone-700">
                        {influencer.name}
                      </span>
                      <Badge className={cx('text-[10px]', statusOption?.color)}>
                        {statusOption?.label}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {Object.keys(influencer.handles)
                        .slice(0, 3)
                        .map((p) => (
                          <PlatformIcon key={p} platform={p} size="xs" />
                        ))}
                      {influencer.niche && (
                        <span className="text-[10px] text-graystone-400">{influencer.niche}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Panel */}
      <Card className="shadow-lg">
        <CardContent>
          {selectedInfluencer ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-ocean-900">
                    {selectedInfluencer.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    {Object.entries(selectedInfluencer.handles).map(([platform, handle]) => (
                      <Badge key={platform} variant="outline" className="text-xs">
                        <PlatformIcon platform={platform} size="xs" className="mr-1" />
                        {handle}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(selectedInfluencer)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Delete this influencer?')) {
                        onDelete(selectedInfluencer.id);
                        setSelectedInfluencer(null);
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-graystone-500">Status</span>
                  <div>
                    <Badge
                      className={cx(
                        STATUS_OPTIONS.find((s) => s.value === selectedInfluencer.status)?.color,
                      )}
                    >
                      {STATUS_OPTIONS.find((s) => s.value === selectedInfluencer.status)?.label}
                    </Badge>
                  </div>
                </div>
                {selectedInfluencer.followerCount !== undefined && (
                  <div>
                    <span className="text-xs text-graystone-500">Followers</span>
                    <div className="font-medium">
                      {selectedInfluencer.followerCount.toLocaleString()}
                    </div>
                  </div>
                )}
                {selectedInfluencer.niche && (
                  <div>
                    <span className="text-xs text-graystone-500">Niche</span>
                    <div>{selectedInfluencer.niche}</div>
                  </div>
                )}
                {selectedInfluencer.audienceAlignmentRating !== undefined && (
                  <div>
                    <span className="text-xs text-graystone-500">Audience Alignment</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={cx(
                            'text-lg',
                            n <= (selectedInfluencer.audienceAlignmentRating || 0)
                              ? 'text-amber-400'
                              : 'text-graystone-200',
                          )}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedInfluencer.tags && selectedInfluencer.tags.length > 0 && (
                <div>
                  <span className="text-xs text-graystone-500">Tags</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedInfluencer.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedInfluencer.notes && (
                <div>
                  <span className="text-xs text-graystone-500">Notes</span>
                  <p className="mt-1 text-sm text-graystone-700">{selectedInfluencer.notes}</p>
                </div>
              )}

              {/* Interactions */}
              <div className="border-t border-graystone-200 pt-4">
                <h4 className="mb-2 text-sm font-semibold text-graystone-700">
                  Interactions ({selectedInfluencer.interactions.length})
                </h4>

                {/* Add Interaction Form */}
                <div className="mb-3 rounded-lg border border-graystone-200 bg-graystone-50 p-2">
                  <div className="flex gap-2">
                    <select
                      value={interactionForm.type}
                      onChange={(e) =>
                        setInteractionForm({
                          ...interactionForm,
                          type: e.target.value as InfluencerInteractionType,
                        })
                      }
                      className="rounded border border-graystone-300 px-2 py-1 text-xs"
                    >
                      {INTERACTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="date"
                      value={interactionForm.date}
                      onChange={(e) =>
                        setInteractionForm({ ...interactionForm, date: e.target.value })
                      }
                      className="w-32 text-xs"
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={interactionForm.summary}
                      onChange={(e) =>
                        setInteractionForm({ ...interactionForm, summary: e.target.value })
                      }
                      placeholder="Summary of interaction..."
                      className="flex-1 text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddInteraction}
                      disabled={!interactionForm.summary.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Interaction List */}
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {selectedInfluencer.interactions.length === 0 ? (
                    <p className="text-center text-xs text-graystone-500">
                      No interactions logged.
                    </p>
                  ) : (
                    [...selectedInfluencer.interactions]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((interaction) => (
                        <div
                          key={interaction.id}
                          className="rounded border border-graystone-200 bg-white px-2 py-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px]">
                              {INTERACTION_TYPES.find((t) => t.value === interaction.type)?.label}
                            </Badge>
                            <span className="text-[10px] text-graystone-400">
                              {interaction.date}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-graystone-600">{interaction.summary}</p>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-graystone-500">
              Select an influencer to view details
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InfluencerDirectory;
