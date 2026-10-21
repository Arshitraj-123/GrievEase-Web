export interface RoleTabItem {
  id: string;
  label: string;
  badge: string;
  title: string;
  description: string;
  bullets: {
    title: string;
    description: string;
  }[];
  ctaJoin: {
    label: string;
    href: string;
  };
  ctaDemo: {
    label: string;
    href: string;
  };
}

export const roleTabsContent: {
  tag: string;
  heading: string;
  subtitle: string;
  roles: RoleTabItem[];
} = {
  tag: 'DESIGNED FOR EVERY STAKEHOLDER',
  heading: 'Tailored workflows for everyone in the society',
  subtitle:
    'Whether you live in the society, manage the accounts, guard the gate, or fix the plumbing — GrievEase gives you dedicated tools.',
  roles: [
    {
      id: 'residents',
      label: 'Residents',
      badge: 'Homeowners & Tenants',
      title: 'Hassle-free living with guaranteed accountability',
      description:
        'Report issues in 30 seconds, stay informed without messy WhatsApp banter, and know your complaints have guaranteed deadlines.',
      bullets: [
        {
          title: 'Raise complaints with photo proof',
          description: 'Submit grievances directly from your phone with photos, voice notes, and category tags.',
        },
        {
          title: 'Real-time SLA countdown tracking',
          description: 'Watch your complaint progress across the 4-level escalation chain with transparent time limits.',
        },
        {
          title: 'File sensitive issues anonymously',
          description: 'Report noise violations or community concerns without awkward neighbor confrontations.',
        },
        {
          title: 'Pre-approve guests & pay maintenance bills',
          description: 'One-tap visitor gate passes and instant digital receipts for all society maintenance payments.',
        },
      ],
      ctaJoin: { label: 'Activate your account', href: '/activate' },
      ctaDemo: { label: 'Request a demo', href: '/contact' },
    },
    {
      id: 'committee',
      label: 'Committee',
      badge: 'Secretary & Managing Committee',
      title: 'Effortless governance, zero lost records',
      description:
        'Eliminate repetitive phone calls, delegate issues to vendors with automatic reminders, and conduct peaceful, fact-based AGMs.',
      bullets: [
        {
          title: 'Centralized Resolver Inbox',
          description: 'Prioritized ticket queue sorted by SLA deadline urgency so nothing ever slips through.',
        },
        {
          title: 'One-click vendor assignment',
          description: 'Dispatch work orders to technicians and track completion status with photo verification.',
        },
        {
          title: 'Automated escalation safety net',
          description: 'System automatically prompts higher committee tiers if first responses breach agreed turnaround.',
        },
        {
          title: 'Public transparency & audit exports',
          description: 'Generate immutable audit reports and compliance ledgers for audits and annual general meetings.',
        },
      ],
      ctaJoin: { label: 'Activate your account', href: '/activate' },
      ctaDemo: { label: 'Request a demo', href: '/contact' },
    },
    {
      id: 'guards',
      label: 'Security Guards',
      badge: 'Main Gate & Patrol Staff',
      title: 'Fast, fool-proof security at every gate',
      description:
        'A super-fast tablet and mobile interface in Hindi, Marathi, and English that makes gate logging instantaneous.',
      bullets: [
        {
          title: 'Instant QR guest verification',
          description: 'Scan digital passes sent by residents in under two seconds with zero queue buildup at the gate.',
        },
        {
          title: 'Domestic staff attendance scanner',
          description: 'Biometric or passcode check-in for maids, drivers, and daily cleaners with live notification to flats.',
        },
        {
          title: 'Digital delivery & cab entry logs',
          description: 'Record delivery personnel vehicle numbers and notify residents without making intercom phone calls.',
        },
        {
          title: 'Immediate emergency broadcast receiver',
          description: 'Loud visual and acoustic alarms on the guard console whenever a resident triggers an SOS.',
        },
      ],
      ctaJoin: { label: 'Activate your account', href: '/activate' },
      ctaDemo: { label: 'Request a demo', href: '/contact' },
    },
    {
      id: 'vendors',
      label: 'Vendors',
      badge: 'Plumbers, Electricians & Contractors',
      title: 'Clear job briefs and verifiable payment records',
      description:
        'Dedicated service provider access with exact location details, direct resident chat, and digital proof-of-work signoff.',
      bullets: [
        {
          title: 'Direct job dispatch with photos',
          description: 'Inspect clear photos and descriptions of faulty fixtures before heading to the resident apartment.',
        },
        {
          title: 'Digital proof-of-work completion',
          description: 'Upload after-repair photos and collect resident digital signatures to close the work order.',
        },
        {
          title: 'Vendor performance scorecard',
          description: 'Build your reputation across societies with tracked SLA resolution times and high resident ratings.',
        },
        {
          title: 'Faster invoice processing',
          description: 'Completed job tickets automatically link to society accounting for prompt payment approvals.',
        },
      ],
      ctaJoin: { label: 'Activate your account', href: '/activate' },
      ctaDemo: { label: 'Request a demo', href: '/contact' },
    },
  ],
};
