'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  ChevronLeft,
  Printer,
  ShieldCheck,
  Receipt,
  AlertTriangle,
  FileText,
  Landmark,
} from 'lucide-react';

export default function PaymentReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const paymentId = resolvedParams.id;
  const { t } = useAccessibility();

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getPaymentReceipt(paymentId)
      .then((data) => setReceipt(data))
      .catch(() => {
        // Fallback demo receipt
        setReceipt({
          id: paymentId,
          receiptNo: 'RC/2026-27/000101',
          flatNumber: 'A-101',
          receivedFromName: 'Aarav Sharma',
          amountPaise: 385000,
          amountInWords: 'Rupees Three Thousand Eight Hundred Fifty Only',
          mode: 'CASH',
          receivedOn: '2026-10-12',
          status: 'RECORDED',
          collectorName: 'Vikram Singh',
          collectorRole: 'SECRETARY',
          allocations: [
            { description: 'Bill BILL/2026-27/000080 (Oct 2026)', amountPaise: 385000 },
          ],
          remainingBalancePaise: 0,
          receiptHash: 'a7b8c9d0e1f23456',
          auditChainStamp: 'f1e2d3c4b5a67890',
          societyName: 'Green Valley Residency Co-operative Housing Society Ltd.',
          societyAddress: 'Plot 42, Sector 18, Kharghar, Navi Mumbai 410210',
          createdAt: '2026-10-12T11:30:00.000Z',
        });
      })
      .finally(() => setLoading(false));
  }, [paymentId]);

  if (loading) {
    return (
      <ShellLayout role="RESIDENT">
        <div className="text-center py-12 text-slate-400 text-sm">
          Loading digital receipt...
        </div>
      </ShellLayout>
    );
  }

  const isVoided = receipt?.status === 'VOIDED';

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back and Print Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/app/payments"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Payments</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/app/disputes?paymentId=${receipt?.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-50 min-h-[44px]"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t.billing.disputeWrongEntry}</span>
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 min-h-[44px]"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Official Receipt */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-9 space-y-6 shadow-sm print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="text-center border-b border-slate-100 dark:border-slate-800 pb-5 space-y-1">
            <span className="text-[11px] font-black tracking-widest text-teal-600 uppercase">
              Official Cash Receipt
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {receipt?.societyName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {receipt?.societyAddress}
            </p>
          </div>

          {isVoided && (
            <div className="bg-red-50 dark:bg-red-950/60 p-4 rounded-2xl border border-red-200 dark:border-red-800 text-center text-red-700 dark:text-red-300 font-black text-sm">
              *** THIS RECEIPT HAS BEEN VOIDED AND REVERSED ***
              {receipt.voidReason && <p className="text-xs font-normal mt-1">Reason: {receipt.voidReason}</p>}
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-slate-400 block mb-0.5">{t.billing.receiptNumber}</span>
              <strong className="text-slate-900 dark:text-white font-mono">{receipt?.receiptNo}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">{t.billing.receiptDate}</span>
              <strong className="text-slate-900 dark:text-white">
                {new Date(receipt?.receivedOn).toLocaleDateString()}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Flat Number</span>
              <strong className="text-slate-900 dark:text-white">{receipt?.flatNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">{t.billing.receivedFrom}</span>
              <strong className="text-slate-900 dark:text-white">{receipt?.receivedFromName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">{t.billing.paymentMode}</span>
              <strong className="text-slate-900 dark:text-white">{receipt?.mode}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">{t.billing.collector}</span>
              <strong className="text-slate-900 dark:text-white">
                {receipt?.collectorName} ({receipt?.collectorRole})
              </strong>
            </div>
          </div>

          {/* Amount Callout */}
          <div className="bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 p-5 rounded-2xl text-center space-y-1">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase">
              Amount Received
            </span>
            <div className="text-2xl sm:text-3xl font-black text-teal-800 dark:text-teal-200">
              {formatPaise(receipt?.amountPaise || 0)}
            </div>
            <p className="text-xs font-medium text-teal-700 dark:text-teal-300 italic pt-1">
              &ldquo;{receipt?.amountInWords}&rdquo;
            </p>
          </div>

          {/* Allocations Table */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">
              Payment Allocation Breakdown:
            </span>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {receipt?.allocations?.map((a: any, idx: number) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300">{a.description}</span>
                  <strong className="text-slate-900 dark:text-white">{formatPaise(a.amountPaise)}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Balance & Audit Stamps */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400">
            <div>
              <span>Remaining Balance: </span>
              <strong className="text-slate-700 dark:text-slate-300">
                {formatPaise(receipt?.remainingBalancePaise || 0)}
              </strong>
            </div>
            <div className="font-mono flex items-center gap-2">
              <span>Code: <strong>{receipt?.receiptHash}</strong></span>
              <span>•</span>
              <span>Audit: <strong>{receipt?.auditChainStamp}</strong></span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center pt-2">
            This is an official computer-generated receipt from the GrievEase tamper-evident ledger. No physical signature required.
          </p>
        </div>
      </div>
    </ShellLayout>
  );
}

