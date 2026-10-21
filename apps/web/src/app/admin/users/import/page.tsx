'use client';

import React, { useState } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Alert } from '@grievease/ui';
import { StepUpModal } from '@/components/StepUpModal';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Printer,
  FileText,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Step-Up state for commit
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [commitResult, setCommitResult] = useState<any | null>(null);

  const handleDownloadTemplate = () => {
    window.open(api.getTemplateUrl(), '_blank');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setPreviewData(null);
      setCommitResult(null);
    }
  };

  const handleUploadAndPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError(null);
    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          if (!base64) throw new Error('File read error');
          const res = await api.uploadImport(base64, file.name);
          setPreviewData(res);
        } catch (err: any) {
          setError(err.message || 'Failed to parse file.');
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'File upload error.');
      setIsLoading(false);
    }
  };

  const handleCommitConfirmed = async (stepUpToken: string) => {
    if (!previewData) return;
    setIsLoading(true);
    try {
      const res = await api.commitImport(previewData.batchId, stepUpToken);
      setCommitResult(res);
      setPreviewData(null);
    } catch (err: any) {
      setError(err.message || 'Commit failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!confirm('Are you sure you want to rollback this import batch? Unactivated invited users will be deleted.')) {
      return;
    }
    if (!commitResult && !previewData) return;
    const batchId = commitResult?.batchId || previewData?.batchId;
    try {
      await api.rollbackImport(batchId);
      alert('Batch rolled back successfully.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Rollback failed');
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Super Administrator">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Bulk Member Import</h1>
            <p className="text-xs text-slate-500 mt-1">
              Upload member spreadsheets (.csv, .xlsx). Max 5,000 rows. Read-only formula hardened.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} leftIcon={<Download className="w-4 h-4" />}>
            Download Template (.csv)
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* 1. UPLOAD FORM */}
        {!previewData && !commitResult && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Step 1: Upload Spreadsheet</CardTitle>
              <CardDescription>
                Ensure your sheet includes: member_id, full_name, mobile, role, wing, flat, and verify_detail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadAndPreview} className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <Upload className="w-10 h-10 text-teal-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {file ? file.name : 'Choose a .csv or .xlsx file to inspect'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Max file size 5 MB. Macro-enabled (.xlsm) blocked.</p>
                  <input
                    type="file"
                    accept=".csv, .xlsx"
                    onChange={handleFileChange}
                    className="mt-4 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" disabled={!file} isLoading={isLoading}>
                    Upload & Inspect Preview
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 2. PREVIEW RESULTS */}
        {previewData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{previewData.totalRows}</div>
                <div className="text-xs text-slate-400">Total Rows</div>
              </Card>
              <Card className="p-4 text-center border-green-200 dark:border-green-900">
                <div className="text-2xl font-bold text-green-600">{previewData.validRows}</div>
                <div className="text-xs text-slate-400">Valid Rows</div>
              </Card>
              <Card className="p-4 text-center border-red-200 dark:border-red-900">
                <div className="text-2xl font-bold text-red-600">{previewData.invalidRows}</div>
                <div className="text-xs text-slate-400">Errors</div>
              </Card>
              <Card className="p-4 text-center border-amber-200 dark:border-amber-900">
                <div className="text-2xl font-bold text-amber-600">{previewData.duplicateRows}</div>
                <div className="text-xs text-slate-400">Duplicates</div>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Validation Table (Sample)</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreviewData(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={previewData.validRows === 0}
                    onClick={() => setStepUpOpen(true)}
                  >
                    Commit Valid Rows ({previewData.validRows}) with Step-Up
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="p-3">Row</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Flat</th>
                      <th className="p-3">Errors / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewData.previewRows.map((r: any, idx: number) => (
                      <tr key={idx} className={r.valid ? '' : 'bg-red-50/30 dark:bg-red-950/20'}>
                        <td className="p-3 font-mono text-slate-400">#{r.rowNo}</td>
                        <td className="p-3">
                          {r.valid ? (
                            <Badge variant="success">Valid</Badge>
                          ) : (
                            <Badge variant="danger">Invalid</Badge>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {r.raw.full_name || '-'}
                        </td>
                        <td className="p-3 font-mono">{r.raw.role || 'RESIDENT'}</td>
                        <td className="p-3">{r.raw.flat ? `${r.raw.wing || ''}-${r.raw.flat}` : '-'}</td>
                        <td className="p-3 text-red-600 dark:text-red-400">
                          {r.errors?.join(', ') || 'Ready for provisioning'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* 3. COMMIT SUCCESS & CREDENTIAL SLIPS */}
        {commitResult && (
          <div className="space-y-6">
            <Card className="border border-green-300 dark:border-green-800 p-6 space-y-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {commitResult.committedCount} Accounts Successfully Provisioned!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                One-time activation codes have been generated. Print the slips below or download CSV. Each code is valid for 7 days.
              </p>

              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4" />}>
                  Print All Slips
                </Button>
                <Button variant="secondary" size="sm" onClick={handleRollback} leftIcon={<RotateCcw className="w-4 h-4" />}>
                  Rollback Batch (Within 7 Days)
                </Button>
              </div>
            </Card>

            {/* Printable Slips Grid */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Credential Slips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {commitResult.slips?.map((s: any, idx: number) => (
                  <Card key={idx} className="p-4 border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
                    <div className="flex items-start justify-between border-b pb-2">
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">{s.fullName}</div>
                        <div className="text-xs text-slate-400 font-mono">Member: {s.memberId}</div>
                      </div>
                      <Badge variant="outline">Confidential</Badge>
                    </div>

                    <div className="flex items-center gap-4">
                      {s.qrCode && <img src={s.qrCode} alt="QR" className="w-20 h-20 border rounded-lg p-1" />}
                      <div className="space-y-1 text-xs">
                        <div className="text-slate-400">Flat: <strong>{s.wing}-{s.flat}</strong> ({s.role})</div>
                        <div className="text-slate-400">Username: <code className="font-bold text-slate-900 dark:text-white">{s.username}</code></div>
                        <div className="pt-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">One-Time Activation Code:</span>
                          <span className="font-mono text-base font-black text-teal-600 tracking-wider select-all">{s.code}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 border-t pt-2">
                      Hand over personally. Activate at: {s.activationUrl}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        <StepUpModal
          isOpen={stepUpOpen}
          onClose={() => setStepUpOpen(false)}
          title="Commit Member Import"
          description="Confirm administrative credentials to provision users and generate activation codes."
          onSuccess={handleCommitConfirmed}
        />
      </div>
    </ShellLayout>
  );
}
