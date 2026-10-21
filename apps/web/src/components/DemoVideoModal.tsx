'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Play, VideoOff, ArrowRight } from 'lucide-react';
import { siteConfig } from '@/config/site';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoVideoModal({ isOpen, onClose }: DemoVideoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full p-6 text-[#1A1A2E] shadow-2xl relative border border-[#E2E8F0]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close demo modal"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#718096] hover:text-[#1A1A2E] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00B894] to-[#00D4AA] flex items-center justify-center text-white shadow-xs">
            <Play className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h3 id="modal-title" className="text-xl font-bold text-[#1A1A2E]">
              GrievEase Interactive Product Walkthrough
            </h3>
            <p className="text-xs text-[#718096]">
              See how auto-escalation, resolver tracking, and resident transparency operate in real time.
            </p>
          </div>
        </div>

        {/* Video or Coming Soon Container */}
        {siteConfig.demoVideoUrl ? (
          <div className="w-full aspect-video bg-[#1A1A2E] rounded-2xl overflow-hidden shadow-inner">
            <iframe
              src={siteConfig.demoVideoUrl}
              title="GrievEase Product Walkthrough Video"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="w-full aspect-video bg-[#F0FAF7] border-2 border-dashed border-[#00B894]/30 rounded-2xl flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 rounded-full bg-[#00B894]/15 text-[#00B894] flex items-center justify-center mb-4">
              <VideoOff className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-[#1A1A2E] mb-1.5">Interactive Demo Coming Soon</h4>
            <p className="text-sm text-[#4A5568] max-w-md mb-6 leading-relaxed">
              We are currently finalizing the latest walkthrough recording. In the meantime, our team
              is happy to give your society managing committee a live, personalized walkthrough!
            </p>
            <Link
              href="/contact?type=demo"
              onClick={onClose}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white text-sm font-semibold shadow-[0_4px_15px_rgba(0,184,148,0.35)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <span>Schedule a 15-Minute Live Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-[#E2E8F0] text-sm font-semibold text-[#4A5568] hover:bg-[#F8FAFC] transition-colors"
          >
            Close
          </button>
          <Link
            href="/join"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#00B894] text-white text-sm font-semibold hover:bg-[#00A383] transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}
