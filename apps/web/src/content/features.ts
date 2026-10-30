export const featuresContent = {
  tag: 'KEY FEATURES',
  heading: 'Everything you need for a better society',
  description:
    'From initial reporting to permanent resolution, GrievEase brings cryptographic accountability and absolute transparency to community management. Every ticket follows strict turnaround SLAs, while sensitive actions are permanently logged to an immutable audit ledger without reliance on external services.',
  items: [
    {
      id: 'reporting',
      icon: 'file-edit',
      title: 'Easy Issue Reporting',
      description: 'Report issues in seconds with verifiable proof and precise area tagging.',
      bullets: [
        'Attach camera photos and device file evidence',
        'Toggle anonymous whistleblower mode with 16-character code',
        'Auto-route to Secretary or specific maintenance categories',
      ],
      color: '#00B894',
      bg: 'bg-[#00B894]/10',
    },
    {
      id: 'tracking',
      icon: 'clock',
      title: 'Real-time Tracking',
      description: 'Stay informed at every milestone with live countdown timers and activity logs.',
      bullets: [
        'Live countdown showing exact remaining SLA hours',
        'Chronological activity history of technician assignments',
        'Instant in-app notifications without invasive SMS or push',
      ],
      color: '#3B82F6',
      bg: 'bg-[#3B82F6]/10',
    },
    {
      id: 'escalation',
      icon: 'zap',
      title: '4-Level Auto-Escalation',
      description: 'Guaranteed governance safety net that automatically advances unattended complaints.',
      bullets: [
        'Automatic transfer from Secretary (48h) to Committee (72h)',
        'Executive intervention by Chairman (96h) and Governing Body (120h)',
        'Server-side cron triggers with zero resident chasing required',
      ],
      color: '#F59E0B',
      bg: 'bg-[#F59E0B]/10',
    },
    {
      id: 'vendors',
      icon: 'users',
      title: 'Verified Vendor Dispatches',
      description: 'Streamline maintenance contractors with scheduled gate passes and photo signoff.',
      bullets: [
        'Assign jobs directly to plumbers, electricians, and lift technicians',
        'Auto-generated contractor gate passes for security guards',
        'Mandatory before/after repair photos and resident rating signoff',
      ],
      color: '#8B5CF6',
      bg: 'bg-[#8B5CF6]/10',
    },
    {
      id: 'security',
      icon: 'shield-check',
      title: 'Immutable Audit Trail',
      description: 'Bank-grade cryptographic hash chaining preventing tamper or post-facto alterations.',
      bullets: [
        'Every status change, assignment, and payment is SHA-256 chained',
        'Append-only cash maintenance ledger with manual receipt numbers',
        'Downloadable compliance reports for annual general meetings',
      ],
      color: '#10B981',
      bg: 'bg-[#10B981]/10',
    },
  ],
};
