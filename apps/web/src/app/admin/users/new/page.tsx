'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from '@grievease/ui';
import { UserPlus, ArrowLeft, KeyRound, Printer, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function NewUserPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('RESIDENT');
  const [wing, setWing] = useState('A');
  const [flat, setFlat] = useState('');
  const [verifyDetail, setVerifyDetail] = useState('');
  const [directoryVisible, setDirectoryVisible] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.createUser({
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim() || null,
        role,
        wing: wing.trim(),
        flat: flat.trim(),
        verifyDetail: verifyDetail.trim() || flat.trim(),
        directoryVisible,
      });
      setCreatedResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to create user account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Super Administrator">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/users')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Add New Member</h1>
            <p className="text-xs text-slate-500">
              Create an invited resident or staff profile and generate their physical activation slip.
            </p>
          </div>
        </div>

        {createdResult ? (
          <Card className="border border-teal-300 dark:border-teal-700 shadow-xl p-6 space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Account Created Successfully</h3>
              <p className="text-xs text-slate-500">
                The account has been created in <span className="font-semibold text-amber-600">INVITED</span> status. Hand over the activation code below personally.
              </p>
            </div>

            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-2 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{createdResult.user?.full_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Username:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{createdResult.user?.username}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Member ID:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{createdResult.user?.member_id}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">Activation Code:</span>
                <span className="font-mono font-black text-teal-600 text-base tracking-widest select-all">
                  {createdResult.activationCode}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Expires At:</span>
                <span className="text-slate-500">{new Date(createdResult.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4" />}>
                Print Credential Slip
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => router.push('/admin/users')}>
                Back to Directory
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Member Details</CardTitle>
              <CardDescription>
                Mobile number is used only as contact information and never as proof of identity.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <Alert variant="danger">{error}</Alert>}

                <Input
                  label="Full Name"
                  placeholder="e.g. Ramesh Patel"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Mobile Number (Contact only)"
                    placeholder="+919876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address (Optional)"
                    placeholder="ramesh@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Assigned Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="RESIDENT">Resident</option>
                      <option value="SECRETARY">Secretary (L1)</option>
                      <option value="COMMITTEE">Committee (L2)</option>
                      <option value="CHAIRMAN">Chairman (L3)</option>
                      <option value="GOVERNING_BODY">Governing Body (L4)</option>
                      <option value="GUARD">Guard</option>
                      <option value="VENDOR">Vendor</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Wing
                    </label>
                    <select
                      value={wing}
                      onChange={(e) => setWing(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="A">Wing A</option>
                      <option value="B">Wing B</option>
                    </select>
                  </div>

                  <Input
                    label="Flat Number"
                    placeholder="e.g. 101"
                    value={flat}
                    onChange={(e) => setFlat(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Verification Detail"
                  placeholder="Defaults to Flat Number (e.g. A-101) or Date of Birth"
                  value={verifyDetail}
                  onChange={(e) => setVerifyDetail(e.target.value)}
                  helperText="User must enter this matching detail on /activate to verify identity."
                />

                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={directoryVisible}
                    onChange={(e) => setDirectoryVisible(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Show in resident directory (opt-in)</span>
                </label>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isLoading} rightIcon={<KeyRound className="w-4 h-4" />}>
                    Create Account & Generate Code
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </ShellLayout>
  );
}
