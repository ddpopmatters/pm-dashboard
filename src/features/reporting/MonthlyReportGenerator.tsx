import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, Button, Badge } from '../../components/ui';
import { PlatformIcon } from '../../components/common';
import { cx } from '../../lib/utils';
import type { Entry, PageMetrics, MonthlyReport } from '../../types/models';

export interface MonthlyReportGeneratorProps {
  /** All entries to analyze */
  entries: Entry[];
  /** Page metrics data */
  pageMetrics: PageMetrics[];
  /** Current user for report generation */
  currentUser: string;
  /** Callback when report is generated */
  onGenerate: (report: MonthlyReport) => void;
  /** Callback to export as PDF */
  onExportPDF?: (report: ReportData) => void;
}

interface ReportData {
  month: string;
  monthLabel: string;
  totalEntries: number;
  publishedEntries: number;
  platformBreakdown: { platform: string; count: number; engagementTotal: number }[];
  assetTypeBreakdown: { type: string; count: number }[];
  topEntries: Entry[];
  pageMetrics: PageMetrics[];
  totalEngagement: number;
  avgEngagement: number;
}

/**
 * Calculate total engagement from entry analytics
 * Analytics can be nested per-platform or flat with numeric metrics
 */
function sumEngagement(analytics: Record<string, unknown> | undefined): number {
  if (!analytics) return 0;

  let total = 0;
  for (const value of Object.values(analytics)) {
    if (typeof value === 'number') {
      // Direct numeric value (likes, comments, shares, etc.)
      total += value;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Nested object (per-platform analytics) - recurse
      total += sumEngagement(value as Record<string, unknown>);
    }
  }
  return total;
}

