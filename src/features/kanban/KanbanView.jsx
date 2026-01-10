import { useMemo } from 'react';
import { KanbanBoard } from './KanbanBoard';
import { KANBAN_STATUSES } from '../../constants';

/**
 * KanbanView - Production Kanban board feature module
 *
 * Displays entries organized by workflow status columns.
 * Wraps the KanbanBoard component with entry filtering logic.
 */
export function KanbanView({ entries, onUpdateStatus, onOpenEntry }) {
  // Filter out deleted entries for the kanban view
  const kanbanEntries = useMemo(() => entries.filter((entry) => !entry.deletedAt), [entries]);

  return (
    <KanbanBoard
      statuses={KANBAN_STATUSES}
      entries={kanbanEntries}
      onOpen={onOpenEntry}
      onUpdateStatus={onUpdateStatus}
    />
  );
}

export default KanbanView;
