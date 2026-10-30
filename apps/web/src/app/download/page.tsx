'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';
import { Building2, Shield, Smartphone, QrCode, CheckCircle2 } from 'lucide-react';
import { siteConfig } from '@/config/site';

export default function DownloadPage() {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://grievease.in'}/download`;
    QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: { dark: '#1A1A2E', light: '#FFFFFF' },
    }).then(setQrUrl);
  }, []);

  const hasIos = Boolean(siteConfig.storeUrls.ios);
  const hasAndroid = Boolean(siteConfig.storeUrls.android);

  return (
    <div className="section-fluid bg-white">
      <div className="container-fluid">
        <div className="text-center max-w-[840px] mx-auto mb-14">
          <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            OFFICIAL MOBILE APP
          </span>
          <h1 className="fluid-h1 font-extrabold text-[#1A1A2E] leading-tight mb-4">
            Get GrievEase on iOS &amp; Android
          </h1>
          <p className="fluid-lead text-[#4A5568]">
            Raise grievances, track SLA countdowns, pre-approve visitors, and receive emergency alerts
            directly on your smartphone.
          </p>
        </div>

        <div className="bg-[#F0FAF7] rounded-3xl p-8 sm:p-14 border border-[#B0EBDC]/80 grid grid-cols-1 md:grid-cols-12 gap-10 items-center max-w-5xl mx-auto shadow-xs">
          <div className="md:col-span-7 space-y-6">
            <h2 className="fluid-h2 font-bold text-[#1A1A2E]">
              Everything you need, right in your pocket
            </h2>

            <div className="space-y-3.5 fluid-body text-[#4A5568]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#00846A]" />
                <span>Instant photo &amp; audio complaint submission</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#00846A]" />
                <span>Real-time gate pass approvals for guests and couriers</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#00846A]" />
                <span>One-tap Emergency SOS broadcast to main gate security</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#00846A]" />
                <span>Biometric login with Face ID / Fingerprint</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              {hasIos ? (
                <a
                  href={siteConfig.storeUrls.ios}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1A1A2E] text-white rounded-2xl px-6 py-3.5 flex items-center gap-3 shadow-md hover:bg-[#2E3440] transition-colors"
                >
                  <span className="text-xl"></span>
                  <div className="text-left">
                    <div className="text-[10px] text-white/70">Download on the</div>
                    <div className="text-sm font-bold">App Store</div>
                  </div>
                </a>
              ) : (
                <button
                  disabled
                  className="bg-gray-200 text-gray-500 rounded-2xl px-6 py-3.5 flex items-center gap-3 cursor-not-allowed opacity-80"
                >
                  <span className="text-xl"></span>
                  <div className="text-left">
                    <div className="text-[10px] text-gray-500">iOS App</div>
                    <div className="text-sm font-bold">Coming soon</div>
                  </div>
                </button>
              )}

              {hasAndroid ? (
                <a
                  href={siteConfig.storeUrls.android}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1A1A2E] text-white rounded-2xl px-6 py-3.5 flex items-center gap-3 shadow-md hover:bg-[#2E3440] transition-colors"
                >
                  <span className="text-xl">▶</span>
                  <div className="text-left">
                    <div className="text-[10px] text-white/70">Get it on</div>
                    <div className="text-sm font-bold">Google Play</div>
                  </div>
                </a>
              ) : (
                <button
                  disabled
                  className="bg-gray-200 text-gray-500 rounded-2xl px-6 py-3.5 flex items-center gap-3 cursor-not-allowed opacity-80"
                >
                  <span className="text-xl">▶</span>
                  <div className="text-left">
                    <div className="text-[10px] text-gray-500">Android App</div>
                    <div className="text-sm font-bold">Coming soon</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col items-center text-center">
            <div className="bg-white p-5 rounded-3xl border border-[#CBD5E1] shadow-md mb-3">
              {qrUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrUrl}
                  alt="Scan QR code to install GrievEase app"
                  className="w-44 h-44 object-contain"
                />
              ) : (
                <div className="w-44 h-44 bg-gray-100 animate-pulse rounded-xl" />
              )}
            </div>
            <div className="text-xs font-bold text-[#1A1A2E]">Scan with phone camera</div>
            <div className="text-[11px] text-[#718096]">Direct smart link for iOS &amp; Android</div>
          </div>
        </div>
      </div>
    </div>
  );
}
