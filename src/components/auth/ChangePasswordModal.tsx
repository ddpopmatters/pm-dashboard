import React, { useState, useEffect } from 'react';
import { Modal, Button, Label, Input } from '../ui';

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Whether to require current password (false for first-time setup) */
  requiresCurrent: boolean;
  /** Callback to submit the password change */
  onSubmit: (data: ChangePasswordData) => Promise<void>;
}

/**
 * ChangePasswordModal - Modal for changing or setting user password
 */
export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  onClose,
  requiresCurrent,
  onSubmit,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (requiresCurrent && !currentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ currentPassword, newPassword });
      setSuccess('Password updated. Use it the next time you sign in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      const errorMessage =
        submitError instanceof Error ? submitError.message : 'Unable to update password.';
      setError(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="change-password-title">
      <form className="space-y-4 px-6 py-6" onSubmit={handleSubmit}>
        <div>
          <h3 id="change-password-title" className="text-lg font-semibold text-ocean-900">
            Update password
          </h3>
          <p className="text-xs text-graystone-500">
            {requiresCurrent
              ? 'Enter your current password and choose a new one (minimum 8 characters).'
              : 'Set a password so you can sign in without requesting a new invite.'}
          </p>
        </div>
        {requiresCurrent ? (
          <div className="space-y-2">
            <Label className="text-sm text-graystone-600" htmlFor="account-current-password">
              Current password
            </Label>
            <Input
              id="account-current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-2xl border border-graystone-200 px-4 py-3 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-aqua-200"
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label className="text-sm text-graystone-600" htmlFor="account-new-password">
            New password
          </Label>
          <Input
            id="account-new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-2xl border border-graystone-200 px-4 py-3 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-aqua-200"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-graystone-600" htmlFor="account-new-password-confirm">
            Confirm new password
          </Label>
          <Input
            id="account-new-password-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-2xl border border-graystone-200 px-4 py-3 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-aqua-200"
          />
        </div>
        {error ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving...' : 'Save password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
