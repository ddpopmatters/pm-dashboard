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
import { PlatformIcon, PlusIcon, XIcon } from '../../components/common';
import { cx } from '../../lib/utils';
import { ALL_PLATFORMS } from '../../constants';
import type { PageMetrics } from '../../types/models';

export interface PageMetricsPanelProps {
  /** All page metrics data */
  metrics: PageMetrics[];
  /** Callback when metrics are added/updated */
  onSave: (metric: PageMetrics) => void;
  /** Callback when metric is deleted */
  onDelete: (id: string) => void;
}

function generateId(): string {
  return `pm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

interface MetricFormData {
  platform: string;
  month: string;
  followers: string;
  followersChange: string;
  reach: string;
  impressions: string;
  profileVisits: string;
  engagementRate: string;
  notes: string;
}

const emptyForm: MetricFormData = {
  platform: '',
  month: getCurrentMonth(),
  followers: '',
  followersChange: '',
  reach: '',
  impressions: '',
  profileVisits: '',
  engagementRate: '',
  notes: '',
};

export function PageMetricsPanel({
  metrics,
  onSave,
  onDelete,
}: PageMetricsPanelProps): React.ReactElement {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<MetricFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Group metrics by month
  const metricsByMonth = useMemo(() => {
    const groups = new Map<string, PageMetrics[]>();
    const sorted = [...metrics].sort((a, b) => b.month.localeCompare(a.month));
    sorted.forEach((m) => {
      if (!groups.has(m.month)) groups.set(m.month, []);
      groups.get(m.month)!.push(m);
    });
    return groups;
  }, [metrics]);

  const handleSubmit = () => {
    if (!form.platform || !form.month) return;

    const timestamp = new Date().toISOString();
    const metric: PageMetrics = {
      id: editingId || generateId(),
      platform: form.platform,
      month: form.month,
      followers: Number(form.followers) || 0,
      followersChange: Number(form.followersChange) || 0,
      reach: Number(form.reach) || 0,
      impressions: Number(form.impressions) || 0,
      profileVisits: form.profileVisits ? Number(form.profileVisits) : undefined,
      engagementRate: form.engagementRate ? Number(form.engagementRate) : undefined,
      notes: form.notes || undefined,
      createdAt: editingId
        ? metrics.find((m) => m.id === editingId)?.createdAt || timestamp
        : timestamp,
      updatedAt: timestamp,
    };

    onSave(metric);
    setForm(emptyForm);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (metric: PageMetrics) => {
    setForm({
      platform: metric.platform,
      month: metric.month,
      followers: String(metric.followers),
      followersChange: String(metric.followersChange),
      reach: String(metric.reach),
      impressions: String(metric.impressions),
      profileVisits: metric.profileVisits !== undefined ? String(metric.profileVisits) : '',
      engagementRate: metric.engagementRate !== undefined ? String(metric.engagementRate) : '',
      notes: metric.notes || '',
    });
    setEditingId(metric.id);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b border-graystone-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-ocean-900">Page Metrics</CardTitle>
          {!isAdding && (
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <PlusIcon className="mr-1 h-4 w-4" />
              Add Metrics
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Entry Form */}
        {isAdding && (
          <div className="rounded-lg border border-ocean-200 bg-ocean-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-ocean-900">
                {editingId ? 'Edit Metrics' : 'Add New Metrics'}
              </h4>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div>
                <Label className="text-xs">Platform *</Label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-graystone-300 px-2 py-1.5 text-sm"
                >
                  <option value="">Select platform</option>
                  {ALL_PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Month *</Label>
                <Input
                  type="month"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Followers</Label>
                <Input
                  type="number"
                  value={form.followers}
                  onChange={(e) => setForm({ ...form, followers: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Net Change</Label>
                <Input
                  type="number"
                  value={form.followersChange}
                  onChange={(e) => setForm({ ...form, followersChange: e.target.value })}
                  placeholder="+/-"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Reach</Label>
                <Input
                  type="number"
                  value={form.reach}
                  onChange={(e) => setForm({ ...form, reach: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Impressions</Label>
                <Input
                  type="number"
                  value={form.impressions}
                  onChange={(e) => setForm({ ...form, impressions: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Profile Visits</Label>
                <Input
                  type="number"
                  value={form.profileVisits}
                  onChange={(e) => setForm({ ...form, profileVisits: e.target.value })}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Engagement Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.engagementRate}
                  onChange={(e) => setForm({ ...form, engagementRate: e.target.value })}
                  placeholder="e.g., 3.5"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs">Notes</Label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-graystone-300 px-2 py-1.5 text-sm"
                rows={2}
                placeholder="Optional notes..."
              />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={!form.platform || !form.month}>
                {editingId ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        )}

        {/* Metrics List */}
        {metricsByMonth.size === 0 ? (
          <p className="py-4 text-center text-sm text-graystone-500">
            No page metrics recorded yet. Add your first entry to start tracking.
          </p>
        ) : (
          <div className="space-y-6">
            {Array.from(metricsByMonth.entries()).map(([month, monthMetrics]) => (
              <div key={month}>
                <h4 className="mb-2 text-sm font-semibold text-graystone-700">
                  {formatMonth(month)}
                </h4>
                <div className="space-y-2">
                  {monthMetrics.map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between rounded-lg border border-graystone-200 bg-white px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <PlatformIcon platform={metric.platform} size="sm" />
                        <span className="text-sm font-medium text-graystone-700">
                          {metric.platform}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-graystone-500">
                          <span>{metric.followers.toLocaleString()} followers</span>
                          <span
                            className={cx(
                              'font-medium',
                              metric.followersChange > 0 && 'text-emerald-600',
                              metric.followersChange < 0 && 'text-red-600',
                            )}
                          >
                            {metric.followersChange > 0 ? '+' : ''}
                            {metric.followersChange.toLocaleString()}
                          </span>
                          {metric.reach > 0 && <span>| {metric.reach.toLocaleString()} reach</span>}
                          {metric.impressions > 0 && (
                            <span>| {metric.impressions.toLocaleString()} impr.</span>
                          )}
                          {metric.engagementRate !== undefined && (
                            <Badge variant="outline" className="text-[10px]">
                              {metric.engagementRate}% ER
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(metric)}
                          className="text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Delete this metric entry?')) {
                              onDelete(metric.id);
                            }
                          }}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PageMetricsPanel;
