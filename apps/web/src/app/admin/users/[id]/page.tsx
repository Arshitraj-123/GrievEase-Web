'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Alert,
  Modal,
  Input,
} from '@grievease/ui';
import {
  User,
  Shield,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  Ban,
  CheckCircle,
  Building,
  Phone,
  Mail,
  Clock,
  Laptop,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { StepUpModal } from '@/components/StepUpModal';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = (params?.id as string) || '';

  const [user, setUser] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Step-Up Modal State
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [stepUpAction, setStepUpAction] = useState<((token: string) => Promise<void>) | null>(null);

  // Reissued Code Modal State
  const [reissuedCode, setReissuedCode] = useState<{ code: string; expiresAt: string } | null>(null);

  // Role Change Modal State
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('RESIDENT');

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUser(userId);
      setUser(data);
      setNewRole(data.role);
    } catch (err: any) {
      setError(err.message || 'Failed to load user details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const handleReissueCode = () => {
    setStepUpAction(() => async (stepUpToken: string) => {
      const res = await api.reissueCode(user.id, user.flat_number || 'VERIFY', stepUpToken);
      setReissuedCode({ code: res.activationCode, expiresAt: res.expiresAt });
      loadUserData();
    });
    setStepUpOpen(true);
  };

  const handleRoleChangeConfirm = () => {
    setRoleModalOpen(false);
    setStepUpAction(() => async (stepUpToken: string) => {
      await api.changeRole(user.id, newRole, stepUpToken);
      loadUserData();
    });
    setStepUpOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const nextStatus = user.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    try {
      await api.updateStatus(user.id, nextStatus);
      loadUserData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading member record...</span>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link href="/admin/users" className="inline-flex items-center text-sm text-teal-600 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Users
        </Link>
        <Alert variant="danger">{error || 'User not found'}</Alert>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/users" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              {user.full_name}
              <Badge variant={user.status === 'ACTIVE' ? 'success' : user.status === 'INVITED' ? 'warning' : 'outline'}>
                {user.status}
              </Badge>
            </h1>
            <p className="text-sm text-slate-500 font-mono">
              Member ID: {user.member_id} • @{user.username}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.status === 'INVITED' && (
            <Button variant="outline" onClick={handleReissueCode} className="text-amber-600 border-amber-300">
              <KeyRound className="w-4 h-4 mr-2" /> Reissue Activation Code
            </Button>
          )}

          <Button variant="outline" onClick={() => setRoleModalOpen(true)}>
            <Shield className="w-4 h-4 mr-2" /> Change Role
          </Button>

          <Button
            variant={user.status === 'DISABLED' ? 'primary' : 'outline'}
            onClick={handleToggleStatus}
            className={user.status === 'DISABLED' ? 'bg-emerald-600' : 'text-rose-600 border-rose-300'}
          >
            {user.status === 'DISABLED' ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" /> Enable Account
              </>
            ) : (
              <>
                <Ban className="w-4 h-4 mr-2" /> Disable Account
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
            <CardDescription>Verified personal details and society assignment</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block uppercase font-bold">Role</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user.role}</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block uppercase font-bold">Residence</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Wing {user.wing_name || user.wing || '-'}, Flat {user.flat_number || user.flat || '-'}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block uppercase font-bold">Contact Mobile</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {user.mobile || 'None'}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block uppercase font-bold">Email Address</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user.email || 'None'}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block uppercase font-bold">Directory Visibility</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user.directory_visible ? 'Visible to Neighbors' : 'Hidden (Private)'}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block uppercase font-bold">Registered Since</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Security Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Security Status</CardTitle>
            <CardDescription>Auth policy & 2FA state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <span className="text-xs text-slate-400 block uppercase font-bold">Password Set</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {user.password_hash ? 'Configured (Argon2id)' : 'Pending Activation'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <span className="text-xs text-slate-400 block uppercase font-bold">2FA (TOTP) Requirement</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {['SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY'].includes(user.role)
                  ? 'Mandatory (Offline Authenticator)'
                  : 'Optional (Recovery Codes active)'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <span className="text-xs text-slate-400 block uppercase font-bold">Last Active</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {user.last_seen_at ? new Date(user.last_seen_at).toLocaleString() : 'Never logged in'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Change Modal */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Change Member Role"
        description="Requires Super Admin elevated Step-Up verification. Role changes are recorded in the immutable audit log."
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Select New Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            >
              <option value="RESIDENT">RESIDENT</option>
              <option value="SECRETARY">SECRETARY</option>
              <option value="COMMITTEE">COMMITTEE</option>
              <option value="CHAIRMAN">CHAIRMAN</option>
              <option value="GOVERNING_BODY">GOVERNING_BODY</option>
              <option value="GUARD">GUARD</option>
              <option value="VENDOR">VENDOR</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChangeConfirm}>Proceed to Step-Up</Button>
          </div>
        </div>
      </Modal>

      {/* Step-Up Verification Modal */}
      <StepUpModal
        isOpen={stepUpOpen}
        onClose={() => setStepUpOpen(false)}
        onSuccess={async (stepUpToken: string) => {
          if (stepUpAction) await stepUpAction(stepUpToken);
        }}
      />

      {/* Reissued Code Display Modal */}
      {reissuedCode && (
        <Modal
          isOpen={!!reissuedCode}
          onClose={() => setReissuedCode(null)}
          title="Activation Code Reissued"
          description={`A new one-time activation code has been generated for ${user.username}. Hand this over personally.`}
        >
          <div className="space-y-4 py-2">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
              <span className="text-xs uppercase text-slate-400 block font-bold mb-1">One-Time Activation Code</span>
              <span className="font-mono text-2xl font-black text-teal-600 tracking-widest select-all">
                {reissuedCode.code}
              </span>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Expires at: {new Date(reissuedCode.expiresAt).toLocaleString()}. Old code has been invalidated.
            </p>
            <Button className="w-full" onClick={() => setReissuedCode(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
