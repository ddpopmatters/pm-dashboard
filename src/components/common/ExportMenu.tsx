import React, { useState } from 'react';
import { Button } from '../ui';
import { entriesToCSV, ideasToCSV, downloadCSV, downloadDataBackup } from '../../lib/exportUtils';
import type { Entry, Idea } from '../../types/models';

export interface ExportMenuProps {
  entries: Entry[];
  ideas: Idea[];
}

/**
 * Dropdown menu for export options
 */
export function ExportMenu({ entries, ideas }: ExportMenuProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportEntries = () => {
    const csv = entriesToCSV(entries.filter((e) => !e.deletedAt));
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `pm-entries-${date}.csv`);
    setIsOpen(false);
  };

  const handleExportIdeas = () => {
    const csv = ideasToCSV(ideas);
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `pm-ideas-${date}.csv`);
    setIsOpen(false);
  };

  const handleFullBackup = () => {
    downloadDataBackup(
      entries.filter((e) => !e.deletedAt),
      ideas,
    );
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
        Export
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-graystone-200 bg-white py-2 shadow-xl">
            <button
              type="button"
              onClick={handleExportEntries}
              className="w-full px-4 py-2 text-left text-sm hover:bg-graystone-50"
            >
              <div className="font-medium">Export Entries</div>
              <div className="text-xs text-graystone-500">Download all entries as CSV</div>
            </button>

            <button
              type="button"
              onClick={handleExportIdeas}
              className="w-full px-4 py-2 text-left text-sm hover:bg-graystone-50"
            >
              <div className="font-medium">Export Ideas</div>
              <div className="text-xs text-graystone-500">Download all ideas as CSV</div>
            </button>

            <div className="my-2 border-t border-graystone-200" />

            <button
              type="button"
              onClick={handleFullBackup}
              className="w-full px-4 py-2 text-left text-sm hover:bg-graystone-50"
            >
              <div className="font-medium">Full Backup (JSON)</div>
              <div className="text-xs text-graystone-500">Download all data for backup</div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ExportMenu;
