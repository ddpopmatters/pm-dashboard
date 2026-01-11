import React, { useState, useEffect } from 'react';
import { Modal, Button, Label } from '../../components/ui';
import { ALL_PLATFORMS, PLATFORM_DEFAULT_LIMITS } from '../../constants';
import type { Guidelines } from '../../types/models';

interface GuidelinesDraft {
  bannedWordsText: string;
  requiredPhrasesText: string;
  languageGuide: string;
  hashtagTips: string;
  charLimits: Record<string, number>;
  teamsWebhookUrl: string;
}

export interface GuidelinesModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Current guidelines data */
  guidelines: Guidelines | null;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback to save updated guidelines */
  onSave: (guidelines: Guidelines) => void;
}

const buildDraft = (source: Guidelines | null): GuidelinesDraft => ({
  bannedWordsText: (source?.bannedWords || []).join(', '),
  requiredPhrasesText: (source?.requiredPhrases || []).join(', '),
  languageGuide: source?.languageGuide || '',
  hashtagTips: source?.hashtagTips || '',
  charLimits: { ...(source?.charLimits || {}) },
  teamsWebhookUrl: source?.teamsWebhookUrl || '',
});

const splitList = (value: string): string[] =>
  String(value || '')
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * GuidelinesModal - Modal for editing content guidelines and standards
 */
export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({
  open,
  guidelines,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<GuidelinesDraft>(buildDraft(guidelines));

  useEffect(() => {
    setDraft(buildDraft(guidelines));
  }, [guidelines]);

  if (!open) return null;

  const handleSave = () => {
    onSave({
      bannedWords: splitList(draft.bannedWordsText),
      requiredPhrases: splitList(draft.requiredPhrasesText),
      languageGuide: draft.languageGuide,
      hashtagTips: draft.hashtagTips,
      charLimits: { ...draft.charLimits },
      teamsWebhookUrl: String(draft.teamsWebhookUrl || ''),
    });
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="guidelines-title">
      <div className="bg-white">
        <div className="flex items-center justify-between border-b border-graystone-200 px-6 py-4">
          <div>
            <div id="guidelines-title" className="heading-font text-lg text-black">
              Content standards
            </div>
            <p className="text-xs text-graystone-500">
              Store language guidance, banned words, and platform best practices in one place.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6 text-sm text-graystone-700">
          <div className="space-y-2">
            <Label>Banned words (comma or line separated)</Label>
            <textarea
              className="w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200"
              rows={3}
              value={draft.bannedWordsText}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, bannedWordsText: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Required phrases (comma or line separated)</Label>
            <textarea
              className="w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200"
              rows={3}
              value={draft.requiredPhrasesText}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, requiredPhrasesText: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Language guide</Label>
            <textarea
              className="w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200"
              rows={4}
              value={draft.languageGuide}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, languageGuide: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Hashtag recommendations</Label>
            <textarea
              className="w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200"
              rows={3}
              value={draft.hashtagTips}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, hashtagTips: event.target.value }))
              }
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Character limit best practices</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setDraft({
                    ...draft,
                    charLimits: { ...PLATFORM_DEFAULT_LIMITS },
                  })
                }
              >
                Reset defaults
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs lg:grid-cols-3">
              {ALL_PLATFORMS.map((platform) => (
                <label
                  key={platform}
                  className="flex flex-col gap-1 rounded-2xl border border-graystone-200 bg-white px-3 py-2 shadow-sm"
                >
                  <span className="font-semibold text-graystone-600">{platform}</span>
                  <input
                    type="number"
                    min={1}
                    className="dropdown-font w-full rounded-full border border-black px-3 py-1 text-xs"
                    value={draft.charLimits?.[platform] ?? PLATFORM_DEFAULT_LIMITS[platform] ?? ''}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        charLimits: {
                          ...prev.charLimits,
                          [platform]: Number(event.target.value),
                        },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Microsoft Teams webhook URL (optional)</Label>
            <input
              type="url"
              placeholder="https://outlook.office.com/webhook/..."
              className="dropdown-font w-full rounded-full border border-black px-4 py-2 text-sm"
              value={draft.teamsWebhookUrl}
              onChange={(e) => setDraft((prev) => ({ ...prev, teamsWebhookUrl: e.target.value }))}
            />
            <p className="text-xs text-graystone-500">
              If set, approvals/AI applies can post a brief activity summary to Teams.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-graystone-200 bg-graystone-50 px-6 py-4">
          <p className="text-xs text-graystone-500">
            Changes sync to the server when connected, with local fallback if offline.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save guidelines</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default GuidelinesModal;
