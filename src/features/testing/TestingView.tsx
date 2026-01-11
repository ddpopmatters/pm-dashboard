import React, {
  useState,
  useCallback,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Badge,
  Button,
  Input,
  Label,
  Textarea,
} from '../../components/ui';
import { PlusIcon, PlatformIcon } from '../../components/common';
import { cx } from '../../lib/utils';
import { selectBaseClasses } from '../../lib/styles';
import { TESTING_STATUSES } from '../../constants';
import type { TestingFramework, Entry } from '../../types/models';

/** Payload for creating a new testing framework */
export interface TestingFrameworkPayload {
  name: string;
  hypothesis: string;
  audience: string;
  metric: string;
  duration: string;
  notes: string;
  status: string;
}

interface TestingFrameworkFormProps {
  onSubmit: (payload: TestingFrameworkPayload) => void;
}

/**
 * TestingFrameworkForm - Form for creating new testing frameworks/experiments
 */
function TestingFrameworkForm({ onSubmit }: TestingFrameworkFormProps): React.ReactElement {
  const [name, setName] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [audience, setAudience] = useState('');
  const [metric, setMetric] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState(TESTING_STATUSES[0]);

  const reset = useCallback(() => {
    setName('');
    setHypothesis('');
    setAudience('');
    setMetric('');
    setDuration('');
    setNotes('');
    setStatus(TESTING_STATUSES[0]);
  }, []);

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!name.trim()) {
        window.alert('Please name the testing framework.');
        return;
      }
      onSubmit({
        name: name.trim(),
        hypothesis,
        audience,
        metric,
        duration,
        notes,
        status,
      });
      reset();
    },
    [name, hypothesis, audience, metric, duration, notes, status, onSubmit, reset],
  );

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-ocean-900">Testing Lab</CardTitle>
        <p className="text-sm text-graystone-600">
          Document hypotheses and guardrails for content experiments.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Framework name</Label>
              <Input
                value={name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
                placeholder="Experiment title"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatus(event.target.value)}
                className={cx(selectBaseClasses, 'w-full')}
              >
                {TESTING_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Hypothesis</Label>
            <Textarea
              value={hypothesis}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setHypothesis(event.target.value)
              }
              rows={3}
              placeholder="If we... then we expect..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Audience / segment</Label>
              <Input
                value={audience}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setAudience(event.target.value)}
                placeholder="Target audience"
              />
            </div>
            <div className="space-y-2">
              <Label>Primary metric</Label>
              <Input
                value={metric}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setMetric(event.target.value)}
                placeholder="Example: CTR, saves"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Test duration / cadence</Label>
            <Input
              value={duration}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setDuration(event.target.value)}
              placeholder="e.g. 2 weeks / 4 posts"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value)}
              rows={3}
              placeholder="Guardrails, next steps"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Save framework
            </Button>
            <Button type="button" variant="outline" onClick={reset}>
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface TestingFrameworkListProps {
  frameworks: TestingFramework[];
  onDelete: (id: string) => void;
  onSelect?: (id: string) => void;
  selectedId?: string;
  entryCounts?: Record<string, number>;
}

/**
 * TestingFrameworkList - Displays the list of testing frameworks/experiments
 */