function generateReportData(
  month: string,
  entries: Entry[],
  pageMetrics: PageMetrics[],
): ReportData {
  const [year, m] = month.split('-').map(Number);
  const startDate = `${year}-${String(m).padStart(2, '0')}-01`;
  // Use local date components to avoid timezone issues with toISOString()
  const lastDay = new Date(year, m, 0); // Day 0 of next month = last day of current month
  const endDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

  // Filter entries for the month
  const monthEntries = entries.filter(
    (e) => !e.deletedAt && e.date >= startDate && e.date <= endDate,
  );

  // Published entries - use only workflowStatus for consistency
  const published = monthEntries.filter((e) => e.workflowStatus === 'Published');

  // Platform breakdown
  const platformMap = new Map<string, { count: number; engagement: number }>();
  monthEntries.forEach((e) => {
    const entryEngagement = sumEngagement(e.analytics);
    e.platforms.forEach((p) => {
      const current = platformMap.get(p) || { count: 0, engagement: 0 };
      current.count += 1;
      // Distribute engagement proportionally across platforms
      current.engagement += Math.round(entryEngagement / e.platforms.length);
      platformMap.set(p, current);
    });
  });
  const platformBreakdown = Array.from(platformMap.entries())
    .map(([platform, data]) => ({
      platform,
      count: data.count,
      engagementTotal: data.engagement,
    }))
    .sort((a, b) => b.count - a.count);

  // Asset type breakdown
  const assetMap = new Map<string, number>();
  monthEntries.forEach((e) => {
    assetMap.set(e.assetType, (assetMap.get(e.assetType) || 0) + 1);
  });
  const assetTypeBreakdown = Array.from(assetMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Top performing entries (by total engagement)
  const withEngagement = monthEntries
    .filter((e) => e.analytics && Object.keys(e.analytics).length > 0)
    .map((e) => ({
      entry: e,
      engagement: sumEngagement(e.analytics),
    }))
    .filter((w) => w.engagement > 0)
    .sort((a, b) => b.engagement - a.engagement);
  const topEntries = withEngagement.slice(0, 5).map((w) => w.entry);

  // Total and average engagement
  const totalEngagement = withEngagement.reduce((sum, w) => sum + w.engagement, 0);
  const avgEngagement = withEngagement.length > 0 ? totalEngagement / withEngagement.length : 0;

  // Page metrics for the month
  const monthPageMetrics = pageMetrics.filter((pm) => pm.month === month);

  // Format month label
  const monthLabel = new Date(year, m - 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return {
    month,
    monthLabel,
    totalEntries: monthEntries.length,
    publishedEntries: published.length,
    platformBreakdown,
    assetTypeBreakdown,
    topEntries,
    pageMetrics: monthPageMetrics,
    totalEngagement,
    avgEngagement,
  };
}

export function MonthlyReportGenerator({
  entries,
  pageMetrics,
  currentUser,
  onGenerate,
  onExportPDF,
}: MonthlyReportGeneratorProps): React.ReactElement {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [executiveSummary, setExecutiveSummary] = useState('');

  // Get available months from entries and page metrics
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    entries.forEach((e) => {
      if (e.date) {
        months.add(e.date.slice(0, 7));
      }
    });
    pageMetrics.forEach((pm) => {
      months.add(pm.month);
    });
    return Array.from(months).sort().reverse();
  }, [entries, pageMetrics]);

  const handleGenerate = () => {
    const data = generateReportData(selectedMonth, entries, pageMetrics);
    setReportData(data);
  };

  const handleSaveReport = () => {
    if (!reportData) return;

    const report: MonthlyReport = {
      id: `report-${reportData.month}-${Date.now()}`,
      month: reportData.month,
      generatedAt: new Date().toISOString(),
      generatedBy: currentUser,
      executiveSummary: executiveSummary || undefined,
      highlights: [
        `${reportData.totalEntries} total entries`,
        `${reportData.publishedEntries} published`,
        `${reportData.totalEngagement.toLocaleString()} total engagement`,
      ],
      pageMetrics: reportData.pageMetrics,
      topEntryIds: reportData.topEntries.map((e) => e.id),
    };

    onGenerate(report);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b border-graystone-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-ocean-900">Monthly Report Generator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month Selection */}
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-graystone-600">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setReportData(null);
              }}
              className="mt-1 rounded-lg border border-graystone-300 px-3 py-2 text-sm"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {new Date(`${m}-01`).toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric',
                  })}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleGenerate}>Generate Report</Button>
        </div>

        {/* Report Preview */}
        {reportData && (
          <div className="space-y-4 rounded-lg border border-graystone-200 bg-graystone-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ocean-900">
                {reportData.monthLabel} Report
              </h3>
              <div className="flex gap-2">
                {onExportPDF && (
                  <Button variant="outline" size="sm" onClick={() => onExportPDF(reportData)}>
                    Export PDF
                  </Button>
                )}
                <Button size="sm" onClick={handleSaveReport}>
                  Save Report
                </Button>
              </div>
            </div>

            {/* Executive Summary */}
            <div>
              <label className="block text-xs font-medium text-graystone-600">
                Executive Summary (optional)
              </label>
              <textarea
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                className="mt-1 w-full rounded-lg border border-graystone-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="Add key highlights and context for this month..."
              />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <div className="text-2xl font-bold text-ocean-600">{reportData.totalEntries}</div>
                <div className="text-xs text-graystone-500">Total Entries</div>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <div className="text-2xl font-bold text-emerald-600">
                  {reportData.publishedEntries}
                </div>
                <div className="text-xs text-graystone-500">Published</div>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <div className="text-2xl font-bold text-ocean-600">
                  {reportData.totalEngagement.toLocaleString()}
                </div>
                <div className="text-xs text-graystone-500">Total Engagement</div>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <div className="text-2xl font-bold text-ocean-600">
                  {Math.round(reportData.avgEngagement).toLocaleString()}
                </div>
                <div className="text-xs text-graystone-500">Avg. Engagement</div>
              </div>
            </div>

            {/* Platform Breakdown */}
            {reportData.platformBreakdown.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-graystone-700">
                  Platform Breakdown
                </h4>
                <div className="space-y-1">
                  {reportData.platformBreakdown.map((pb) => (
                    <div
                      key={pb.platform}
                      className="flex items-center justify-between rounded bg-white px-3 py-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={pb.platform} size="sm" />
                        <span className="text-sm font-medium">{pb.platform}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-graystone-500">
                        <span>{pb.count} posts</span>
                        {pb.engagementTotal > 0 && (
                          <Badge variant="outline">
                            {pb.engagementTotal.toLocaleString()} engagement
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Asset Type Breakdown */}
            {reportData.assetTypeBreakdown.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-graystone-700">Content Types</h4>
                <div className="flex flex-wrap gap-2">
                  {reportData.assetTypeBreakdown.map((ab) => (
                    <Badge key={ab.type} variant="secondary">
                      {ab.type}: {ab.count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Page Metrics */}
            {reportData.pageMetrics.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-graystone-700">Page Metrics</h4>
                <div className="space-y-1">
                  {reportData.pageMetrics.map((pm) => (
                    <div
                      key={pm.id}
                      className="flex items-center justify-between rounded bg-white px-3 py-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={pm.platform} size="sm" />
                        <span className="text-sm font-medium">{pm.platform}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-graystone-500">
                        <span>{pm.followers.toLocaleString()} followers</span>
                        <span
                          className={cx(
                            pm.followersChange > 0 && 'text-emerald-600',
                            pm.followersChange < 0 && 'text-red-600',
                          )}
                        >
                          {pm.followersChange > 0 ? '+' : ''}
                          {pm.followersChange.toLocaleString()}
                        </span>
                        {pm.reach > 0 && <span>{pm.reach.toLocaleString()} reach</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Performers */}
            {reportData.topEntries.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-graystone-700">Top Performers</h4>
                <div className="space-y-1">
                  {reportData.topEntries.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded bg-white px-3 py-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ocean-100 text-xs font-bold text-ocean-700">
                          {idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          {entry.platforms.slice(0, 2).map((p) => (
                            <PlatformIcon key={p} platform={p} size="xs" />
                          ))}
                        </div>
                        <p className="line-clamp-1 text-xs text-graystone-600">
                          {entry.caption || 'Untitled'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {sumEngagement(entry.analytics).toLocaleString()} engagement
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MonthlyReportGenerator;
