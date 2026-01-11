import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  type ChangeEvent,
  type FormEvent,
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
import { PlusIcon } from '../../components/common';
import { IdeaAttachment, type IdeaAttachmentData } from '../ideas';
import { cx, uuid } from '../../lib/utils';
import { selectBaseClasses, fileInputClasses } from '../../lib/styles';
import { LINKEDIN_TYPES, LINKEDIN_STATUSES, DEFAULT_APPROVERS } from '../../constants';

/**
 * Validates that a URL is safe to use as an href (only http/https allowed).
 * Prevents XSS via javascript:, data:, or other dangerous schemes.
 */
function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    // Invalid URL format
    return false;
  }
}

/** Payload for creating a new LinkedIn submission */
export interface LinkedInSubmissionPayload {
  submissionType: string;
  owner: string;
  submitter: string;
  postCopy: string;
  comments: string;
  status: string;
  targetDate: string;
  links: string[];
  attachments: IdeaAttachmentData[];
  title: string;
}

/** LinkedIn submission with metadata (returned from storage/API) */
export interface LinkedInSubmissionItem {
  id: string;
  submissionType: string;
  status: string;
  title: string;
  postCopy: string;
  comments: string;
  owner: string;
  submitter: string;
  links: string[];
  attachments: IdeaAttachmentData[];
  targetDate: string;
  createdAt: string;
  updatedAt?: string;
}

interface LinkedInSubmissionFormProps {
  onSubmit: (payload: LinkedInSubmissionPayload) => void;
  currentUser: string | null;
  approverOptions?: readonly string[];
}

// Helper to check if a string is in an array (works with readonly arrays)
const includesString = (arr: readonly string[], value: string): boolean => arr.includes(value);

/**
 * LinkedInSubmissionForm - Form for creating LinkedIn post submissions
 */
