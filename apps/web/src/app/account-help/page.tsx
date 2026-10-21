import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@grievease/ui';
import { ShieldAlert, HelpCircle, ArrowLeft, Phone, UserCheck } from 'lucide-react';

export default function AccountHelpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-2">
            <HelpCircle className="w-7 h-7" />
          </div>
          <CardTitle className="text-xl">Account Assistance & Support</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Account Locked (5 Failed Attempts)</span>
            </div>
            <p>
              Your account is locked for 15 minutes following repeated failed attempts. After 15 minutes, you can attempt to log in again with the correct password.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>Forgotten Password or Lost Recovery Codes</span>
            </div>
            <p>
              If you have lost your recovery codes and cannot answer your security questions, please reach out to your <strong>Society Secretary</strong> or <strong>Super Administrator</strong> in person. They can verify your tenancy face-to-face and issue a confidential physical activation slip.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-blue-500" />
              <span>Admin & Committee Members</span>
            </div>
            <p>
              Administrative roles cannot use security questions or automated recovery codes. All administrative credential resets must be performed by the Super Admin with offline verification.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/login">
              <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
