import React, { useMemo } from 'react';
import { KanbanBoard } from './KanbanBoard';
import { KANBAN_STATUSES } from '../../constants';
import type { Entry } from '../../types/models';

export interface KanbanViewProps {
  /** All entries to display */
  entries: Entry[];
  /** Callback when entry status is updated */
  onUpdateStatus: (id: string, status: string) => void;
  /** Callback when entry is opened */
  onOpenEntry: (id: string) => void;
}

/**
 * KanbanView - Production Kanban board feature module
 *
 * Displays entries organized by workflow status columns.
 * Wraps the KanbanBoard component with entry filtering logic.
 */
export function KanbanView({
  entries,
  onUpdateStatus,
  onOpenEntry,
}: KanbanViewProps): React.ReactElement {
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
