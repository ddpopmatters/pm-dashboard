import React, { useState, useCallback, type ChangeEvent, type FormEvent } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Button,
  Input,
  Textarea,
  Label,
} from '../../components/ui';
import { PlusIcon } from '../../components/common';
import { cx, uuid } from '../../lib/utils';
import { selectBaseClasses, fileInputClasses } from '../../lib/styles';
import { IDEA_TYPES } from '../../constants';
import { IdeaAttachment, type IdeaAttachmentData } from './IdeaAttachment';

// File upload limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILE_COUNT = 10;

export interface IdeaPayload {
  type: string;
  title: string;
  notes: string;
  inspiration: string;
  links: string[];
  attachments: IdeaAttachmentData[];
  createdBy: string;
  targetDate?: string;
  targetMonth?: string;
}

export interface IdeaFormProps {
  /** Callback when form is submitted */
  onSubmit: (payload: IdeaPayload) => void;
  /** Current user name for attribution */
  currentUser: string | null;
}

// Default type with fallback for empty IDEA_TYPES
const defaultType = IDEA_TYPES[0] ?? 'General';

export function IdeaForm({ onSubmit, currentUser }: IdeaFormProps): React.ReactElement {
  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [inspiration, setInspiration] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetMonth, setTargetMonth] = useState('');
  const [links, setLinks] = useState<string[]>(['']);
  const [attachments, setAttachments] = useState<IdeaAttachmentData[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setType(defaultType);
    setTitle('');
    setNotes('');
    setInspiration('');
    setLinks(['']);
    setAttachments([]);
    setTargetDate('');
    setTargetMonth('');
    setUploadError(null);
  }, []);

  /**
   * Read a single file as data URL
   */
  const readFileAsDataUrl = (file: File): Promise<IdeaAttachmentData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error(`Failed to read ${file.name}`));
          return;
        }
        resolve({
          id: uuid(),
          name: file.name,
          dataUrl: reader.result,
          type: file.type,
          size: file.size,
        });
      };
      reader.onerror = () => {
        reject(new Error(`Failed to read ${file.name}`));
      };
      reader.readAsDataURL(file);
    });
  };

  /**
   * Handle file uploads with validation and sequential reading to preserve order
   */
  const handleFileUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;

      setUploadError(null);
      const files: File[] = Array.from(fileList);

      // Check total count limit
      const remainingSlots = MAX_FILE_COUNT - attachments.length;
      if (files.length > remainingSlots) {
        setUploadError(
          `Maximum ${MAX_FILE_COUNT} attachments allowed. You can add ${remainingSlots} more.`,
        );
        event.target.value = '';
        return;
      }

      // Validate file sizes
      const oversizedFiles = files.filter((f: File) => f.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        const names = oversizedFiles.map((f: File) => f.name).join(', ');
        setUploadError(`Files too large (max 5MB): ${names}`);
        event.target.value = '';
        return;
      }

      // Read files sequentially to preserve selection order
      const newAttachments: IdeaAttachmentData[] = [];
      for (const file of files) {
        try {
          const attachment = await readFileAsDataUrl(file);
          newAttachments.push(attachment);
        } catch {
          setUploadError(`Failed to read file: ${file.name}`);
        }
      }

      if (newAttachments.length > 0) {
        setAttachments((prev) => [...prev, ...newAttachments]);
      }

      event.target.value = '';
    },
    [attachments.length],
  );

  const updateLink = (index: number, value: string) => {
    setLinks((prev) => prev.map((link, idx) => (idx === index ? value : link)));
  };

  const addLinkField = () => setLinks((prev) => [...prev, '']);

  const removeLinkField = (index: number) => {
    setLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    setUploadError(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      window.alert('Please add a title for the idea.');
      return;
    }
    const monthValue = targetMonth ? targetMonth : targetDate ? targetDate.slice(0, 7) : '';

    const payload: IdeaPayload = {
      type,
      title: title.trim(),
      notes: notes.trim(),
      inspiration: inspiration.trim(),
      links: links.map((link) => link.trim()).filter(Boolean),
      attachments,
      createdBy: currentUser || 'Unknown',
      targetDate: targetDate || undefined,
      targetMonth: monthValue || undefined,
    };
    onSubmit(payload);
    reset();
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-ocean-900">Log a New Idea</CardTitle>
        <p className="text-sm text-graystone-500">Capture inspiration before it disappears.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Idea type</Label>
              <select
                value={type}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setType(event.target.value)}
                className={cx(selectBaseClasses, 'w-full')}
              >
                {IDEA_TYPES.length > 0 ? (
                  IDEA_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))
                ) : (
                  <option value={defaultType}>{defaultType}</option>
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Logged by</Label>
              <Input value={currentUser || 'Unknown'} readOnly className="bg-graystone-100" />
            </div>
            <div className="space-y-2">
              <Label>Target month</Label>
              <input
                type="month"
                value={targetMonth}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setTargetMonth(event.target.value)
                }
                className={cx(selectBaseClasses, 'w-full')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target date (optional)</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setTargetDate(event.target.value)}
            />
            <p className="text-xs text-graystone-500">
              Set a specific day if you already know when you want this idea to land.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)}
              placeholder="Working title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value)}
              rows={4}
              placeholder="What is the angle or concept?"
            />
          </div>

          <div className="space-y-2">
            <Label>Resources / inspiration</Label>
            <Textarea
              value={inspiration}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setInspiration(event.target.value)
              }
              rows={3}
              placeholder="Reference podcasts, creators, campaigns, or prompts"
            />
          </div>

          <div className="space-y-3">
            <Label>Links</Label>
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
            <Label>Attachments</Label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={attachments.length >= MAX_FILE_COUNT}
              className={cx(fileInputClasses, 'text-xs')}
            />
            <p className="text-xs text-graystone-500">
              Max {MAX_FILE_COUNT} files, 5MB each. {attachments.length}/{MAX_FILE_COUNT} used.
            </p>
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
              <PlusIcon className="h-4 w-4 text-white" />
              Log idea
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

export default IdeaForm;
