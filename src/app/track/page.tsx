'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Clock, CheckCircle2, AlertTriangle, ArrowRight, Shield, User } from 'lucide-react';

interface MockTicket {
  id: string;
  title: string;
  category: string;
  society: string;
  unit: string;
  status: 'In Progress' | 'Resolved' | 'Escalated' | 'Pending';
  currentLevel: 'L1 Secretary' | 'L2 Committee' | 'L3 Chairman' | 'L4 Governing Body';
  slaHoursRemaining: number;
  filedAt: string;
  assignee: string;
  updates: {
    time: string;
    note: string;
    level: string;
  }[];
}

const SAMPLE_TICKETS: Record<string, MockTicket> = {
  'GR-101': {
    id: 'GR-101',
    title: 'Leaky faucet in A-101 master bathroom',
    category: 'Plumbing',
    society: 'Green Valley Residency',
    unit: 'Flat A-101',
    status: 'In Progress',
    currentLevel: 'L1 Secretary',
    slaHoursRemaining: 28,
    filedAt: 'Yesterday, 10:30 AM',
    assignee: 'Secretary dispatched to Plumber (Ramesh K.)',
    updates: [
      { time: 'Yesterday 10:30 AM', note: 'Complaint filed by resident with photo proof', level: 'L1' },
      { time: 'Yesterday 11:15 AM', note: 'Secretary acknowledged and approved work order', level: 'L1' },
      { time: 'Today 09:00 AM', note: 'Technician scheduled visit for 2:00 PM', level: 'L1' },
    ],
  },
  'GR-102': {
    id: 'GR-102',
    title: 'Parking gate arm sensor malfunction',
    category: 'Security & Gate',
    society: 'Green Valley Residency',
    unit: 'Common Area',
    status: 'In Progress',
    currentLevel: 'L1 Secretary',
    slaHoursRemaining: 41,
    filedAt: 'Today, 08:00 AM',
    assignee: 'Automated Gate Vendor (SecureTech)',
    updates: [
      { time: 'Today 08:00 AM', note: 'Complaint filed by security head', level: 'L1' },
      { time: 'Today 08:45 AM', note: 'Vendor dispatched for sensor replacement', level: 'L1' },
    ],
  },
  'GR-2026-104': {
    id: 'GR-2026-104',
    title: 'Main gate intercom malfunction',
    category: 'Security & Gate',
    society: 'Green Valley Residency',
    unit: 'Tower 1 Entrance',
    status: 'Resolved',
    currentLevel: 'L1 Secretary',
    slaHoursRemaining: 0,
    filedAt: '2 days ago',
    assignee: 'Resolved & Signed Off',
    updates: [
      { time: '2 days ago', note: 'Intercom connection issue reported', level: 'L1' },
      { time: '1 day ago', note: 'Wiring replaced by telecom vendor', level: 'L1' },
      { time: 'Yesterday 04:30 PM', note: 'Resident signed off with 5-star rating', level: 'L1' },
    ],
  },
};

