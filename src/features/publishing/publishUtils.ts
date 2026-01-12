import type { Entry, PublishSettings, PlatformPublishStatus } from '../../types/models';

/**
 * Build the webhook payload for publishing an entry
 * Note: webhookSecret is included in body (not header) due to browser no-cors limitations
 */
export function buildPublishPayload(entry: Entry, callbackUrl?: string, webhookSecret?: string) {
  return {
    entryId: entry.id,
    platforms: entry.platforms,
    caption: entry.caption,
    platformCaptions: entry.platformCaptions || {},
    mediaUrls: entry.attachments?.map((a) => a.url || a.dataUrl).filter(Boolean) || [],
    previewUrl: entry.previewUrl || null,
    scheduledDate: entry.date,
    firstComment: entry.firstComment || '',
    campaign: entry.campaign || '',
    contentPillar: entry.contentPillar || '',
    links: entry.links || [],
    callbackUrl: callbackUrl || null,
    ...(webhookSecret && { webhookSecret }),
  };
}

/**
 * Send entry to Zapier webhook for publishing
 * Note: Uses no-cors mode since Zapier doesn't support CORS.
 * This means we cannot read the response or send custom headers.
 * The webhook secret is sent in the payload body instead.
 */
export async function triggerPublish(
  entry: Entry,
  settings: PublishSettings,
  callbackUrl?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!settings.webhookUrl) {
    return { success: false, error: 'No webhook URL configured' };
  }

  try {
    // Secret is included in payload body since no-cors strips custom headers
    const payload = buildPublishPayload(entry, callbackUrl, settings.webhookSecret);

    await fetch(settings.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors', // Zapier doesn't support CORS - response will be opaque
    });

    // With no-cors we can't check response status, assume success if no error thrown
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger publish',
    };
  }
}

/**
 * Initialize publish status for all platforms on an entry
 */
export function initializePublishStatus(
  platforms: string[],
): Record<string, PlatformPublishStatus> {
  const status: Record<string, PlatformPublishStatus> = {};
  platforms.forEach((platform) => {
    status[platform] = {
      status: 'publishing',
      url: null,
      error: null,
      timestamp: new Date().toISOString(),
    };
  });
  return status;
}

/**
 * Get aggregate publish status from per-platform statuses
 */
export function getAggregatePublishStatus(
  publishStatus: Record<string, PlatformPublishStatus> | undefined,
): 'none' | 'publishing' | 'published' | 'partial' | 'failed' {
  if (!publishStatus || Object.keys(publishStatus).length === 0) {
    return 'none';
  }

  const statuses = Object.values(publishStatus);
  const allPublished = statuses.every((s) => s.status === 'published');
  const allFailed = statuses.every((s) => s.status === 'failed');
  const anyPublishing = statuses.some((s) => s.status === 'publishing');
  const anyPublished = statuses.some((s) => s.status === 'published');
  const anyFailed = statuses.some((s) => s.status === 'failed');

  if (allPublished) return 'published';
  if (allFailed) return 'failed';
  if (anyPublishing) return 'publishing';
  if (anyPublished && anyFailed) return 'partial';
  return 'none';
}

/**
 * Check if an entry can be published
 */
export function canPublish(entry: Entry): boolean {
  // Must be approved
  if (entry.workflowStatus !== 'Approved') return false;
  // Must have platforms selected
  if (!entry.platforms || entry.platforms.length === 0) return false;
  // Must not already be publishing or published
  const status = getAggregatePublishStatus(entry.publishStatus);
  if (status === 'publishing' || status === 'published') return false;
  return true;
}

/**
 * Check if an entry can use "Post Again"
 */
export function canPostAgain(entry: Entry): boolean {
  // Must be published or have been published
  return (
    entry.workflowStatus === 'Published' ||
    getAggregatePublishStatus(entry.publishStatus) === 'published'
  );
}
