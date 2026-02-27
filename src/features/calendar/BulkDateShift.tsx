import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, Button, Badge } from '../../components/ui';
import { PlatformIcon } from '../../components/common';
import { cx } from '../../lib/utils';
import type { Entry } from '../../types/models';

export interface BulkDateShiftProps {
  /** All entries available for selection */
  entries: Entry[];
  /** Callback when entries are shifted */
  onShift: (entryIds: string[], daysDelta: number) => void;
}

function shiftDate(dateStr: string, days: number): string {
  // Parse date parts to avoid timezone issues when creating Date from string
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  // Format back using local date components
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function BulkDateShift({ entries, onShift }: BulkDateShiftProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [daysDelta, setDaysDelta] = useState(1);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Filter entries based on date range
  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => !e.deletedAt)
      .filter((e) => !filterStartDate || e.date >= filterStartDate)
      .filter((e) => !filterEndDate || e.date <= filterEndDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, filterStartDate, filterEndDate]);

  const toggleEntry = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredEntries.map((e) => e.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleShift = () => {
    if (selectedIds.size === 0 || daysDelta === 0) return;
    onShift(Array.from(selectedIds), daysDelta);
    setSelectedIds(new Set());
    setIsOpen(false);
  };

  const previewDates = useMemo(() => {
    if (selectedIds.size === 0) return null;
    const selected = entries.filter((e) => selectedIds.has(e.id));
    const minDate = selected.reduce(
      (min, e) => (e.date < min ? e.date : min),
      selected[0]?.date || '',
    );
    const maxDate = selected.reduce(
      (max, e) => (e.date > max ? e.date : max),
      selected[0]?.date || '',
    );
    return {
      from: { min: minDate, max: maxDate },
      to: { min: shiftDate(minDate, daysDelta), max: shiftDate(maxDate, daysDelta) },
    };
  }, [entries, selectedIds, daysDelta]);

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="text-xs">
        Bulk Date Shift
      </Button>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b border-graystone-200 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-ocean-900">Bulk Date Shift</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date range filter */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="bulk-from-date"
              className="block text-xs font-medium text-graystone-600"
            >
              From date
            </label>
            <input
              id="bulk-from-date"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-graystone-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label htmlFor="bulk-to-date" className="block text-xs font-medium text-graystone-600">
              To date
            </label>
            <input
              id="bulk-to-date"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-graystone-300 px-2 py-1 text-sm"
            />
          </div>
        </div>

        {/* Selection controls */}
        <div className="flex items-center justify-between border-b border-graystone-200 pb-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
              Select all
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection} className="text-xs">
              Clear
            </Button>
          </div>
          <Badge variant="secondary">{selectedIds.size} selected</Badge>
        </div>

        {/* Entry list */}
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {filteredEntries.length === 0 ? (
            <p className="py-2 text-center text-xs text-graystone-500">
              No entries in selected date range.
            </p>
          ) : (
            filteredEntries.map((entry) => (
              <label
                key={entry.id}
                aria-label={`${entry.caption || 'Untitled'} — ${entry.date}`}
                className={cx(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 transition',
                  selectedIds.has(entry.id)
                    ? 'border-ocean-300 bg-ocean-50'
                    : 'border-graystone-200 bg-white hover:border-graystone-300',
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(entry.id)}
                  onChange={() => toggleEntry(entry.id)}
                  className="h-4 w-4 rounded border-graystone-300 text-ocean-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {entry.platforms.slice(0, 2).map((p) => (
                      <span key={p}>
                        <PlatformIcon platform={p} size="xs" />
                      </span>
                    ))}
                    <span className="text-xs font-medium text-graystone-700">{entry.date}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {entry.assetType}
                    </Badge>
                  </div>
                  <p className="line-clamp-1 text-xs text-graystone-500">
                    {entry.caption || 'Untitled'}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>

        {/* Shift controls */}
        <div className="rounded-lg border border-graystone-200 bg-graystone-50 p-3">
          <label htmlFor="bulk-shift-days" className="block text-xs font-medium text-graystone-700">
            Shift by (days)
          </label>
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDaysDelta((d) => d - 7)}
              className="text-xs"
            >
              -7
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDaysDelta((d) => d - 1)}
              className="text-xs"
            >
              -1
            </Button>
            <input
              id="bulk-shift-days"
              type="number"
              value={daysDelta}
              onChange={(e) => setDaysDelta(parseInt(e.target.value) || 0)}
              className="w-20 rounded-lg border border-graystone-300 px-2 py-1 text-center text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDaysDelta((d) => d + 1)}
              className="text-xs"
            >
              +1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDaysDelta((d) => d + 7)}
              className="text-xs"
            >
              +7
            </Button>
          </div>

          {/* Preview */}
          {previewDates && selectedIds.size > 0 && (
            <div className="mt-3 text-xs text-graystone-600">
              <span className="font-medium">Preview:</span>{' '}
              {previewDates.from.min === previewDates.from.max ? (
                <>
                  {previewDates.from.min} → {previewDates.to.min}
                </>
              ) : (
                <>
                  {previewDates.from.min} – {previewDates.from.max} → {previewDates.to.min} –{' '}
                  {previewDates.to.max}
                </>
              )}
            </div>
          )}
        </div>

        {/* Apply button */}
        <Button
          onClick={handleShift}
          disabled={selectedIds.size === 0 || daysDelta === 0}
          className="w-full"
        >
          Shift {selectedIds.size} {selectedIds.size === 1 ? 'entry' : 'entries'} by{' '}
          {daysDelta > 0 ? '+' : ''}
          {daysDelta} {Math.abs(daysDelta) === 1 ? 'day' : 'days'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default BulkDateShift;
