import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import { uuid } from '../../lib/utils';
import { SUPABASE_API } from '../../lib/supabase';

interface UseInfluencersDeps {
  currentUser: string;
  setEntries: Dispatch<SetStateAction<Record<string, unknown>[]>>;
}

export function useInfluencers({ currentUser, setEntries }: UseInfluencersDeps) {
  const [influencers, setInfluencers] = useState<Record<string, unknown>[]>([]);
  const [influencerModalOpen, setInfluencerModalOpen] = useState(false);
  const [editingInfluencerId, setEditingInfluencerId] = useState<string | null>(null);
  const [customNiches, setCustomNiches] = useState<string[]>([]);

  // Load influencers from Supabase on mount
  useEffect(() => {
    SUPABASE_API.fetchInfluencers().then((data: unknown[]) => {
      if (data.length > 0) {
        setInfluencers(data as Record<string, unknown>[]);
      }
    });
  }, []);

  // Load custom niches from Supabase on mount
  useEffect(() => {
    SUPABASE_API.fetchCustomNiches().then((niches: string[]) => {
      if (niches.length > 0) {
        setCustomNiches(niches);
      }
    });
  }, []);

  const handleAddCustomNiche = useCallback((niche: string) => {
    setCustomNiches((prev) => {
      if (prev.includes(niche)) return prev;
      const updated = [...prev, niche].sort();
      SUPABASE_API.saveCustomNiches(updated);
      return updated;
    });
  }, []);

  const handleAddInfluencer = useCallback(
    (data: Record<string, unknown>) => {
      const newInfluencer = {
        ...data,
        id: uuid(),
        createdAt: new Date().toISOString(),
        createdBy: currentUser,
      };
      SUPABASE_API.saveInfluencer(newInfluencer).then((saved: Record<string, unknown> | null) => {
        if (saved) {
          setInfluencers((prev) => [saved, ...prev]);
        } else {
          setInfluencers((prev) => [newInfluencer, ...prev]);
        }
      });
    },
    [currentUser],
  );

  const handleUpdateInfluencer = useCallback((updated: Record<string, unknown>) => {
    SUPABASE_API.saveInfluencer(updated).then((saved: Record<string, unknown> | null) => {
      if (saved) {
        setInfluencers((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
      } else {
        setInfluencers((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      }
    });
  }, []);

  const handleDeleteInfluencer = useCallback(
    (id: string) => {
      SUPABASE_API.deleteInfluencer(id).then((success: boolean) => {
        if (success) {
          setInfluencers((prev) => prev.filter((i) => i.id !== id));
        }
      });
      // Also unlink any entries
      setEntries((prev) =>
        prev.map((e) => (e.influencerId === id ? { ...e, influencerId: undefined } : e)),
      );
    },
    [setEntries],
  );

  const handleOpenInfluencerDetail = useCallback((id: string) => {
    setEditingInfluencerId(id === 'new' ? null : id);
    setInfluencerModalOpen(true);
  }, []);

  const handleLinkEntryToInfluencer = useCallback(
    (influencerId: string, entryId: string) => {
      setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, influencerId } : e)));
    },
    [setEntries],
  );

  const handleUnlinkEntryFromInfluencer = useCallback(
    (entryId: string) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, influencerId: undefined } : e)),
      );
    },
    [setEntries],
  );

  const reset = useCallback(() => {
    setInfluencers([]);
    setInfluencerModalOpen(false);
    setEditingInfluencerId(null);
    setCustomNiches([]);
  }, []);

  return {
    influencers,
    setInfluencers,
    influencerModalOpen,
    setInfluencerModalOpen,
    editingInfluencerId,
    setEditingInfluencerId,
    customNiches,
    handleAddCustomNiche,
    handleAddInfluencer,
    handleUpdateInfluencer,
    handleDeleteInfluencer,
    handleOpenInfluencerDetail,
    handleLinkEntryToInfluencer,
    handleUnlinkEntryFromInfluencer,
    reset,
  };
}
