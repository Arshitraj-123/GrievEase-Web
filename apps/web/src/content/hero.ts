export const heroContent = {
  badge: 'Smarter Communities, Happier Living',
  headline: {
    line1: 'Raise. Track.',
    accent: 'Resolve.',
  },
  description:
    'GrievEase is a modern, self-hosted society governance platform that ensures resident complaints get resolved with strict turnaround SLAs. Residents report issues with photo proof or file sensitive matters anonymously, track progress through 4 automated escalation levels, and manage cash maintenance payments with immutable audit receipts — all with zero third-party tracking.',
  ctaPrimary: {
    label: 'Activate your account',
    href: '/activate',
  },
  ctaSecondary: {
    label: 'Watch Demo',
  },
  ctaTrack: {
    label: 'Track a complaint',
    href: '/track',
  },
  highlights: [
    { id: 'h1', icon: 'shield-check', text: '100% Privacy & In-App Alerts' },
    { id: 'h2', icon: 'clock', text: '4-Level Auto-Escalation SLAs' },
    { id: 'h3', icon: 'lock', text: 'Immutable Cryptographic Audit Trail' },
    { id: 'h4', icon: 'receipt', text: 'Cash Maintenance with Verified Receipts' },
  ],
  floatingCards: {
    slaRunning: {
      tag: 'SLA timer running',
      title: 'Wing B Elevator Cable Inspection',
      timeRemaining: '18h 42m remaining at L1 (Secretary)',
      level: 'L1',
    },
    escalated: {
      tag: 'Escalated to Committee',
      title: 'Common Tank Booster Overhaul',
      timeRemaining: 'Auto-routed past 48h limit',
      level: 'L2',
    },
  },
  annotation: {
    line1: 'A better community',
    line2: 'starts with you',
  },
  residentMockup: {
    residentName: 'Aarav Patel',
    unit: 'Flat A-101',
    societyName: 'Green Valley Residency',
    counts: {
      open: 2,
      inProgress: 1,
      escalated: 0,
      resolved: 5,
    },
    recentComplaints: [
      {
        id: 'GR-101',
        title: 'Leaky faucet in A-101',
        status: 'In Progress',
        statusColor: 'text-[#F59E0B] bg-amber-50 border-amber-200',
        dotColor: 'bg-[#F59E0B]',
        level: 'L1 Secretary',
      },
      {
        id: 'GR-102',
        title: 'Parking gate repair',
        status: 'Open',
        statusColor: 'text-[#3B82F6] bg-blue-50 border-blue-200',
        dotColor: 'bg-[#3B82F6]',
        level: 'L1 Secretary',
      },
      {
        id: 'GR-103',
        title: 'Lift not working',
        status: 'Open',
        statusColor: 'text-[#3B82F6] bg-blue-50 border-blue-200',
        dotColor: 'bg-[#3B82F6]',
        level: 'L1 Secretary',
      },
    ],
  },
};
