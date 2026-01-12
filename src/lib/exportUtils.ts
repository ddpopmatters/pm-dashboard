import type { Entry, Idea, Influencer, PageMetrics } from '../types/models';

/**
 * Escape a value for safe CSV output
 * - Wraps all values in quotes
 * - Escapes internal quotes by doubling them
 * - Prefixes formula-triggering characters to prevent CSV injection
 */
function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';

  let str = String(value);

  // Prevent formula injection - prefix dangerous leading characters
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }

  // Escape internal quotes by doubling them
  str = str.replace(/"/g, '""');

  // Always wrap in quotes for safety
  return `"${str}"`;
}

/**
 * Convert entries to CSV format
 */
export function entriesToCSV(entries: Entry[]): string {
  const headers = [
    'ID',
    'Date',
    'Platforms',
    'Asset Type',
    'Caption',
    'Status',
    'Workflow Status',
    'Author',
    'Campaign',
    'Content Pillar',
    'Approved At',
    'Created At',
    'Updated At',
  ];

  const rows = entries.map((entry) =>
    [
      entry.id,
      entry.date,
      entry.platforms.join('; '),
      entry.assetType,
      entry.caption,
      entry.status,
      entry.workflowStatus,
      entry.author,
      entry.campaign,
      entry.contentPillar,
      entry.approvedAt,
      entry.createdAt,
      entry.updatedAt,
    ].map(escapeCsv),
  );

  return [headers.map(escapeCsv).join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Convert ideas to CSV format
 */
export function ideasToCSV(ideas: Idea[]): string {
  const headers = ['ID', 'Type', 'Title', 'Notes', 'Target Month', 'Status', 'Created At'];

  const rows = ideas.map((idea) =>
    [idea.id, idea.type, idea.title, idea.notes, idea.targetMonth, idea.status, idea.createdAt].map(
      escapeCsv,
    ),
  );

  return [headers.map(escapeCsv).join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Convert influencers to CSV format
 */
export function influencersToCSV(influencers: Influencer[]): string {
  const headers = [
    'ID',
    'Name',
    'Status',
    'Niche',
    'Primary Platform',
    'Follower Count',
    'Email',
    'Tags',
    'Created At',
  ];

  const rows = influencers.map((inf) =>
    [
      inf.id,
      inf.name,
      inf.status,
      inf.niche,
      inf.primaryPlatform,
      inf.followerCount,
      inf.email,
      (inf.tags || []).join('; '),
      inf.createdAt,
    ].map(escapeCsv),
  );

  return [headers.map(escapeCsv).join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Convert page metrics to CSV format
 */
export function pageMetricsToCSV(metrics: PageMetrics[]): string {
  const headers = [
    'ID',
    'Platform',
    'Month',
    'Followers',
    'Followers Change',
    'Reach',
    'Impressions',
  ];

  const rows = metrics.map((pm) =>
    [pm.id, pm.platform, pm.month, pm.followers, pm.followersChange, pm.reach, pm.impressions].map(
      escapeCsv,
    ),
  );

  return [headers.map(escapeCsv).join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download data as CSV
 */
export function downloadCSV(csv: string, filename: string): void {
  downloadFile(csv, filename, 'text/csv;charset=utf-8');
}

/**
 * Download data as JSON
 */
export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
}

/**
 * Export all data as a JSON backup
 */
export interface DataBackup {
  version: string;
  exportedAt: string;
  entries: Entry[];
  ideas: Idea[];
  influencers: Influencer[];
  pageMetrics: PageMetrics[];
}

export function createDataBackup(
  entries: Entry[],
  ideas: Idea[],
  influencers: Influencer[],
  pageMetrics: PageMetrics[],
): DataBackup {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    entries,
    ideas,
    influencers,
    pageMetrics,
  };
}

/**
 * Download full data backup as JSON
 */
export function downloadDataBackup(
  entries: Entry[],
  ideas: Idea[],
  influencers: Influencer[],
  pageMetrics: PageMetrics[],
): void {
  const backup = createDataBackup(entries, ideas, influencers, pageMetrics);
  const date = new Date().toISOString().split('T')[0];
  downloadJSON(backup, `pm-dashboard-backup-${date}.json`);
}

/**
 * Export entries for a date range as CSV
 */
export function exportEntriesForDateRange(
  entries: Entry[],
  startDate: string,
  endDate: string,
): void {
  const filtered = entries.filter((e) => !e.deletedAt && e.date >= startDate && e.date <= endDate);
  const csv = entriesToCSV(filtered);
  downloadCSV(csv, `pm-entries-${startDate}-to-${endDate}.csv`);
}
