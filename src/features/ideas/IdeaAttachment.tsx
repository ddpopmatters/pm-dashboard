import React from 'react';

export interface IdeaAttachmentData {
  id: string;
  name: string;
  dataUrl: string;
  type: string;
  size: number;
}

export interface IdeaAttachmentProps {
  /** Attachment data to display */
  attachment: IdeaAttachmentData;
}

// Safe mime types for data URLs (no script execution risk)
const SAFE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const SAFE_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'application/json'];
const SAFE_MIME_TYPES = new Set([...SAFE_IMAGE_TYPES, ...SAFE_DOCUMENT_TYPES]);

/**
 * Validates that a data URL is safe to render/download.
 * Rejects javascript:, data:text/html, SVG (can contain scripts), and unknown types.
 */
function isSafeDataUrl(dataUrl: string): boolean {
  if (!dataUrl || typeof dataUrl !== 'string') return false;
  if (!dataUrl.startsWith('data:')) return false;

  // Extract mime type from data URL (format: data:mime/type;base64,...)
  const mimeMatch = dataUrl.match(/^data:([^;,]+)/);
  if (!mimeMatch) return false;

  const mimeType = mimeMatch[1].toLowerCase();
  return SAFE_MIME_TYPES.has(mimeType);
}

/**
 * Check if data URL is a safe image type (not SVG which can contain scripts)
 */
function isSafeImage(dataUrl: string): boolean {
  if (!dataUrl || typeof dataUrl !== 'string') return false;
  if (!dataUrl.startsWith('data:')) return false;

  const mimeMatch = dataUrl.match(/^data:([^;,]+)/);
  if (!mimeMatch) return false;

  const mimeType = mimeMatch[1].toLowerCase();
  return SAFE_IMAGE_TYPES.includes(mimeType);
}

export const IdeaAttachment: React.FC<IdeaAttachmentProps> = ({ attachment }) => {
  const isImage = isSafeImage(attachment.dataUrl);
  const isSafe = isSafeDataUrl(attachment.dataUrl);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-graystone-200 bg-white px-3 py-2 text-sm">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-graystone-200 bg-graystone-100">
        {isImage ? (
          <img
            src={attachment.dataUrl}
            alt={attachment.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs text-graystone-500">{attachment.type || 'File'}</span>
        )}
      </div>
      <div className="flex-1">
        <div className="break-words font-medium text-graystone-700">{attachment.name}</div>
        {attachment.size ? (
          <div className="text-xs text-graystone-500">{Math.round(attachment.size / 1024)} KB</div>
        ) : null}
      </div>
      {isSafe ? (
        <a
          href={attachment.dataUrl}
          download={attachment.name || 'attachment'}
          className="text-xs font-semibold text-ocean-600 hover:underline"
        >
          Download
        </a>
      ) : (
        <span className="text-xs text-graystone-400">Unavailable</span>
      )}
    </div>
  );
};

export default IdeaAttachment;
