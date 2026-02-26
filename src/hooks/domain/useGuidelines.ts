import { useState, useCallback } from 'react';
import { loadGuidelines, saveGuidelines, normalizeGuidelines } from '../../lib/guidelines';

interface UseGuidelinesDeps {
  runSyncTask: (label: string, action: () => Promise<unknown>) => Promise<boolean>;
}

export function useGuidelines({ runSyncTask }: UseGuidelinesDeps) {
  const [guidelines, setGuidelines] = useState(() => loadGuidelines());
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  const handleGuidelinesSave = useCallback(
    (next: unknown) => {
      const normalized = normalizeGuidelines(next);
      setGuidelines(normalized);
      saveGuidelines(normalized);
      if (window.api && (window.api as Record<string, unknown>).saveGuidelines) {
        runSyncTask('Save guidelines', () =>
          (window.api as Record<string, (...args: unknown[]) => Promise<unknown>>).saveGuidelines(
            normalized,
          ),
        );
      }
      setGuidelinesOpen(false);
    },
    [runSyncTask],
  );

  const teamsWebhookUrl = guidelines?.teamsWebhookUrl as string | undefined;

  const reset = useCallback(() => {
    setGuidelines(loadGuidelines());
    setGuidelinesOpen(false);
  }, []);

  return {
    guidelines,
    setGuidelines,
    guidelinesOpen,
    setGuidelinesOpen,
    handleGuidelinesSave,
    teamsWebhookUrl,
    reset,
  };
}
