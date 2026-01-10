import { useState } from 'react';
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
import { IdeaAttachment } from './IdeaAttachment';

export function IdeaForm({ onSubmit, currentUser }) {
  const [type, setType] = useState(IDEA_TYPES[0]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [inspiration, setInspiration] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetMonth, setTargetMonth] = useState('');
  const [links, setLinks] = useState(['']);
  const [attachments, setAttachments] = useState([]);

  const reset = () => {
    setType(IDEA_TYPES[0]);
    setTitle('');
    setNotes('');
    setInspiration('');
    setLinks(['']);
    setAttachments([]);
    setTargetDate('');
    setTargetMonth('');
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
      window.alert('Please add a title for the idea.');
      return;
    }
    const monthValue = targetMonth ? targetMonth : targetDate ? targetDate.slice(0, 7) : '';

    const payload = {
      type,
      title: title.trim(),
      notes: notes.trim(),
      inspiration: inspiration.trim(),
      links: links.filter((link) => link && link.trim()),
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
                onChange={(event) => setType(event.target.value)}
                className={cx(selectBaseClasses, 'w-full')}
              >
                {IDEA_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
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
                onChange={(event) => setTargetMonth(event.target.value)}
                className={cx(selectBaseClasses, 'w-full')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target date (optional)</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
            />
            <p className="text-xs text-graystone-500">
              Set a specific day if you already know when you want this idea to land.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Working title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="What is the angle or concept?"
            />
          </div>

          <div className="space-y-2">
            <Label>Resources / inspiration</Label>
            <Textarea
              value={inspiration}
              onChange={(event) => setInspiration(event.target.value)}
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
            <Label>Attachments</Label>
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