function LinkedInSubmissionForm({
  onSubmit,
  currentUser,
  approverOptions = DEFAULT_APPROVERS,
}: LinkedInSubmissionFormProps): React.ReactElement {
  const approverChoices = approverOptions.length ? approverOptions : DEFAULT_APPROVERS;
  const [submissionType, setSubmissionType] = useState(LINKEDIN_TYPES[0]);
  const fallbackPerson =
    currentUser && includesString(approverChoices, currentUser)
      ? currentUser
      : approverChoices[0] || currentUser || '';
  const [owner, setOwner] = useState(fallbackPerson);
  const [submitter, setSubmitter] = useState(fallbackPerson);
  const [postCopy, setPostCopy] = useState('');
  const [comments, setComments] = useState('');
  const [status, setStatus] = useState(LINKEDIN_STATUSES[0]);
  const [targetDate, setTargetDate] = useState('');
  const [links, setLinks] = useState<string[]>(['']);
  const [attachments, setAttachments] = useState<IdeaAttachmentData[]>([]);
  const [title, setTitle] = useState('LinkedIn draft');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Track active FileReader instances for cleanup
  const activeReadersRef = useRef<Set<FileReader>>(new Set());

  useEffect(() => {
    if (currentUser && includesString(approverChoices, currentUser)) {
      setOwner(currentUser);
      setSubmitter(currentUser);
    }
  }, [currentUser, approverChoices]);

  // Cleanup: abort any in-progress FileReaders on unmount
  useEffect(() => {
    const readers = activeReadersRef.current;
    return () => {
      readers.forEach((reader) => {
        if (reader.readyState === FileReader.LOADING) {
          reader.abort();
        }
      });
      readers.clear();
    };
  }, []);

  const reset = useCallback(() => {
    setSubmissionType(LINKEDIN_TYPES[0]);
    const resetValue =
      currentUser && includesString(approverChoices, currentUser)
        ? currentUser
        : approverChoices[0] || currentUser || '';
    setOwner(resetValue);
    setSubmitter(resetValue);
    setTitle('LinkedIn draft');
    setPostCopy('');
    setComments('');
    setStatus(LINKEDIN_STATUSES[0]);
    setTargetDate('');
    setLinks(['']);
    setAttachments([]);
    setUploadError(null);
  }, [currentUser, approverChoices]);

  const handleFileUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);
    const files: File[] = Array.from(fileList);
    files.forEach((file) => {
      const reader = new FileReader();
      const fileName = file.name;
      const fileType = file.type;
      const fileSize = file.size;

      // Track this reader for cleanup
      activeReadersRef.current.add(reader);

      reader.onload = () => {
        activeReadersRef.current.delete(reader);
        if (typeof reader.result !== 'string') return;
        setAttachments((prev) => [
          ...prev,
          {
            id: uuid(),
            name: fileName,
            dataUrl: reader.result as string,
            type: fileType,
            size: fileSize,
          },
        ]);
      };

      reader.onerror = () => {
        activeReadersRef.current.delete(reader);
        setUploadError(`Failed to read file: ${fileName}`);
      };

      reader.readAsDataURL(file);
    });
    event.target.value = '';
  }, []);

  const updateLink = useCallback((index: number, value: string) => {
    setLinks((prev) => prev.map((link, idx) => (idx === index ? value : link)));
  }, []);

  const addLinkField = useCallback(() => setLinks((prev) => [...prev, '']), []);

  const removeLinkField = useCallback((index: number) => {
    setLinks((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!title.trim()) {
        window.alert('Please add a title for this submission.');
        return;
      }
      if (!postCopy.trim()) {
        window.alert('Please include draft post copy.');
        return;
      }
      const payload: LinkedInSubmissionPayload = {
        submissionType,
        owner: owner || currentUser || '',
        submitter: submitter || currentUser || '',
        postCopy,
        comments,
        status,
        targetDate,
        links: links.filter((link) => link && link.trim()),
        attachments,
        title,
      };
      onSubmit(payload);
      reset();
    },
    [
      title,
      postCopy,
      submissionType,
      owner,
      submitter,
      comments,
      status,
      targetDate,
      links,
      attachments,
      currentUser,
      onSubmit,
      reset,
    ],
  );

  const handlePostCopyChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setPostCopy(value);
    const derived = value.trim().split(/\n+/)[0].slice(0, 80);
    if (derived) setTitle(derived);
  }, []);

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-ocean-900">LinkedIn submission</CardTitle>
        <p className="text-sm text-graystone-600">
          Share draft copy for personal accounts and route approvals.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Submission type</Label>
              <select
                value={submissionType}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setSubmissionType(event.target.value)
                }
                className={cx(selectBaseClasses, 'w-full')}
              >
                {LINKEDIN_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatus(event.target.value)}
                className={cx(selectBaseClasses, 'w-full')}
              >
                {LINKEDIN_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Account owner</Label>
              <select
                value={owner}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setOwner(event.target.value)}
                className={cx(selectBaseClasses, 'w-full')}
              >
                {approverChoices.map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Submitted by</Label>
              <select
                value={submitter}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setSubmitter(event.target.value)
                }
                className={cx(selectBaseClasses, 'w-full')}
              >
                {approverChoices.map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Copy</Label>
            <Textarea
              value={postCopy}
              onChange={handlePostCopyChange}
              rows={6}
              placeholder="Your LinkedIn copy goes here"
            />
          </div>

          <div className="space-y-2">
            <Label>Comments</Label>
            <Textarea
              value={comments}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setComments(event.target.value)
              }
              rows={3}
              placeholder="Key points, hashtags, tagging instructions"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Target publish date</Label>
              <Input
                type="date"
                value={targetDate}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setTargetDate(event.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Links to include</Label>
            <div className="space-y-2">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={link}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      updateLink(index, event.target.value)
                    }
                    placeholder="https://..."
                  />
                  {links.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLinkField(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addLinkField}>
              Add another link
            </Button>
          </div>

          <div className="space-y-3">
            <Label>Images / videos to include</Label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className={cx(fileInputClasses, 'text-xs')}
            />
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-3">
                    <IdeaAttachment attachment={attachment} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Submit for review
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

interface LinkedInSubmissionListProps {
  submissions: LinkedInSubmissionItem[];
  onStatusChange: (id: string, status: string) => void;
}

/**
 * LinkedInSubmissionList - Displays list of LinkedIn submissions with filtering
 */
function LinkedInSubmissionList({
  submissions,
  onStatusChange,
}: LinkedInSubmissionListProps): React.ReactElement {
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() => {
    if (filter === 'All') return submissions;
    return submissions.filter((item) => item.status === filter);
  }, [submissions, filter]);

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-ocean-900">LinkedIn queue</CardTitle>
            <p className="text-sm text-graystone-600">
              Review, approve, and share drafted LinkedIn posts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-graystone-500">Filter</Label>
            <select
              value={filter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilter(event.target.value)}
              className={cx(selectBaseClasses, 'px-4 py-2 text-sm')}
            >
              <option value="All">All statuses</option>
              {LINKEDIN_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-graystone-600">
            No submissions yet. Share a draft using the form.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((submission) => (
              <div
                key={submission.id}
                className="space-y-2 rounded-2xl border border-graystone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{submission.submissionType}</Badge>
                    <span className="rounded-full bg-aqua-100 px-2 py-0.5 text-xs text-ocean-700">
                      {submission.owner || 'Unknown owner'}
                    </span>
                    <span className="text-[11px] text-graystone-500">
                      Submitted by {submission.submitter || 'Unknown'}
                    </span>
                  </div>
                  <select
                    value={submission.status}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      onStatusChange(submission.id, event.target.value)
                    }
                    className={cx(selectBaseClasses, 'w-32 px-3 py-1 text-xs')}
                  >
                    {LINKEDIN_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-lg font-semibold text-ocean-900">{submission.title}</div>
                <div className="whitespace-pre-wrap text-sm text-graystone-700">
                  {submission.postCopy}
                </div>
                {submission.comments && (
                  <div className="rounded-xl bg-aqua-50 px-3 py-2 text-xs text-ocean-700">
                    <span className="font-semibold">Comments:</span> {submission.comments}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-graystone-500">
                  {submission.targetDate ? (
                    <span>Target date {new Date(submission.targetDate).toLocaleDateString()}</span>
                  ) : null}
                  <span>Created {new Date(submission.createdAt).toLocaleString()}</span>
                </div>
                {submission.links && submission.links.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-graystone-500">
                      Links
                    </div>
                    <ul className="space-y-1 text-sm text-ocean-600">
                      {submission.links.map((link, idx) => (
                        <li key={idx}>
                          {isSafeUrl(link) ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {link}
                            </a>
                          ) : (
                            <span className="text-graystone-500">{link}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {submission.attachments && submission.attachments.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-graystone-500">
                      Attachments
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {submission.attachments.map((attachment) => (
                        <IdeaAttachment key={attachment.id} attachment={attachment} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface LinkedInViewProps {
  /** Array of LinkedIn submission objects */
  submissions: LinkedInSubmissionItem[];
  /** Current user name/identifier */
  currentUser: string | null;
  /** Array of available approver names */
  approverOptions?: string[];
  /** Callback when a new submission is created */
  onSubmit: (payload: LinkedInSubmissionPayload) => void;
  /** Callback when a submission status changes (id, newStatus) */
  onStatusChange: (id: string, status: string) => void;
}

/**
 * LinkedInView - Main LinkedIn management feature module
 *
 * Combines the submission form and queue list into a single view.
 */
export function LinkedInView({
  submissions = [],
  currentUser,
  approverOptions,
  onSubmit,
  onStatusChange,
}: LinkedInViewProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <LinkedInSubmissionForm
        onSubmit={onSubmit}
        currentUser={currentUser}
        approverOptions={approverOptions}
      />
      <LinkedInSubmissionList submissions={submissions} onStatusChange={onStatusChange} />
    </div>
  );
}

export default LinkedInView;
