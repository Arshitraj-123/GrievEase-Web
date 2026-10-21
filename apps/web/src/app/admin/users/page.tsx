'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Badge, Modal, Alert } from '@grievease/ui';
import { StepUpModal } from '@/components/StepUpModal';
import {
  Search,
  UserPlus,
  FileSpreadsheet,
  KeyRound,
  ShieldAlert,
  UserX,
  UserCheck,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [wingFilter, setWingFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Step-Up Modal State
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [stepUpAction, setStepUpAction] = useState<((stepUpToken: string) => Promise<void>) | null>(null);

  // Reissued Code Modal State
  const [reissuedCode, setReissuedCode] = useState<{ code: string; expiresAt: string; username: string } | null>(null);

  // Role Change Modal State
  const [roleChangeUser, setRoleChangeUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState('RESIDENT');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.listUsers({
        search,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        wing: wingFilter || undefined,
      });
      setUsers(data.items || []);
      setTotal(data.total || 0);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, wingFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  // Reissue Activation Code (Step-up required)
  const triggerReissueCode = (user: any) => {
    setStepUpAction(() => async (stepUpToken: string) => {
      const res = await api.reissueCode(user.id, user.flat_number || 'VERIFY', stepUpToken);
      setReissuedCode({ code: res.activationCode, expiresAt: res.expiresAt, username: user.username });
      fetchUsers();
    });
    setStepUpOpen(true);
  };

  // Change Role (Step-up required)
  const triggerChangeRole = (user: any) => {
    setRoleChangeUser(user);
    setNewRole(user.role);
  };

  const confirmRoleChange = () => {
    if (!roleChangeUser) return;
    setStepUpAction(() => async (stepUpToken: string) => {
      await api.changeRole(roleChangeUser.id, newRole, stepUpToken);
      setRoleChangeUser(null);
      fetchUsers();
    });
    setStepUpOpen(true);
  };

  // Toggle user status (Active vs Disabled)
  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    try {
      await api.updateStatus(user.id, nextStatus);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Super Administrator">
      <div className="space-y-6">
        {/* Header and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Members & Staff Directory</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage residents, administrative roles, and credential issuance. ({total} total registered)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a href="/admin/users/import">
              <Button variant="outline" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
                Import Sheet
              </Button>
            </a>
            <a href="/admin/users/new">
              <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
                Add Member
              </Button>
            </a>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <Card className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by name, username, flat, or member ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="">All Roles</option>
              <option value="RESIDENT">Resident</option>
              <option value="SECRETARY">Secretary (L1)</option>
              <option value="COMMITTEE">Committee (L2)</option>
              <option value="CHAIRMAN">Chairman (L3)</option>
              <option value="GOVERNING_BODY">Governing Body (L4)</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="GUARD">Guard</option>
              <option value="VENDOR">Vendor</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INVITED">Invited</option>
              <option value="LOCKED">Locked</option>
              <option value="DISABLED">Disabled</option>
            </select>

            <select
              value={wingFilter}
              onChange={(e) => setWingFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="">All Wings</option>
              <option value="A">Wing A</option>
              <option value="B">Wing B</option>
            </select>

            <Button type="submit" variant="secondary" size="sm">
              Filter
            </Button>
          </form>
        </Card>

        {/* Members Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Member ID / Name</th>
                  <th className="p-3.5">Flat / Wing</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Mobile (Contact)</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {isLoading ? 'Loading members...' : 'No members found matching filter criteria.'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{u.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.member_id} ({u.username})</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {u.flat_number ? `${u.flat_number}` : 'External'}
                        </span>
                        {u.wing_name && <span className="text-[10px] text-slate-400 ml-1">({u.wing_name})</span>}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            u.role === 'SUPER_ADMIN'
                              ? 'danger'
                              : u.role === 'SECRETARY' || u.role === 'CHAIRMAN'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            u.status === 'ACTIVE'
                              ? 'success'
                              : u.status === 'INVITED'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {u.mobile}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {u.role !== 'SUPER_ADMIN' && (
                          <>
                            <button
                              onClick={() => triggerReissueCode(u)}
                              title="Reissue one-time activation code"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => triggerChangeRole(u)}
                              title="Change administrative role"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              title={u.status === 'DISABLED' ? 'Enable account' : 'Disable account'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              {u.status === 'DISABLED' ? <UserCheck className="w-4 h-4 text-green-600" /> : <UserX className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Step-Up Verification Modal */}
      <StepUpModal
        isOpen={stepUpOpen}
        onClose={() => setStepUpOpen(false)}
        onSuccess={async (stepUpToken) => {
          if (stepUpAction) await stepUpAction(stepUpToken);
        }}
      />

      {/* Reissued Code Display Modal */}
      {reissuedCode && (
        <Modal
          isOpen={!!reissuedCode}
          onClose={() => setReissuedCode(null)}
          title="Activation Code Reissued"
          description={`A new one-time activation code has been generated for ${reissuedCode.username}. Hand this over personally.`}
        >
          <div className="space-y-4 py-2">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
              <span className="text-xs uppercase text-slate-400 block font-bold mb-1">One-Time Activation Code</span>
              <span className="font-mono text-2xl font-black text-teal-600 tracking-widest select-all">
                {reissuedCode.code}
              </span>
              <span className="text-[11px] text-slate-400 block mt-2">
                Valid for 7 days (Expires: {new Date(reissuedCode.expiresAt).toLocaleDateString()})
              </span>
            </div>
            <p className="text-xs text-slate-500 text-center">
              ⚠️ Marked confidential. The user must complete activation at <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">/activate</code>.
            </p>
            <Button variant="primary" className="w-full" onClick={() => setReissuedCode(null)}>
              Done
            </Button>
          </div>
        </Modal>
      )}

      {/* Change Role Modal */}
      {roleChangeUser && (
        <Modal
          isOpen={!!roleChangeUser}
          onClose={() => setRoleChangeUser(null)}
          title={`Change Role: ${roleChangeUser.full_name}`}
          description="Changing to or from administrative roles requires step-up authentication and terminates active sessions."
        >
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Select New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="RESIDENT">RESIDENT (Standard member)</option>
                <option value="SECRETARY">SECRETARY (L1 Escalation)</option>
                <option value="COMMITTEE">COMMITTEE (L2 Escalation)</option>
                <option value="CHAIRMAN">CHAIRMAN (L3 Escalation)</option>
                <option value="GOVERNING_BODY">GOVERNING_BODY (L4 Final)</option>
                <option value="GUARD">GUARD (Security Personnel)</option>
                <option value="VENDOR">VENDOR (Service Technician)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setRoleChangeUser(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={confirmRoleChange}>
                Confirm with Step-Up
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ShellLayout>
  );
}