function TestingFrameworkList({
  frameworks,
  onDelete,
  onSelect,
  selectedId,
  entryCounts = {},
}: TestingFrameworkListProps): React.ReactElement {
  const handleSelect = useCallback(
    (id: string) => {
      if (onSelect) onSelect(id);
    },
    [onSelect],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, id: string) => {
      if (!onSelect) return;
      // Ignore keyboard events bubbling from interactive children (e.g., Remove button)
      // to prevent unintended selection when activating child controls
      if (event.target !== event.currentTarget) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(id);
      }
    },
    [onSelect],
  );

  const handleDelete = useCallback(
    (event: MouseEvent<HTMLButtonElement>, id: string) => {
      event.stopPropagation();
      const confirmed = window.confirm('Remove this framework?');
      if (confirmed) onDelete(id);
    },
    [onDelete],
  );

  if (!frameworks.length) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-ocean-900">Experiment backlog</CardTitle>
          <p className="text-sm text-graystone-600">
            Log experiments and link them to content briefs.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-graystone-600">
            No frameworks yet. Create one to define your testing plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-ocean-900">Experiment backlog</CardTitle>
        <p className="text-sm text-graystone-600">
          Reference these when planning or reporting on tests.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {frameworks.map((framework) => (
            <div
              key={framework.id}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onClick={() => handleSelect(framework.id)}
              onKeyDown={(event) => handleKeyDown(event, framework.id)}
              className={cx(
                'space-y-2 rounded-2xl border p-4 text-left shadow-sm transition',
                selectedId === framework.id
                  ? 'border-ocean-500 bg-aqua-50 ring-2 ring-ocean-500/20'
                  : 'border-graystone-200 bg-white hover:border-aqua-300 hover:bg-aqua-50/50',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <div className="text-lg font-semibold text-ocean-900">{framework.name}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-graystone-500">
                    <span>{framework.status}</span>
                    <span>Created {new Date(framework.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedId === framework.id ? (
                    <span className="rounded-full bg-ocean-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                      Viewing hub
                    </span>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => handleDelete(event, framework.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs text-graystone-600 md:grid-cols-3">
                <span>
                  <span className="font-semibold text-graystone-700">Audience:</span>{' '}
                  {framework.audience || '-'}
                </span>
                <span>
                  <span className="font-semibold text-graystone-700">Metric:</span>{' '}
                  {framework.metric || '-'}
                </span>
                <span>
                  <span className="font-semibold text-graystone-700">Duration:</span>{' '}
                  {framework.duration || '-'}
                </span>
              </div>
              {framework.hypothesis && (
                <div className="rounded-xl bg-aqua-50 px-3 py-2 text-xs text-ocean-700">
                  <span className="font-semibold text-graystone-700">Hypothesis:</span>{' '}
                  {framework.hypothesis}
                </div>
              )}
              {framework.notes && (
                <div className="rounded-xl bg-graystone-100 px-3 py-2 text-xs text-graystone-700">
                  {framework.notes}
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-graystone-500">
                <span>
                  {entryCounts[framework.id]
                    ? `${entryCounts[framework.id]} linked ${
                        entryCounts[framework.id] === 1 ? 'entry' : 'entries'
                      }`
                    : 'No linked content yet'}
                </span>
                {onSelect ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-ocean-600">
                    View hub
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface TestingFrameworkHubProps {
  framework: TestingFramework | null;
  entries?: Entry[];
  onOpenEntry?: (id: string) => void;
}

/**
 * TestingFrameworkHub - Displays details and linked entries for a selected framework
 */
function TestingFrameworkHub({
  framework,
  entries = [],
  onOpenEntry,
}: TestingFrameworkHubProps): React.ReactElement {
  if (!framework) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-ocean-900">Experiment hub</CardTitle>
          <p className="text-sm text-graystone-600">
            Select an experiment on the left to see linked content and progress.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-graystone-600">
            Need a place to start? Create a framework and attach it to a brief from the Create
            Content form.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-ocean-900">{framework.name}</CardTitle>
            <p className="mt-1 text-sm text-graystone-600">
              {framework.hypothesis
                ? framework.hypothesis
                : 'Linked briefs inherit this testing framework for reporting.'}
            </p>
          </div>
          <span className="rounded-full bg-ocean-500/10 px-3 py-1 text-xs font-semibold text-ocean-700">
            {framework.status}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-graystone-500 md:grid-cols-3">
          <span>
            <span className="font-semibold text-graystone-700">Audience:</span>{' '}
            {framework.audience || '-'}
          </span>
          <span>
            <span className="font-semibold text-graystone-700">Metric:</span>{' '}
            {framework.metric || '-'}
          </span>
          <span>
            <span className="font-semibold text-graystone-700">Duration:</span>{' '}
            {framework.duration || '-'}
          </span>
        </div>
        <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-graystone-400">
          {entries.length} linked {entries.length === 1 ? 'item' : 'items'}
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-aqua-200 bg-aqua-50/40 px-4 py-6 text-center text-sm text-graystone-600">
            No content linked to this experiment yet. Attach a brief via Create Content to populate
            the hub.
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="space-y-2 rounded-2xl border border-graystone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{entry.assetType}</Badge>
                      <span className="text-sm font-semibold text-graystone-800">
                        {new Date(entry.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="rounded-full bg-aqua-100 px-2 py-0.5 text-xs font-medium text-ocean-700">
                        {entry.statusDetail}
                      </span>
                      <span
                        className={cx(
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          entry.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {entry.status}
                      </span>
                    </div>
                    {entry.caption && (
                      <p className="text-sm text-graystone-700 line-clamp-3">{entry.caption}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1 text-xs text-graystone-500">
                      {entry.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="inline-flex items-center gap-1 rounded-full bg-graystone-100 px-2 py-1"
                        >
                          <PlatformIcon platform={platform} />
                          {platform}
                        </span>
                      ))}
                    </div>
                    {(entry.campaign || entry.contentPillar) && (
                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-graystone-500">
                        {entry.campaign ? (
                          <span className="rounded-full bg-aqua-100 px-2 py-0.5 text-ocean-700">
                            {entry.campaign}
                          </span>
                        ) : null}
                        {entry.contentPillar ? (
                          <span className="rounded-full bg-graystone-100 px-2 py-0.5 text-graystone-700">
                            {entry.contentPillar}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  {onOpenEntry ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenEntry(entry.id)}
                      className="text-xs"
                    >
                      Open item
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface TestingViewProps {
  /** Array of testing frameworks */
  frameworks: TestingFramework[];
  /** ID of the currently selected framework */
  selectedFrameworkId?: string;
  /** The selected framework object */
  selectedFramework: TestingFramework | null;
  /** Entries linked to the selected framework */
  selectedFrameworkEntries: Entry[];
  /** Object mapping framework IDs to linked entry counts */
  frameworkEntryCounts: Record<string, number>;
  /** Callback to add a new framework */
  onAddFramework: (payload: TestingFrameworkPayload) => void;
  /** Callback to delete a framework */
  onDeleteFramework: (id: string) => void;
  /** Callback when selecting a framework */
  onSelectFramework: (id: string) => void;
  /** Callback when opening an entry detail */
  onOpenEntry: (id: string) => void;
}

/**
 * TestingView - Main view component for the Testing Lab feature
 */
export function TestingView({
  frameworks = [],
  selectedFrameworkId,
  selectedFramework,
  selectedFrameworkEntries = [],
  frameworkEntryCounts = {},
  onAddFramework,
  onDeleteFramework,
  onSelectFramework,
  onOpenEntry,
}: TestingViewProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr,1fr] xl:grid-cols-[1.5fr,1fr]">
      <TestingFrameworkForm onSubmit={onAddFramework} />
      <div className="space-y-6">
        <TestingFrameworkList
          frameworks={frameworks}
          onDelete={onDeleteFramework}
          onSelect={onSelectFramework}
          selectedId={selectedFrameworkId}
          entryCounts={frameworkEntryCounts}
        />
        <TestingFrameworkHub
          framework={selectedFramework}
          entries={selectedFrameworkEntries}
          onOpenEntry={onOpenEntry}
        />
      </div>
    </div>
  );
}

export default TestingView;
