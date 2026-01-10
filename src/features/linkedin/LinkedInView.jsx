import React, { useState, useMemo, useEffect } from 'react';
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
import { IdeaAttachment } from '../ideas';
import { cx, uuid } from '../../lib/utils';
import { selectBaseClasses, fileInputClasses } from '../../lib/styles';
import { LINKEDIN_TYPES, LINKEDIN_STATUSES, DEFAULT_APPROVERS } from '../../constants';

/**
 * LinkedInSubmissionForm - Form for creating LinkedIn post submissions
 */
function LinkedInSubmissionForm({ onSubmit, currentUser, approverOptions = DEFAULT_APPROVERS }) {
  const approverChoices = approverOptions.length ? approverOptions : DEFAULT_APPROVERS;
  const [submissionType, setSubmissionType] = useState(LINKEDIN_TYPES[0]);
  const fallbackPerson = approverChoices.includes(currentUser)
    ? currentUser
    : approverChoices[0] || currentUser;
  const [owner, setOwner] = useState(fallbackPerson);
  const [submitter, setSubmitter] = useState(fallbackPerson);
  const [postCopy, setPostCopy] = useState('');
  const [comments, setComments] = useState('');
  const [status, setStatus] = useState(LINKEDIN_STATUSES[0]);
  const [targetDate, setTargetDate] = useState('');
  const [links, setLinks] = useState(['']);
  const [attachments, setAttachments] = useState([]);
  const [title, setTitle] = useState('LinkedIn draft');

  useEffect(() => {
    if (approverChoices.includes(currentUser)) {
      setOwner(currentUser);
      setSubmitter(currentUser);
    }
  }, [currentUser, approverChoices]);

  const reset = () => {
    setSubmissionType(LINKEDIN_TYPES[0]);
    const resetValue = approverChoices.includes(currentUser)
      ? currentUser
      : approverChoices[0] || currentUser;
    setOwner(resetValue);
    setSubmitter(resetValue);
    setTitle('LinkedIn draft');
    setPostCopy('');
    setComments('');
    setStatus(LINKEDIN_STATUSES[0]);
    setTargetDate('');
    setLinks(['']);
    setAttachments([]);
  };

  const handleFileUpload = (event) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return;
        setAttachments((prev) => [
          ...prev,
          {
            id: uuid(),
            name: file.name,
            dataUrl: reader.result,
            type: file.type,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const updateLink = (index, value) => {
    setLinks((prev) => prev.map((link, idx) => (idx === index ? value : link)));
  };

  const addLinkField = () => setLinks((prev) => [...prev, '']);

  const removeLinkField = (index) => {
    setLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const submit = (event) => {
    event.preventDefault();
    if (!title.trim()) {
      window.alert('Please add a title for this submission.');
      return;
    }
    if (!postCopy.trim()) {
      window.alert('Please include draft post copy.');
      return;
    }
    const payload = {
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
  };

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
                onChange={(event) => setSubmissionType(event.target.value)}
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
                onChange={(event) => setStatus(event.target.value)}
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
                onChange={(event) => setOwner(event.target.value)}
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
                onChange={(event) => setSubmitter(event.target.value)}
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
              onChange={(event) => {
                const value = event.target.value;
                setPostCopy(value);
                const derived = value.trim().split(/\n+/)[0].slice(0, 80);
                if (derived) setTitle(derived);
              }}
              rows={6}
              placeholder="Your LinkedIn copy goes here"
            />
          </div>

          <div className="space-y-2">
            <Label>Comments</Label>
            <Textarea
              value={comments}
              onChange={(event) => setComments(event.target.value)}
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
                onChange={(event) => setTargetDate(event.target.value)}
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
                    onChange={(event) => updateLink(index, event.target.value)}
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

/**
 * LinkedInSubmissionList - Displays list of LinkedIn submissions with filtering
 */
function LinkedInSubmissionList({ submissions, onStatusChange }) {
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
              onChange={(event) => setFilter(event.target.value)}
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
                    onChange={(event) => onStatusChange(submission.id, event.target.value)}
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
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {link}
                          </a>
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

/**
 * LinkedInView - Main LinkedIn management feature module
 *
 * Combines the submission form and queue list into a single view.
 *
 * Props:
 * - submissions: Array of LinkedIn submission objects
 * - currentUser: Current user name/identifier
 * - approverOptions: Array of available approver names
 * - onSubmit: Callback when a new submission is created
 * - onStatusChange: Callback when a submission status changes (id, newStatus)
 */
export function LinkedInView({
  submissions = [],
  currentUser,
  approverOptions,
  onSubmit,
  onStatusChange,
}) {
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
