import { useState, useRef, useCallback, useEffect } from 'react';
import { Badge, Button } from '../../components/ui';
import { cx } from '../../lib/utils';
import { selectBaseClasses } from '../../lib/styles';

export function KanbanBoard({ statuses, entries, onOpen, onUpdateStatus }) {
  const [focusedColumnIndex, setFocusedColumnIndex] = useState(0);
  const [focusedCardIndex, setFocusedCardIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const columnRefs = useRef([]);
  const cardRefs = useRef({});

  // Build cards by column for navigation
  const cardsByColumn = statuses.map((status) =>
    entries.filter((entry) => (entry.workflowStatus || statuses[0]) === status),
  );

  // Reset focus when statuses or entries change
  useEffect(() => {
    setFocusedColumnIndex(0);
    setFocusedCardIndex(-1);
    setIsDragging(false);
  }, [statuses, entries]);

  const handleColumnKeyDown = useCallback(
    (e, columnIndex) => {
      const cards = cardsByColumn[columnIndex];

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          if (columnIndex < statuses.length - 1) {
            setFocusedColumnIndex(columnIndex + 1);
            setFocusedCardIndex(-1);
            columnRefs.current[columnIndex + 1]?.focus();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (columnIndex > 0) {
            setFocusedColumnIndex(columnIndex - 1);
            setFocusedCardIndex(-1);
            columnRefs.current[columnIndex - 1]?.focus();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (cards.length > 0) {
            setFocusedCardIndex(0);
            cardRefs.current[`${columnIndex}-0`]?.focus();
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (isDragging) {
            setIsDragging(false);
          }
          break;
      }
    },
    [statuses.length, cardsByColumn, isDragging],
  );

  const handleCardKeyDown = useCallback(
    (e, columnIndex, cardIndex, entryId) => {
      const cards = cardsByColumn[columnIndex];

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (cardIndex < cards.length - 1) {
            setFocusedCardIndex(cardIndex + 1);
            cardRefs.current[`${columnIndex}-${cardIndex + 1}`]?.focus();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (cardIndex > 0) {
            setFocusedCardIndex(cardIndex - 1);
            cardRefs.current[`${columnIndex}-${cardIndex - 1}`]?.focus();
          } else {
            // Move back to column header
            setFocusedCardIndex(-1);
            columnRefs.current[columnIndex]?.focus();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (columnIndex < statuses.length - 1) {
            // Move to same card index in next column, or last card if not available
            const nextCards = cardsByColumn[columnIndex + 1];
            const nextCardIndex = Math.min(cardIndex, nextCards.length - 1);
            setFocusedColumnIndex(columnIndex + 1);
            if (nextCardIndex >= 0) {
              setFocusedCardIndex(nextCardIndex);
              cardRefs.current[`${columnIndex + 1}-${nextCardIndex}`]?.focus();
            } else {
              setFocusedCardIndex(-1);
              columnRefs.current[columnIndex + 1]?.focus();
            }
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (columnIndex > 0) {
            // Move to same card index in previous column, or last card if not available
            const prevCards = cardsByColumn[columnIndex - 1];
            const prevCardIndex = Math.min(cardIndex, prevCards.length - 1);
            setFocusedColumnIndex(columnIndex - 1);
            if (prevCardIndex >= 0) {
              setFocusedCardIndex(prevCardIndex);
              cardRefs.current[`${columnIndex - 1}-${prevCardIndex}`]?.focus();
            } else {
              setFocusedCardIndex(-1);
              columnRefs.current[columnIndex - 1]?.focus();
            }
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onOpen(entryId);
          break;
        case 'Escape':
          e.preventDefault();
          if (isDragging) {
            setIsDragging(false);
          } else {
            // Move focus back to column
            setFocusedCardIndex(-1);
            columnRefs.current[columnIndex]?.focus();
          }
          break;
      }
    },
    [statuses.length, cardsByColumn, onOpen, isDragging],
  );

  return (
    <div className="overflow-x-auto pb-4" role="region" aria-label="Kanban board">
      <div className="flex min-w-max gap-4" role="list" aria-label="Workflow columns">
        {statuses.map((status, columnIndex) => {
          const cards = cardsByColumn[columnIndex];
          const isFocusedColumn = focusedColumnIndex === columnIndex;
          return (
            <div
              key={status}
              ref={(el) => (columnRefs.current[columnIndex] = el)}
              tabIndex={isFocusedColumn && focusedCardIndex === -1 ? 0 : -1}
              role="listitem"
              aria-label={`${status} column, ${cards.length} ${cards.length === 1 ? 'card' : 'cards'}`}
              onKeyDown={(e) => handleColumnKeyDown(e, columnIndex)}
              className={cx(
                'w-72 shrink-0 outline-none rounded-lg',
                'focus:ring-2 focus:ring-aqua-500 focus:ring-offset-2',
              )}
            >
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
                  cards.map((entry, cardIndex) => {
                    const isFocusedCard = isFocusedColumn && focusedCardIndex === cardIndex;
                    return (
                      <div
                        key={entry.id}
                        ref={(el) => (cardRefs.current[`${columnIndex}-${cardIndex}`] = el)}
                        tabIndex={isFocusedCard ? 0 : -1}
                        role="article"
                        aria-label={`${entry.caption || entry.title || 'Untitled'}, ${entry.assetType}, ${entry.status}`}
                        onKeyDown={(e) => handleCardKeyDown(e, columnIndex, cardIndex, entry.id)}
                        className={cx(
                          'space-y-2 rounded-2xl border border-graystone-200 bg-white p-3 shadow-sm outline-none',
                          'focus:ring-2 focus:ring-aqua-500 focus:ring-offset-1',
                        )}
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
                    );
                  })
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
