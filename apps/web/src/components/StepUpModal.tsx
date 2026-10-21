'use client';

import React, { useState } from 'react';
import { Modal, Input, Button, Alert } from '@grievease/ui';
import { ShieldAlert, KeyRound } from 'lucide-react';
import { api } from '@/lib/api-client';

export interface StepUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  onSuccess: (stepUpToken: string) => Promise<void>;
  requireTotp?: boolean;
}

export function StepUpModal({
  isOpen,
  onClose,
  title = 'Elevated Security Verification',
  description = 'This sensitive action requires confirming your administrative credentials.',
  onSuccess,
  requireTotp = true,
}: StepUpModalProps) {
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.stepUp({ password, totpCode: requireTotp ? totpCode : undefined });
      if (res.stepUpToken) {
        await onSuccess(res.stepUpToken);
        onClose();
        setPassword('');
        setTotpCode('');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-teal-900 dark:text-teal-200 text-xs">
          <ShieldAlert className="w-5 h-5 text-teal-600 shrink-0" />
          <span>Elevated access claim will remain active for 5 minutes.</span>
        </div>

        <Input
          id="stepup-password"
          label="Your Current Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {requireTotp && (
          <Input
            id="stepup-totp"
            label="6-Digit Authenticator (TOTP) Code"
            type="text"
            placeholder="123456"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
            leftIcon={<KeyRound className="w-4 h-4" />}
            required
          />
        )}

        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Verify & Proceed
          </Button>
        </div>
      </form>
    </Modal>
  );
}
