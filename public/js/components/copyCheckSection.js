/* global React, DEFAULT_GUIDELINES, getPlatformCaption, PlatformIcon, Button */

;(function init() {
  if (typeof window === 'undefined' || window.CopyCheckSection) return;

  const h = React.createElement;

  function CopyCheckSection({ caption, platformCaptions, platforms, assetType, guidelines, onApply }) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [results, setResults] = React.useState({});

    const safeGuidelines =
      guidelines && typeof guidelines === 'object' ? guidelines : DEFAULT_GUIDELINES;
    const selectedPlatforms = platforms && platforms.length ? platforms : ['LinkedIn'];

    const runChecks = async () => {
      setLoading(true);
      setError('');
      const next = {};
      try {
        for (const platform of selectedPlatforms) {
          const maxChars = (safeGuidelines.charLimits && safeGuidelines.charLimits[platform]) || 280;
          const payload = {
            text: getPlatformCaption(caption, platformCaptions, platform),
            platform,
            assetType,
            readingLevelTarget: 'Grade 7',
            constraints: { maxChars, maxHashtags: 10, requireCTA: true },
            brand: {
              bannedWords: safeGuidelines.bannedWords || [],
              requiredPhrases: safeGuidelines.requiredPhrases || [],
              tone: { confident: 0.8, compassionate: 0.7, evidenceLed: 1.0 },
            },
          };
          let json;
          if (window.copyChecker && typeof window.copyChecker.runCopyCheck === 'function') {
            json = await window.copyChecker.runCopyCheck(payload);
          } else {
            const res = await fetch('/api/copy-check', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!res.ok) {
              const j = await res.json().catch(() => ({}));
              throw new Error((j && j.error) || `HTTP ${res.status}`);
            }
            json = await res.json();
          }
          next[platform] = json;
        }
        setResults(next);
      } catch (err) {
        setError((err && err.message) || 'Copy check failed');
      } finally {
        setLoading(false);
      }
    };

    const renderFlags = (platformResult, platform) => {
      if (!platformResult || !platformResult.flags || !platformResult.flags.length) return null;
      return h(
        'div',
        { className: 'mt-2 flex flex-wrap gap-1' },
        platformResult.flags.map((flag, index) =>
          h(
            'span',
            {
              key: `${platform}-flag-${index}`,
              className: 'rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800',
            },
            flag,
          ),
        ),
      );
    };

    const toPercent = (value) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return 0;
      return Math.max(0, Math.min(100, Math.floor(num * 100)));
    };

    const renderScore = (platformResult) => {
      if (!platformResult || !platformResult.score) return null;
      const { score } = platformResult;
      return h(
        'div',
        { className: 'flex items-center gap-2 text-[11px] text-graystone-600' },
        h('span', null, `RL: ${score.readingLevel}`),
        h('span', null, `Clarity ${toPercent(score.clarity)}%`),
        h('span', null, `Brevity ${toPercent(score.brevity)}%`),
      );
    };

    const renderPlatformCard = (platform) => {
      const platformResult = results[platform];
      const suggestion =
        (platformResult &&
          platformResult.suggestion &&
          typeof platformResult.suggestion.text === 'string' &&
          platformResult.suggestion.text) ||
        '';
      return h(
        'div',
        {
          key: platform,
          className: 'rounded-xl border border-graystone-200 bg-white p-3 shadow-sm',
        },
        h(
          'div',
          { className: 'mb-2 flex items-center justify-between' },
          h(
            'div',
            { className: 'flex items-center gap-2 text-sm font-semibold text-ocean-700' },
            h(PlatformIcon, { platform }),
            platform,
          ),
          renderScore(platformResult),
        ),
        h('textarea', {
          className:
            'w-full rounded-2xl border border-graystone-200 px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200',
          rows: 3,
          readOnly: true,
          value: suggestion,
          placeholder: loading ? 'Generating suggestion…' : 'No suggestion yet',
        }),
        renderFlags(platformResult, platform),
        h(
          'div',
          { className: 'mt-2 flex items-center gap-2' },
          h(
            Button,
            {
              size: 'sm',
              onClick: () => onApply(platform, suggestion, safeGuidelines),
              disabled: !platformResult || !suggestion,
            },
            'Apply',
          ),
          h(
            Button,
            {
              size: 'sm',
              variant: 'ghost',
              onClick: () =>
                setResults((prev) => {
                  const next = { ...prev };
                  delete next[platform];
                  return next;
                }),
            },
            'Reject',
          ),
        ),
      );
    };

    const panelChildren = [];
    if (error) {
      panelChildren.push(
        h(
          'div',
          {
            key: 'error',
            className: 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700',
          },
          error,
        ),
      );
    }
    panelChildren.push(...selectedPlatforms.map((platform) => renderPlatformCard(platform)));
    if (Object.keys(results).length > 1) {
      panelChildren.push(
        h(
          'div',
          { key: 'apply-all', className: 'flex items-center justify-end' },
          h(
            Button,
            {
              size: 'sm',
              onClick: () => {
                selectedPlatforms.forEach((platform) => {
                  const platformResult = results[platform];
                  const suggestionText =
                    (platformResult &&
                      platformResult.suggestion &&
                      platformResult.suggestion.text) ||
                    '';
                  if (suggestionText) {
                    onApply(platform, suggestionText, safeGuidelines);
                  }
                });
              },
            },
            'Apply all',
          ),
        ),
      );
    }

    return h(
      'div',
      { className: 'rounded-2xl border border-aqua-200 bg-aqua-50 p-3' },
      h(
        'div',
        { className: 'flex items-center justify-between gap-2' },
        h('div', { className: 'text-sm font-semibold text-ocean-700' }, 'AI Copy Checker'),
        h(
          'div',
          { className: 'flex items-center gap-2' },
          h(
            Button,
            {
              size: 'sm',
              onClick: () => {
                setOpen(true);
                runChecks();
              },
              disabled: loading,
            },
            loading ? 'Checking…' : 'Copy check',
          ),
          open
            ? h(
                Button,
                {
                  size: 'sm',
                  variant: 'ghost',
                  onClick: () => setOpen(false),
                },
                'Hide',
              )
            : null,
        ),
      ),
      open ? h('div', { className: 'mt-3 space-y-3' }, panelChildren) : null,
    );
  }

  window.CopyCheckSection = CopyCheckSection;
})();
