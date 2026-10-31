import { SceneContext, runSceneP01, runSceneP02, runSceneP03, runSceneP04 } from './public.scenes';
import {
  runSceneA01,
  runSceneA02,
  runSceneA03,
  runSceneA04,
  runSceneA05,
  runSceneA06,
  runSceneA07,
  runSceneA08,
  runSceneA09,
  runSceneA10,
  runSceneA11,
} from './admin.scenes';
import {
  runSceneR01,
  runSceneR02,
  runSceneR03,
  runSceneR04,
  runSceneR05,
  runSceneR06,
  runSceneR07,
  runSceneR08,
  runSceneR09,
  runSceneR10,
  runSceneR11,
  runSceneR12,
} from './resident.scenes';
import { runSceneG01, runSceneG02, runSceneV01 } from './guard-vendor.scenes';

export interface SceneDefinition {
  id: string;
  category: 'PUBLIC' | 'ADMIN' | 'RESIDENT' | 'GUARD' | 'VENDOR';
  role: string;
  title: string;
  viewport: { width: number; height: number; isMobile?: boolean };
  run: (ctx: SceneContext) => Promise<void>;
}

export const ALL_SCENES: SceneDefinition[] = [
  // Public
  { id: 'P01', category: 'PUBLIC', role: 'Public Visitor', title: 'Public Landing Page Tour', viewport: { width: 1440, height: 900 }, run: runSceneP01 },
  { id: 'P02', category: 'PUBLIC', role: 'Public Visitor', title: 'Public Complaint Tracking', viewport: { width: 1440, height: 900 }, run: runSceneP02 },
  { id: 'P03', category: 'PUBLIC', role: 'Public Visitor', title: 'Transparency Dashboard', viewport: { width: 1440, height: 900 }, run: runSceneP03 },
  { id: 'P04', category: 'PUBLIC', role: 'Public Visitor', title: 'Public Contact & Demo Request', viewport: { width: 1440, height: 900 }, run: runSceneP04 },

  // Admin
  { id: 'A01', category: 'ADMIN', role: 'Super Admin', title: 'First-Run Super Admin Setup', viewport: { width: 1440, height: 900 }, run: runSceneA01 },
  { id: 'A02', category: 'ADMIN', role: 'Super Admin & Secretary', title: 'User Management & Bulk Onboarding', viewport: { width: 1440, height: 900 }, run: runSceneA02 },
  { id: 'A03', category: 'ADMIN', role: 'Super Admin & Chairman', title: 'Society Configuration & Governance', viewport: { width: 1440, height: 900 }, run: runSceneA03 },
  { id: 'A04', category: 'ADMIN', role: 'Secretary', title: 'Secretary Grievance Handling', viewport: { width: 1440, height: 900 }, run: runSceneA04 },
  { id: 'A05', category: 'ADMIN', role: 'System & Chairman', title: '4-Level Auto-Escalation & Audit Trail', viewport: { width: 1440, height: 900 }, run: runSceneA05 },
  { id: 'A06', category: 'ADMIN', role: 'Super Admin & Governing Body', title: 'Anonymous Grievance Handling & Reveal', viewport: { width: 1440, height: 900 }, run: runSceneA06 },
  { id: 'A07', category: 'ADMIN', role: 'Chairman & Committee', title: 'Analytics & Resolver Performance', viewport: { width: 1440, height: 900 }, run: runSceneA07 },
  { id: 'A08', category: 'ADMIN', role: 'Secretary', title: 'Community Notices, Polls & Staff', viewport: { width: 1440, height: 900 }, run: runSceneA08 },
  { id: 'A09', category: 'ADMIN', role: 'Security Supervisor', title: 'Security, Guard Desk & SOS Admin', viewport: { width: 1440, height: 900 }, run: runSceneA09 },
  { id: 'A10', category: 'ADMIN', role: 'Secretary & Chairman', title: 'Amenities & Cash Billing Ledger', viewport: { width: 1440, height: 900 }, run: runSceneA10 },
  { id: 'A11', category: 'ADMIN', role: 'Super Admin', title: 'Vendors, CMS & Super Admin Transfer', viewport: { width: 1440, height: 900 }, run: runSceneA11 },

  // Resident (Mobile emulation 390x844)
  { id: 'R01', category: 'RESIDENT', role: 'Resident', title: 'Resident Account Activation', viewport: { width: 390, height: 844, isMobile: true }, run: runSceneR01 },
  { id: 'R02', category: 'RESIDENT', role: 'Resident', title: 'Resident Login & Account Security', viewport: { width: 390, height: 844, isMobile: true }, run: runSceneR02 },
  { id: 'R03', category: 'RESIDENT', role: 'Resident', title: 'Raise Named Grievance & PWA', viewport: { width: 390, height: 844, isMobile: true }, run: runSceneR03 },
  { id: 'R04', category: 'RESIDENT', role: 'Resident', title: 'Raise Anonymous Grievance', viewport: { width: 390, height: 844, isMobile: true }, run: runSceneR04 },
  { id: 'R05', category: 'RESIDENT', role: 'Resident', title: 'Track Grievance & Rate Resolution', viewport: { width: 390, height: 844, isMobile: true }, run: runSceneR05 },
  { id: 'R06', category: 'RESIDENT', role: 'Resident', title: 'Notices & Community Polls', viewport: { width: 390, height: 844, isMobile: true }, run: runSceneR06 },
  { id: 'R07', category: 'RESIDENT', role: 'Resident', title: 'Resident Directory & Privacy', viewport: { width: 390, height: 844, isMobile: true }, run: runSceneR07 },
  { id: 'R08', category: 'RESIDENT', role: 'Resident', title: 'Domestic Staff & Pass QR', viewport: { width: 390, height: 844, isMobile: true }, run: runSceneR08 },
  { id: 'R09', category: 'RESIDENT', role: 'Resident', title: 'Visitor Passes & Walk-in Approval', viewport: { width: 390, height: 844, isMobile: true }, run: runSceneR09 },
  { id: 'R10', category: 'RESIDENT', role: 'Resident', title: 'Emergency SOS Trigger & Alerts', viewport: { width: 390, height: 844, isMobile: true }, run: runSceneR10 },
  { id: 'R11', category: 'RESIDENT', role: 'Resident', title: 'Amenities & Cash Dues Receipts', viewport: { width: 390, height: 844, isMobile: true }, run: runSceneR11 },
  { id: 'R12', category: 'RESIDENT', role: 'Resident', title: 'Office Messages & Privacy Data Export', viewport: { width: 390, height: 844, isMobile: true }, run: runSceneR12 },

  // Guard & Vendor (Tablet 1024x768 & Desktop)
  { id: 'G01', category: 'GUARD', role: 'Gate Security Guard', title: 'Guard Gatehouse Console', viewport: { width: 1024, height: 768 }, run: runSceneG01 },
  { id: 'G02', category: 'GUARD', role: 'Security Guard', title: 'Amenity Check-In Verification', viewport: { width: 1024, height: 768 }, run: runSceneG02 },
  { id: 'V01', category: 'VENDOR', role: 'Vendor Contractor', title: 'Vendor Task Execution & Proof', viewport: { width: 1440, height: 900 }, run: runSceneV01 },
];
