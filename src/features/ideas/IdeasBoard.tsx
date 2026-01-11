import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Badge,
  Button,
  Label,
} from '../../components/ui';
import { TrashIcon, PlusIcon, CheckCircleIcon } from '../../components/common';
import { cx } from '../../lib/utils';
import { selectBaseClasses } from '../../lib/styles';
import { IDEA_TYPES } from '../../constants';
import { IdeaAttachment } from './IdeaAttachment';
import type { Idea } from '../../types/models';

export interface IdeasBoardProps {
  /** List of ideas to display */
  ideas: Idea[];
  /** Callback when an idea is deleted */
  onDelete: (id: string) => void;
  /** Callback when creating an entry from an idea */
  onCreateEntry?: (idea: Idea) => void;
}

/**
 * IdeasBoard - Displays a filterable grid of idea cards
 */
export const IdeasBoard: React.FC<IdeasBoardProps> = ({ ideas, onDelete, onCreateEntry }) => {
  const [filter, setFilter] = useState('All');

  const filteredIdeas = useMemo(() => {
    if (filter === 'All') return ideas;
    return ideas.filter((idea) => idea.type === filter);
  }, [ideas, filter]);

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-ocean-900">Ideas Library</CardTitle>
            <p className="text-sm text-graystone-500">
              A living backlog of topics, themes, and series ideas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-graystone-500">Filter</Label>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className={cx(selectBaseClasses, 'px-4 py-2 text-sm')}
            >
              <option value="All">All ideas</option>
              {IDEA_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredIdeas.length === 0 ? (
          <p className="text-sm text-graystone-500">
            No ideas logged yet. Capture your next spark on the left.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredIdeas.map((idea) => (
              <div
                key={idea.id}
                className="rounded-2xl border border-graystone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{idea.type}</Badge>
                      <span className="rounded-full bg-aqua-50 px-2 py-1 text-xs text-ocean-600">
                        Logged {new Date(idea.createdAt).toLocaleString()}
                      </span>
                      {idea.createdBy ? (
                        <span className="text-xs text-graystone-500">by {idea.createdBy}</span>
                      ) : null}
                    </div>
                    <div className="break-words text-lg font-semibold text-ocean-900">
                      {idea.title}
                    </div>
                    {idea.notes && (
                      <p className="whitespace-pre-wrap break-words text-sm text-graystone-700">
                        {idea.notes}
                      </p>
                    )}
                    {idea.inspiration && (
                      <div className="break-words rounded-xl bg-aqua-50 p-3 text-xs text-ocean-700">
                        <span className="font-semibold">Inspiration:</span> {idea.inspiration}
                      </div>
                    )}
                    {idea.links && idea.links.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-semibold uppercase tracking-wide text-graystone-500">
                          Links
                        </div>
                        <ul className="space-y-1 text-sm text-ocean-600">
                          {idea.links.map((link, index) => (
                            <li key={index}>
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-words hover:underline"
                              >
                                {link}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {idea.attachments && idea.attachments.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-graystone-500">
                          Attachments
                        </div>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {idea.attachments.map((attachment) => (
                            <IdeaAttachment key={attachment.id} attachment={attachment} />
                          ))}
                        </div>
                      </div>
                    )}
                    {(idea.targetMonth || idea.targetDate) && (
                      <div className="text-xs text-graystone-500">
                        {idea.targetMonth ? `Planned for ${idea.targetMonth}` : null}
                        {idea.targetDate
                          ? ` • Aim for ${new Date(idea.targetDate).toLocaleDateString()}`
                          : null}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {idea.convertedToEntryId ? (
                      <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                        <CheckCircleIcon className="h-3 w-3" />
                        Converted to entry
                      </div>
                    ) : onCreateEntry ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCreateEntry(idea)}
                        className="gap-1 text-ocean-700"
                      >
                        <PlusIcon className="h-4 w-4 text-ocean-700" />
                        Create entry
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const confirmDelete = window.confirm('Remove this idea from the log?');
                        if (confirmDelete) onDelete(idea.id);
                      }}
                    >
                      <TrashIcon className="h-4 w-4 text-graystone-500" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IdeasBoard;
