'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Building2 } from 'lucide-react';
import { siteConfig } from '@/config/site';

export function DownloadApp() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    // Generate real scannable QR code pointing to the smart download route
    const downloadUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://grievease.in'}/download`;

    QRCode.toDataURL(downloadUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#1A1A2E',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code generation failed:', err));
  }, []);

  const hasIosUrl = Boolean(siteConfig.storeUrls.ios);
  const hasAndroidUrl = Boolean(siteConfig.storeUrls.android);

  return (
    <section id="download" aria-labelledby="download-heading" className="section-fluid bg-white">
      <div className="container-fluid bg-[#F0FAF7] rounded-[36px] p-8 sm:p-14 border border-[#B0EBDC]/70 relative overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Info Column (7 cols) */}
          <div className="lg:col-span-7">
            <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2 block">
              GET THE APP
            </span>
            <h2
              id="download-heading"
              className="fluid-h2 font-bold text-[#1A1A2E] leading-tight mb-3"
            >
              Your society in your pocket
            </h2>
            <p className="fluid-body text-[#4A5568] leading-relaxed max-w-[520px] mb-8">
              Available on iOS and Android. Same real-time experience, same powerful 4-level auto-escalation
              features, and direct guard visitor approvals — right on the go.
            </p>

            {/* Store Buttons Row */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              {/* App Store Button */}
              {hasIosUrl ? (
                <a
                  href={siteConfig.storeUrls.ios}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1A1A2E] text-white rounded-xl px-5 py-3 flex items-center gap-3 shadow-xs hover:bg-[#2E3440] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
                >
                  <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 170 170" aria-hidden="true">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.42-6-9.13-10.74-19.46-14.22-30.98-3.48-11.53-5.22-22.37-5.22-32.53 0-14.13 3.69-25.75 11.07-34.86 7.38-9.12 16.51-13.79 27.38-14.02 5.01 0 10.37 1.25 16.08 3.75 5.71 2.5 9.5 3.75 11.36 3.75 1.52 0 5.53-1.3 12.04-3.9 6.51-2.6 11.97-3.79 16.38-3.57 12.18.65 21.84 5.38 28.98 14.19-10.65 6.42-15.86 15.33-15.64 26.74.22 8.91 3.75 16.41 10.6 22.5 6.84 6.09 14.78 9.51 23.8 10.27-2.39 7.39-5.11 14.56-8.16 21.51zM119.22 33.15c0-7.39 2.66-14.29 7.99-20.7 5.33-6.41 12.01-10.87 20.05-13.37-.11 1.74-.27 3.26-.49 4.56-.65 7.17-3.42 13.91-8.31 20.21-4.89 6.3-11.25 10.38-19.08 12.23-.05-1.09-.16-2.07-.16-2.93z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] text-white/70 leading-none">Download on the</div>
                    <div className="text-[15px] font-bold leading-tight">App Store</div>
                  </div>
                </a>
              ) : (
                <button
                  disabled
                  aria-disabled="true"
                  className="bg-gray-200 text-gray-500 rounded-xl px-5 py-3 flex items-center gap-3 cursor-not-allowed opacity-80"
                >
                  <svg className="w-6 h-6 text-gray-400 fill-current" viewBox="0 0 170 170" aria-hidden="true">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.42-6-9.13-10.74-19.46-14.22-30.98-3.48-11.53-5.22-22.37-5.22-32.53 0-14.13 3.69-25.75 11.07-34.86 7.38-9.12 16.51-13.79 27.38-14.02 5.01 0 10.37 1.25 16.08 3.75 5.71 2.5 9.5 3.75 11.36 3.75 1.52 0 5.53-1.3 12.04-3.9 6.51-2.6 11.97-3.79 16.38-3.57 12.18.65 21.84 5.38 28.98 14.19-10.65 6.42-15.86 15.33-15.64 26.74.22 8.91 3.75 16.41 10.6 22.5 6.84 6.09 14.78 9.51 23.8 10.27-2.39 7.39-5.11 14.56-8.16 21.51z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] text-gray-500 leading-none">iOS App</div>
                    <div className="text-[14px] font-bold leading-tight">Coming soon</div>
                  </div>
                </button>
              )}

              {/* Google Play Button */}
              {hasAndroidUrl ? (
                <a
                  href={siteConfig.storeUrls.android}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1A1A2E] text-white rounded-xl px-5 py-3 flex items-center gap-3 shadow-xs hover:bg-[#2E3440] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
                >
                  <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a2.215 2.215 0 0 1-.22-.986V2.8c0-.36.08-.696.219-.986zM15.207 13.414l2.122 2.122-12.014 6.936 9.892-9.058zm0-2.828L5.315 1.528l12.014 6.936-2.122 2.122zm1.414 1.414l3.536 2.042c1.132.654 1.132 1.722 0 2.376l-3.536 2.042-2.122-2.122 2.122-4.338z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] text-white/70 leading-none">Get it on</div>
                    <div className="text-[15px] font-bold leading-tight">Google Play</div>
                  </div>
                </a>
              ) : (
                <button
                  disabled
                  aria-disabled="true"
                  className="bg-gray-200 text-gray-500 rounded-xl px-5 py-3 flex items-center gap-3 cursor-not-allowed opacity-80"
                >
                  <svg className="w-6 h-6 text-gray-400 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a2.215 2.215 0 0 1-.22-.986V2.8c0-.36.08-.696.219-.986zM15.207 13.414l2.122 2.122-12.014 6.936 9.892-9.058zm0-2.828L5.315 1.528l12.014 6.936-2.122 2.122zm1.414 1.414l3.536 2.042c1.132.654 1.132 1.722 0 2.376l-3.536 2.042-2.122-2.122 2.122-4.338z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] text-gray-500 leading-none">Android App</div>
                    <div className="text-[14px] font-bold leading-tight">Coming soon</div>
                  </div>
                </button>
              )}
            </div>

            {/* REAL QR Code Box */}
            <div className="bg-white rounded-2xl p-4 inline-flex items-center gap-4 border border-[#E2E8F0] shadow-sm">
              <div className="w-[68px] h-[68px] bg-white rounded-lg p-1 border border-gray-100 flex items-center justify-center shrink-0">
                {qrCodeDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrCodeDataUrl}
                    alt="Scan QR code to open GrievEase app download"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 animate-pulse rounded" />
                )}
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#1A1A2E]">Scan to download</div>
                <div className="text-[11px] text-[#718096]">
                  Point phone camera to install directly
                </div>
              </div>
            </div>
          </div>

          {/* Right Phone Mockup (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-[220px] sm:w-[240px] bg-[#1A1A2E] rounded-[38px] p-2.5 shadow-2xl rotate-6 transform hover:rotate-1 transition-transform duration-300 border-2 border-[#2E3440]">
              <div className="w-full bg-white rounded-[30px] overflow-hidden p-5 flex flex-col items-center justify-center text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00B894] to-[#00D4AA] flex items-center justify-center text-white mb-3 shadow-[0_4px_16px_rgba(0,184,148,0.4)]">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="text-[18px] font-bold text-[#1A1A2E]">GrievEase</div>
                <div className="text-[11px] text-[#00846A] font-semibold mt-0.5">
                  Resident Mobile App
                </div>
                <div className="w-full mt-6 space-y-2">
                  <div className="h-2 bg-[#F1F5F9] rounded-full w-3/4 mx-auto" />
                  <div className="h-2 bg-[#F1F5F9] rounded-full w-1/2 mx-auto" />
                </div>

                {/* Only display version if configured */}
                {siteConfig.appVersion && (
                  <div className="mt-6 px-4 py-1.5 rounded-full bg-[#00B894]/15 text-[#00846A] text-[10px] font-bold">
                    ✓ Version {siteConfig.appVersion} Live
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
