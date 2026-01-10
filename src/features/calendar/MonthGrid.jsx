import { useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, Badge, Button } from '../../components/ui';
import { PlatformIcon, LoaderIcon, TrashIcon } from '../../components/common';
import { cx } from '../../lib/utils';
import { ensureChecklist, isImageMedia } from '../../lib/sanitizers';
import { CHECKLIST_ITEMS, WORKFLOW_STAGES } from '../../constants';

export function MonthGrid({ days, month, year, entries, onApprove, onDelete, onOpen }) {
  const byDate = useMemo(() => {
    const map = new Map();
    days.forEach((day) => {
      const iso = new Date(year, month, day).toISOString().slice(0, 10);
      map.set(iso, []);
    });
    entries.forEach((entry) => {
      const arr = map.get(entry.date) || [];
      arr.push(entry);
      map.set(entry.date, arr);
    });
    return map;
  }, [days, month, year, entries]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {days.map((day) => {
        const iso = new Date(year, month, day).toISOString().slice(0, 10);
        const dayEntries = byDate.get(iso) || [];
        const label = new Date(year, month, day).toLocaleDateString(undefined, {
          weekday: 'short',
          day: '2-digit',
        });
        return (
          <Card key={iso} className="flex h-64 flex-col bg-white">
            <CardHeader className="border-b border-graystone-200 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-ocean-900">{label}</CardTitle>
                <Badge variant={dayEntries.length ? 'default' : 'secondary'}>
                  {dayEntries.length} {dayEntries.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 overflow-y-auto">
              {dayEntries.length === 0 && (
                <p className="text-sm text-graystone-500">No items planned.</p>
              )}
              {dayEntries.map((entry) => {
                const checklist = ensureChecklist(entry.checklist);
                const completed = Object.values(checklist).filter(Boolean).length;
                const total = CHECKLIST_ITEMS.length;
                const hasPreviewImage = isImageMedia(entry.previewUrl);
                const hasPerformance = entry.analytics && Object.keys(entry.analytics).length > 0;
                return (
                  <div
                    key={entry.id}
                    className="cursor-pointer rounded-xl border border-graystone-200 bg-white p-3 transition hover:border-aqua-400 hover:bg-aqua-50"
                    onClick={() => onOpen(entry.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-2">
                        {hasPreviewImage && (
                          <div className="overflow-hidden rounded-lg border border-graystone-200">
                            <img
                              src={entry.previewUrl}
                              alt={`${entry.assetType} preview`}
                              className="h-24 w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{entry.assetType}</Badge>
                          <span className="inline-flex items-center rounded-full bg-aqua-100 px-2 py-1 text-xs font-medium text-ocean-700">
                            {entry.statusDetail || WORKFLOW_STAGES[0]}
                          </span>
                          {hasPerformance ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-ocean-500/10 px-2 py-0.5 text-xs font-medium text-ocean-700">
                              Performance
                            </span>
                          ) : null}
                          <div className="flex flex-wrap gap-1">
                            {entry.platforms.map((platform) => (
                              <span
                                key={platform}
                                className="inline-flex items-center gap-1 rounded-full bg-graystone-100 px-2 py-1 text-xs text-graystone-600"
                              >
                                <PlatformIcon platform={platform} />
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                        {entry.caption && (
                          <p className="line-clamp-3 text-sm text-graystone-700">{entry.caption}</p>
                        )}
                        {(entry.campaign || entry.contentPillar || entry.testingFrameworkName) && (
                          <div className="flex flex-wrap items-center gap-1 text-[11px] text-graystone-500">
                            {entry.campaign ? (
                              <span className="rounded-full bg-aqua-100 px-2 py-0.5 text-ocean-700">
                                {entry.campaign}
                              </span>
                            ) : null}
                            {entry.contentPillar ? (
                              <span className="rounded-full bg-graystone-100 px-2 py-0.5 text-graystone-700">
                                {entry.contentPillar}
                              </span>
                            ) : null}
                            {entry.testingFrameworkName ? (
                              <span className="rounded-full bg-ocean-500/10 px-2 py-0.5 text-ocean-700">
                                Test: {entry.testingFrameworkName}
                              </span>
                            ) : null}
                          </div>
                        )}
                        <div className="text-xs text-graystone-500">
                          Checklist {completed}/{total}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={cx(
                            'rounded-full px-2 py-1 text-xs font-semibold',
                            entry.status === 'Approved' && 'bg-emerald-100 text-emerald-700',
                            entry.status === 'Pending' && 'bg-amber-100 text-amber-700',
                          )}
                        >
                          {entry.status}
                        </span>
                        <div className="flex items-center gap-1">
                          {entry.status !== 'Approved' ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(event) => {
                                event.stopPropagation();
                                onApprove(entry.id);
                              }}
                              title="Approve entry"
                            >
                              <LoaderIcon className="h-5 w-5 text-amber-600" />
                            </Button>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                              Approved
                            </span>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              const confirmDelete = window.confirm(
                                'Move this item to the trash? You can restore it within 30 days.',
                              );
                              if (confirmDelete) onDelete(entry.id);
                            }}
                            title="Move to trash"
                          >
                            <TrashIcon className="h-5 w-5 text-graystone-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default MonthGrid;