export default function TrackPage() {
  const [ticketId, setTicketId] = useState('');
  const [foundTicket, setFoundTicket] = useState<MockTicket | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = ticketId.trim().toUpperCase();

    if (!query) {
      setErrorMsg('Please enter a ticket ID (e.g. GR-101, GR-102, or GR-2026-104)');
      setFoundTicket(null);
      return;
    }

    setErrorMsg('');
    setHasSearched(true);

    if (SAMPLE_TICKETS[query]) {
      setFoundTicket(SAMPLE_TICKETS[query]);
    } else {
      // Stub fallback for any arbitrary entered ticket ID
      setFoundTicket({
        id: query,
        title: 'Community Maintenance Request',
        category: 'General Maintenance',
        society: 'Green Valley Residency',
        unit: 'Resident Unit',
        status: 'In Progress',
        currentLevel: 'L1 Secretary',
        slaHoursRemaining: 34,
        filedAt: 'Recent submission',
        assignee: 'Secretary assigned to duty technician',
        updates: [
          { time: 'Submission', note: 'Ticket initialized with immutable timestamp', level: 'L1' },
          { time: 'Under Review', note: 'SLA countdown active (48 hours target)', level: 'L1' },
        ],
      });
    }
  };

  return (
    <div className="py-16 px-6 lg:px-12 bg-white">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-[650px] mx-auto mb-12">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            LIVE TRACKER
          </span>
          <h1 className="text-[34px] sm:text-[44px] font-extrabold text-[#1A1A2E] leading-tight mb-4">
            Track Your Complaint Status
          </h1>
          <p className="text-[15.5px] text-[#4A5568]">
            Enter your complaint ticket ID to view real-time SLA countdowns, assigned resolvers, and
            transparent escalation milestones.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-10">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Ticket ID (e.g. GR-101, GR-102)..."
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#00B894] uppercase tracking-wider font-mono shadow-2xs"
              />
              <Search className="w-5 h-5 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="px-7 py-3.5 rounded-2xl bg-[#00B894] hover:bg-[#00A383] text-white text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Search Ticket
            </button>
          </div>
          {errorMsg && <p className="text-xs text-red-500 mt-2 text-center">{errorMsg}</p>}

          <div className="mt-3 text-center text-xs text-[#718096]">
            Try sample tickets:{' '}
            <button
              type="button"
              onClick={() => {
                setTicketId('GR-101');
                setFoundTicket(SAMPLE_TICKETS['GR-101']);
                setHasSearched(true);
              }}
              className="font-mono text-[#00846A] font-bold underline hover:text-[#00B894] mx-1"
            >
              GR-101
            </button>
            •{' '}
            <button
              type="button"
              onClick={() => {
                setTicketId('GR-102');
                setFoundTicket(SAMPLE_TICKETS['GR-102']);
                setHasSearched(true);
              }}
              className="font-mono text-[#00846A] font-bold underline hover:text-[#00B894] mx-1"
            >
              GR-102
            </button>
            •{' '}
            <button
              type="button"
              onClick={() => {
                setTicketId('GR-2026-104');
                setFoundTicket(SAMPLE_TICKETS['GR-2026-104']);
                setHasSearched(true);
              }}
              className="font-mono text-[#00846A] font-bold underline hover:text-[#00B894] mx-1"
            >
              GR-2026-104
            </button>
          </div>
        </form>

        {/* Found Ticket Card */}
        {hasSearched && foundTicket && (
          <div className="bg-[#F8FAFC] rounded-3xl p-6 sm:p-10 border border-[#E2E8F0] shadow-sm animate-fade-in mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono font-bold text-sm text-[#00846A] bg-[#00B894]/10 px-2.5 py-0.5 rounded-md">
                    {foundTicket.id}
                  </span>
                  <span className="text-xs text-gray-500">• {foundTicket.category}</span>
                </div>
                <h2 className="text-xl font-bold text-[#1A1A2E]">{foundTicket.title}</h2>
                <div className="text-xs text-gray-500 mt-1">
                  {foundTicket.society} — {foundTicket.unit}
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    foundTicket.status === 'Resolved'
                      ? 'bg-emerald-100 text-[#00846A]'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {foundTicket.status}
                </span>
                {foundTicket.slaHoursRemaining > 0 && (
                  <div className="text-xs font-bold text-[#00846A] mt-1.5 flex items-center gap-1 justify-end">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{foundTicket.slaHoursRemaining}h remaining in L1</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4-Level Visual Horizontal Progression */}
            <div className="mb-8">
              <div className="text-xs font-bold text-[#718096] uppercase tracking-wider mb-3">
                Escalation Hierarchy Status
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 border-2 border-[#00B894] font-bold text-[#00846A]">
                  <div>L1: Secretary</div>
                  <div className="text-[10px] font-normal text-emerald-700">Active Handler</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-gray-200 text-gray-400">
                  <div>L2: Committee</div>
                  <div className="text-[10px]">72h threshold</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-gray-200 text-gray-400">
                  <div>L3: Chairman</div>
                  <div className="text-[10px]">96h threshold</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-gray-200 text-gray-400">
                  <div>L4: Governing</div>
                  <div className="text-[10px]">120h final</div>
                </div>
              </div>
            </div>

            {/* Timeline updates */}
            <div>
              <div className="text-xs font-bold text-[#718096] uppercase tracking-wider mb-4">
                Milestone Activity Log
              </div>
              <div className="space-y-4 pl-4 border-l-2 border-[#00B894]">
                {foundTicket.updates.map((u, i) => (
                  <div key={i} className="relative text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00B894] absolute -left-[21px] top-1" />
                    <div className="font-semibold text-[#1A1A2E]">{u.note}</div>
                    <div className="text-gray-500 mt-0.5">
                      {u.time} • Tier: {u.level}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
