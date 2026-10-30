export const escalationContent = {
  tag: 'HOW ESCALATION WORKS',
  headlineSoft: 'No complaint gets ignored.',
  headlineAbsolute: 'No complaint ever gets ignored. Ever.',
  subtitle:
    'Our 4-level automated governance chain ensures every complaint reaches the right authority — automatically when SLA targets are breached.',
  howItWorksParagraph:
    'When an issue is filed, a precise cryptographic countdown begins immediately. Level 1 routes the ticket to the Secretary for initial review, verification, and vendor dispatch within 48 hours. If the SLA elapses without resolution or verified extension, the server-side cron triggers automated escalation to Level 2 (Management Committee), notifying all committee members simultaneously. Continued inaction advances the ticket to Level 3 (Chairman executive review) at 96 hours, and finally to Level 4 (Governing Body) at 120 hours. Every escalation transition is stamped onto the immutable SHA-256 hash-chained audit log with zero manual intervention required.',
  levels: [
    {
      level: 'L1',
      title: 'Secretary',
      sla: 'SLA: 48 hours',
      slaHours: 48,
      description:
        'First review and assignment. Acknowledges the complaint and dispatches a technician or vendor.',
      tag: 'First Review & Dispatch',
      badgeColor: 'text-[#00B894] bg-[#00B894]/15 border-[#00B894]/30',
      accentColor: '#00B894',
    },
    {
      level: 'L2',
      title: 'Committee',
      sla: 'SLA: 72 hours',
      slaHours: 72,
      description:
        'Takes over automatically if L1 misses the SLA. Reassigns, directs the Secretary and drives resolution.',
      tag: 'Automatic Escalation',
      badgeColor: 'text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/30',
      accentColor: '#F59E0B',
    },
    {
      level: 'L3',
      title: 'Chairman',
      sla: 'SLA: 96 hours',
      slaHours: 96,
      description: 'Reviews escalated matters and can override decisions.',
      tag: 'Executive Authority',
      badgeColor: 'text-[#EF4444] bg-[#EF4444]/15 border-[#EF4444]/30',
      accentColor: '#EF4444',
    },
    {
      level: 'L4',
      title: 'Governing Body',
      sla: 'SLA: 120 hours',
      slaHours: 120,
      description: 'Final authority. Gives the final ruling on matters that reach this level.',
      tag: 'Final Authority',
      badgeColor: 'text-[#8B5CF6] bg-[#8B5CF6]/15 border-[#8B5CF6]/30',
      accentColor: '#8B5CF6',
    },
  ],
  pills: [
    {
      icon: '⚡',
      label: 'Auto-escalation — no manual follow-up needed',
      href: '#realtime',
    },
    {
      icon: '🔒',
      label: 'Immutable audit trail — every action logged',
      href: '#audit-trail',
    },
    {
      icon: '🛡️',
      label: 'Anonymous complaints — complete resident protection',
      href: '#anonymous',
    },
  ],
};
