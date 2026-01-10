import { Badge, Button } from '../../components/ui';
import { cx } from '../../lib/utils';
import { selectBaseClasses } from '../../lib/styles';

export function KanbanBoard({ statuses, entries, onOpen, onUpdateStatus }) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-4">
        {statuses.map((status) => {
          const cards = entries.filter((entry) => (entry.workflowStatus || statuses[0]) === status);
          return (
            <div key={status} className="w-72 shrink-0">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-ocean-700">{status}</div>
                <Badge variant="secondary">{cards.length}</Badge>
              </div>
              <div className="space-y-3">
                {cards.length === 0 ? (
                  <div className="rounded-xl border border-aqua-200 bg-aqua-50 px-3 py-4 text-xs text-graystone-500">
                    Nothing here yet.
                  </div>
                ) : (
                  cards.map((entry) => (
                    <div
                      key={entry.id}
                      className="space-y-2 rounded-2xl border border-graystone-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline">{entry.assetType}</Badge>
                        {entry.analytics && Object.keys(entry.analytics).length ? (
                          <span className="rounded-full bg-ocean-500/10 px-2 py-0.5 text-[11px] font-semibold text-ocean-700">
                            Performance
                          </span>
                        ) : null}
                        <select
                          value={entry.workflowStatus || statuses[0]}
                          onChange={(event) => onUpdateStatus(entry.id, event.target.value)}
                          className={cx(selectBaseClasses, 'w-32 px-3 py-1 text-xs')}
                        >
                          {statuses.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-graystone-800 line-clamp-2">
                          {entry.caption || entry.title || 'Untitled'}
                        </div>
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
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-graystone-500">
                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                        {entry.platforms && entry.platforms.length > 0 && (
                          <span>{entry.platforms.join(', ')}</span>
                        )}
                      </div>
                      {entry.firstComment && (
                        <div className="rounded-xl bg-aqua-50 px-2 py-1 text-[11px] text-ocean-700 line-clamp-2">
                          {entry.firstComment}
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpen(entry.id)}
                          className="text-xs"
                        >
                          Open
                        </Button>
                        <span className="text-[11px] uppercase tracking-wide text-graystone-400">
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KanbanBoard;
