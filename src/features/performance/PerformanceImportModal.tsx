import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../components/ui';
import { parseCSV, type ParsedCSV } from '../../lib/csv';

export interface ImportIssue {
  rowNumber: number;
  reason: string;
}

export interface ImportSummary {
  matched: number;
  totalRows: number;
  updatedEntryCount: number;
  updatedEntries?: string[];
  missing?: ImportIssue[];
  ambiguous?: ImportIssue[];
  errors?: ImportIssue[];
}

export interface PerformanceImportModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback to process imported CSV data, returns summary */
  onImport: (data: ParsedCSV) => ImportSummary;
}

/**
 * PerformanceImportModal - Modal for importing performance data from CSV
 */
export const PerformanceImportModal: React.FC<PerformanceImportModalProps> = ({
  open,
  onClose,
  onImport,
}) => {
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (!open) {
      setSummary(null);
      setError('');
      setImporting(false);
      setFileName('');
    }
  }, [open]);

  if (!open) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setImporting(true);
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        const parsed = parseCSV(text);
        const result = onImport(parsed);
        setSummary(result);
        setFileName(file.name);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import file.');
        setSummary(null);
      } finally {
        setImporting(false);
        if (event.target) event.target.value = '';
      }
    };
    reader.onerror = () => {
      setError('Failed to read the selected file.');
      setImporting(false);
      if (event.target) event.target.value = '';
    };
    reader.readAsText(file);
  };

  const renderIssues = (label: string, items: ImportIssue[] | undefined, tone = 'warn') => {
    if (!items || !items.length) return null;
    const toneClass =
      tone === 'error'
        ? 'border-rose-200 bg-rose-50'
        : tone === 'warn'
          ? 'border-amber-200 bg-amber-50'
          : 'border-aqua-200 bg-aqua-50';
    return (
      <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>
        <div className="font-semibold text-graystone-700">{label}</div>
        <ul className="mt-2 space-y-1 text-xs text-graystone-600">
          {items.slice(0, 6).map((item, index) => (
            <li key={index}>
              Row {item.rowNumber}: {item.reason}
            </li>
          ))}
          {items.length > 6 ? <li className="font-medium">…and {items.length - 6} more.</li> : null}
        </ul>
      </div>
    );
  };

  const matchedCount = summary?.matched || 0;
  const totalRows = summary?.totalRows || 0;
  const updatedEntryCount = summary?.updatedEntryCount || 0;

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="performance-import-title">
      <div className="bg-white">
        <div className="border-b border-aqua-200 bg-ocean-500 px-6 py-4 text-white">
          <div id="performance-import-title" className="text-lg font-semibold">
            Import performance
          </div>
          <p className="text-xs text-aqua-100">
            Upload a CSV export from your social platforms to attach results to calendar items.
          </p>
        </div>
        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-6">
          <div className="space-y-2 text-sm text-graystone-600">
            <div className="font-semibold text-graystone-700">How it works</div>
            <ul className="list-disc space-y-1 pl-5 text-xs">
              <li>
                Include either an <code>entry_id</code> column or both <code>date</code> and{' '}
                <code>platform</code> columns.
              </li>
              <li>
                Metric columns (e.g. <code>impressions</code>, <code>clicks</code>,{' '}
                <code>engagement_rate</code>) will be stored exactly as they appear.
              </li>
              <li>
                Use one of the recognised platform names (Instagram, Facebook, LinkedIn, BlueSky,
                TikTok, YouTube).
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-dashed border-aqua-300 bg-aqua-50/50 px-4 py-5">
            <label className="flex cursor-pointer flex-col items-center gap-2 text-sm font-semibold text-ocean-700">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
                disabled={importing}
              />
              <span className="heading-font inline-flex items-center gap-2 rounded-full border border-black bg-black px-5 py-2 text-sm font-semibold text-white shadow-[0_0_30px_rgba(15,157,222,0.35)] transition hover:bg-white hover:text-black">
                {importing ? 'Importing…' : 'Choose CSV file'}
              </span>
              {fileName ? <span className="text-xs text-graystone-600">{fileName}</span> : null}
              <span className="text-xs font-normal text-graystone-500">
                Columns detected: entry_id · date · platform · impressions · engagements · clicks …
              </span>
            </label>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {summary ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-aqua-200 bg-aqua-50 px-4 py-3">
                <div className="text-sm font-semibold text-ocean-700">
                  Imported {matchedCount}/{totalRows} rows into {updatedEntryCount}{' '}
                  {updatedEntryCount === 1 ? 'entry' : 'entries'}.
                </div>
                {summary.updatedEntries && summary.updatedEntries.length ? (
                  <div className="mt-1 text-xs text-graystone-600">
                    Updated IDs: {summary.updatedEntries.join(', ')}
                  </div>
                ) : null}
              </div>
              {renderIssues('Rows skipped', summary.missing, 'warn')}
              {renderIssues('Rows needing attention', summary.ambiguous, 'warn')}
              {renderIssues('Errors', summary.errors, 'error')}
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-graystone-200 bg-graystone-50 px-6 py-4">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PerformanceImportModal;
