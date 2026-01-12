import React, { useState } from 'react';
import { Button, Badge } from '../../components/ui';
import { cx } from '../../lib/utils';
import { canPublish, canPostAgain, getAggregatePublishStatus } from './publishUtils';
import type { Entry } from '../../types/models';

export interface PublishActionsProps {
  entry: Entry;
  onPublish: (entryId: string) => Promise<void>;
  onPostAgain: (entry: Entry) => void;
  disabled?: boolean;
  onError?: (message: string) => void;
}

/**
 * Publish status badge showing aggregate and per-platform status
 */
function PublishStatusBadge({ entry, onClick }: { entry: Entry; onClick?: () => void }) {
  const status = getAggregatePublishStatus(entry.publishStatus);

  if (status === 'none') return null;

  const statusConfig = {
    pending: { label: 'Pending...', variant: 'secondary' as const, className: 'animate-pulse' },
    publishing: {
      label: 'Publishing...',
      variant: 'secondary' as const,
      className: 'animate-pulse',
    },
    published: {
      label: 'Published',
      variant: 'default' as const,
      className: 'bg-emerald-100 text-emerald-700',
    },
    partial: {
      label: 'Partial',
      variant: 'outline' as const,
      className: 'border-amber-300 text-amber-700',
    },
    failed: {
      label: 'Failed',
      variant: 'outline' as const,
      className: 'border-red-300 text-red-700',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cx('cursor-pointer', config.className)}
      onClick={onClick}
    >
      {config.label}
    </Badge>
  );
}

/**
 * Per-platform publish status detail
 */
function PublishStatusDetail({ entry }: { entry: Entry }) {
  if (!entry.publishStatus || Object.keys(entry.publishStatus).length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-1 text-xs">
      {Object.entries(entry.publishStatus).map(([platform, status]) => (
        <div key={platform} className="flex items-center justify-between">
          <span className="font-medium">{platform}</span>
          <div className="flex items-center gap-2">
            <span
              className={cx(
                status.status === 'published' && 'text-emerald-600',
                status.status === 'publishing' && 'text-ocean-600',
                status.status === 'failed' && 'text-red-600',
              )}
            >
              {status.status}
            </span>
            {status.url && (
              <a
                href={status.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ocean-600 hover:underline"
              >
                View
              </a>
            )}
            {status.error && (
              <span className="text-red-500" title={status.error}>
                ⚠
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Publish actions component - shows Publish Now, Post Again, and status
 */
export function PublishActions({
  entry,
  onPublish,
  onPostAgain,
  disabled,
  onError,
}: PublishActionsProps): React.ReactElement {
  const [isPublishing, setIsPublishing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handlePublish = async () => {
    setIsPublishing(true);
    setLocalError(null);
    try {
      await onPublish(entry.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish';
      setLocalError(message);
      onError?.(message);
    } finally {
      setIsPublishing(false);
    }
  };

  const showPublishButton = canPublish(entry);
  const showPostAgainButton = canPostAgain(entry);
  const status = getAggregatePublishStatus(entry.publishStatus);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Publish Now Button */}
        {showPublishButton && (
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={disabled || isPublishing}
            className="bg-ocean-600 hover:bg-ocean-700"
          >
            {isPublishing ? 'Publishing...' : 'Publish Now'}
          </Button>
        )}

        {/* Post Again Button */}
        {showPostAgainButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPostAgain(entry)}
            disabled={disabled}
          >
            Post Again
          </Button>
        )}

        {/* Status Badge */}
        <PublishStatusBadge entry={entry} onClick={() => setShowDetail(!showDetail)} />

        {/* Retry Button for failed */}
        {status === 'failed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handlePublish}
            disabled={disabled || isPublishing}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Retry
          </Button>
        )}
      </div>

      {/* Expandable Detail */}
      {showDetail && <PublishStatusDetail entry={entry} />}

      {/* Local Error Display */}
      {localError && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{localError}</div>
      )}
    </div>
  );
}

export default PublishActions;
