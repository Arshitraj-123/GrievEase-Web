import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  Clock,
  Shield,
  UserCheck,
  Bell,
  Briefcase,
  Calendar,
  CreditCard,
  AlertTriangle,
  Lock,
  ArrowRight,
  BookOpen,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Features & Modules — Complete Society Governance Ecosystem',
  description:
    'Explore GrievEase modules: Grievances with 4-level SLAs, Anonymous Reporting, Immutable Audit Trail, Visitor Gate Pass, Emergency SOS, and Guard Management.',
  alternates: {
    canonical: '/features',
  },
};

export default function FeaturesPage() {
  const modules = [
    {
      id: 'grievances',
      title: 'Smart Grievance Management',
      subtitle: 'Structured filing with SLA countdown timers',
      icon: FileText,
      color: '#00B894',
      description:
        'Every grievance filed in GrievEase is automatically tagged by category, assigned an SLA deadline, and routed to the designated technician or committee lead. Photo proof, location geotagging, and audio notes ensure zero ambiguity.',
      bullets: [
        'Photo, video, and audio proof attachments',
        'Automatic SLA countdown timers (48h/72h/96h/120h)',
        'Direct in-app resident-to-technician chat without exposing private phone numbers',
        'Digital signature and photo verification before closing complaints',
      ],
    },
    {
      id: 'anonymous',
      title: 'Anonymous Complaints',
      subtitle: 'Safe, confidential community reporting',
      icon: Lock,
      color: '#00A383',
      description:
        'Raise sensitive issues without exposing your identity. Resolvers never see who you are. Only a Super Admin can reveal an identity, with a recorded reason.',
      bullets: [
        'Cryptographic separation of ticket from resident profile',
        'Resolvers and committee members cannot view apartment numbers or names',
        'Prevents retaliatory neighbor disputes and social friction',
        'Tamper-evident audit log for any administrative unmasking requests',
      ],
    },
    {
      id: 'audit-trail',
      title: 'Immutable Audit Trail',
      subtitle: 'Tamper-evident digital record for peace of mind',
      icon: Shield,
      color: '#3B82F6',
      description:
        'Every action is recorded with who, when and why, in a tamper-evident history that cannot be edited or deleted.',
      bullets: [
        'SHA-256 state hashing for every ticket transition',
        'Append-only database ledger that cannot be altered even by database admins',
        'Exportable compliance audit reports for AGMs and legal authorities',
        'Complete timeline visibility for both resident and committee',
      ],
    },
    {
      id: 'realtime',
      title: 'Real-Time Updates',
      subtitle: 'Instant dispatch across push, SMS & in-app',
      icon: Activity,
      color: '#8B5CF6',
      description:
        'Status changes, escalations, gate approvals and SOS alerts reach you instantly.',
      bullets: [
        'Sub-250ms notification pipeline for urgent alarms',
        'Live tracking visualizer showing exact stage in escalation chain',
        'Automated SMS alerts for gate entries and emergency broadcasts',
        'Email summaries and weekly society digests for busy residents',
      ],
    },
    {
      id: 'performance',
      title: 'Resolver Performance & Metrics',
      subtitle: 'Objective metrics for committee members and technicians',
      icon: Clock,
      color: '#F59E0B',
      description:
        'Resolution time, SLA hit rate and ratings per resolver, so accountability is measurable.',
      bullets: [
        'Average resolution turnaround hours tracked per category',
        'SLA adherence percentage calculated per technician and contractor',
        'Resident post-resolution star ratings and qualitative reviews',
        'Identifies recurring maintenance bottlenecks and vendor inefficiencies',
      ],
    },
    {
      id: 'visitors',
      title: 'Visitor & Delivery Management',
      subtitle: 'Smart digital gate control for residents and guards',
      icon: UserCheck,
      color: '#00B894',
      description:
        'Pre-approve guests, track deliveries, manage cab entries. Complete digital entry log for all visitors at society security gates.',
      bullets: [
        'One-time OTP / QR entry passes generated in 5 seconds',
        'Pre-approved frequent visitors (plumbers, couriers, cabs)',
        'Live photo capture of unknown delivery personnel at the gate',
        'Instant audio-visual gate chime directly on resident phone',
      ],
    },
    {
      id: 'noticeboard',
      title: 'Digital Society Noticeboard',
      subtitle: 'Zero lost circulars, 100% verified broadcast',
      icon: Bell,
      color: '#3B82F6',
      description:
        'Announcements, event notices, meeting minutes, and emergency alerts — broadcasted instantly to every resident’s phone.',
      bullets: [
        'Categorized broadcasts (Water cutoff, Maintenance, AGM notices, Festivals)',
        'Read receipts so committee knows who received critical circulars',
        'Downloadable PDF attachments for official society bylaws and accounts',
        'High-priority push banner for immediate building safety notices',
      ],
    },
    {
      id: 'staff',
      title: 'Domestic Staff Management',
      subtitle: 'Track check-ins for maids, cooks, and drivers',
      icon: Briefcase,
      color: '#8B5CF6',
      description:
        'Track daily check-in attendance of maids, drivers, cooks, and society maintenance staff with digital verified ID badges.',
      bullets: [
        'Digital staff profile with police verification badge status',
        'Automatic check-in notification when your maid or driver enters the gate',
        'Shared staff ratings and feedback among society residents',
        'Monthly attendance logs for transparent salary calculations',
      ],
    },
    {
      id: 'amenities',
      title: 'Amenity Booking',
      subtitle: 'Clubhouse, pool, and sports court reservation',
      icon: Calendar,
      color: '#F59E0B',
      description:
        'Reserve clubhouse, party hall, badminton courts, and swimming pool slots with a live calendar and slot reservation system.',
      bullets: [
        'Real-time slot availability calendar',
        'Configurable booking limits to prevent monopoly of amenities',
        'Integrated refundable security deposit collection',
        'Auto-cancellation and waitlist management',
      ],
    },
    {
      id: 'bills',
      title: 'Maintenance Billing & UPI Payments',
      subtitle: 'Instant tax-compliant receipts, zero paper accounting',
      icon: CreditCard,
      color: '#10B981',
      description:
        'Pay society maintenance fees, water charges, and utility bills online via UPI/cards with instant tax-compliant digital receipts.',
      bullets: [
        'UPI, NetBanking, Debit/Credit card payment gateway integration',
        'Instant digital GST invoices and automated receipt downloads',
        'Automated reminder notifications before payment deadlines',
        'Exportable bank reconciliation for society chartered accountants',
      ],
    },
    {
      id: 'sos',
      title: 'Emergency SOS Broadcast',
      subtitle: 'One-tap panic alert for medical, fire, or security threats',
      icon: AlertTriangle,
      color: '#EF4444',
      description:
        'One-tap emergency panic alert broadcasted to main gate security guards, medical responders, and society committee chairs.',
      bullets: [
        'Instant acoustic alarm on security guard tablet and phone',
        'Transmits exact flat number, resident phone, and medical contacts',
        'Live tracking of guard response and physical check-in',
        'Pre-configured contacts for nearby ambulances and fire stations',
      ],
    },
    {
      id: 'guards',
      title: 'Security Guard Management',
      subtitle: 'Shift rosters, guard attendance, and incident patrol logs',
      icon: Shield,
      color: '#00A383',
      description:
        'Shift rosters, digital attendance, incident reports, checkpoint QR patrols, and live gate status monitoring.',
      bullets: [
        'Shift rosters and digital guard attendance records',
        'Checkpoint QR patrols to verify guards complete night rounds',
        'Incident logging with photos for parking violations and perimeter breaches',
        'Multi-lingual UI in Hindi, Marathi, and English',
      ],
    },
    {
      id: 'directory',
      title: 'Society Directory',
      subtitle: 'Opt-in resident directory and verified local service contacts',
      icon: BookOpen,
      color: '#6366F1',
      description:
        'Searchable, opt-in resident directory and verified local emergency services, plumbers, electricians, and doctors.',
      bullets: [
        'Privacy-first opt-in: residents control what contact info is visible',
        'Verified list of local emergency plumbers, electricians, and car washers',
        'Search by flat number, block, or vehicle registration number',
        'Direct in-app intercom calling without sharing private phone numbers',
      ],
    },
  ];

  return (
    <div className="py-16 px-6 lg:px-12 bg-white">
      <div className="max-w-[1300px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-[760px] mx-auto mb-16">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            THE PLATFORM
          </span>
          <h1 className="text-[36px] sm:text-[46px] font-extrabold text-[#1A1A2E] leading-tight mb-4">
            Everything a Gated Community Needs
          </h1>
          <p className="text-[16px] text-[#4A5568] leading-relaxed">
            From automated grievance escalations with guaranteed deadlines to seamless visitor gate
            check-ins and financial transparency.
          </p>
        </div>

        {/* Quick Nav Anchors */}
        <div className="mb-14 p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex flex-wrap gap-2 justify-center">
          {modules.map((m) => (
            <a
              key={m.id}
              href={`#${m.id}`}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F0FAF7] text-xs font-semibold text-[#4A5568] hover:text-[#00846A] border border-[#E2E8F0] transition-colors"
            >
              {m.title}
            </a>
          ))}
        </div>

        {/* Modules List with Matching Anchor IDs */}
        <div className="space-y-16">
          {modules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                id={mod.id}
                className="scroll-mt-28 bg-[#F8FAFC] rounded-3xl p-8 sm:p-12 border border-[#E2E8F0] shadow-sm hover:border-[#00B894]/40 transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: mod.color }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#718096]">
                          Module #{idx + 1}
                        </span>
                        <h2 className="text-[24px] sm:text-[28px] font-bold text-[#1A1A2E] leading-tight">
                          {mod.title}
                        </h2>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-[#00846A] mb-3">{mod.subtitle}</p>
                    <p className="text-[15px] text-[#4A5568] leading-relaxed mb-6">
                      {mod.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {mod.bullets.map((b, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-[#1A1A2E]">
                          <CheckCircle2
                            className="w-4 h-4 shrink-0 mt-0.5"
                            style={{ color: mod.color }}
                          />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                      <Link
                        href="/join"
                        className="px-5 py-2.5 rounded-full bg-[#00B894] hover:bg-[#00A383] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <span>Activate for your society</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href="/contact?type=demo"
                        className="text-xs font-bold text-[#4A5568] hover:text-[#00846A]"
                      >
                        Schedule a walkthrough →
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex justify-center">
                    <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm w-full max-w-sm">
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                        <span className="text-xs font-bold text-[#1A1A2E]">GrievEase Core Engine</span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${mod.color}15`,
                            color: mod.color,
                          }}
                        >
                          Verified Active
                        </span>
                      </div>
                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                          <span className="text-gray-500">Security Standard</span>
                          <span className="font-semibold text-gray-800">ISO 27001 / SOC-2</span>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                          <span className="text-gray-500">Audit Compliance</span>
                          <span className="font-semibold text-gray-800">Immutable SHA-256</span>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                          <span className="text-gray-500">Multi-lingual UI</span>
                          <span className="font-semibold text-gray-800">EN / HI / MR</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
