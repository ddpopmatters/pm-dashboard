export function IdeaAttachment({ attachment }) {
  const isImage =
    typeof attachment.dataUrl === 'string' && attachment.dataUrl.startsWith('data:image');
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
      <a
        href={attachment.dataUrl}
        download={attachment.name || 'attachment'}
        className="text-xs font-semibold text-ocean-600 hover:underline"
      >
        Download
      </a>
    </div>
  );
}

export default IdeaAttachment;
