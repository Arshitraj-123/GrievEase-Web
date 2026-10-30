import { z } from 'zod';

export const PrivacyRequestTypeSchema = z.enum([
  'ACCESS',
  'CORRECTION',
  'DELETION',
  'WITHDRAW_CONSENT',
]);
export type PrivacyRequestType = z.infer<typeof PrivacyRequestTypeSchema>;

export const CreatePrivacyRequestSchema = z.object({
  type: PrivacyRequestTypeSchema,
  requesterName: z.string().min(2).max(100),
  requesterEmail: z.string().email().optional(),
  requesterPhone: z.string().min(10).max(15).optional(),
  details: z.string().min(10).max(1000),
});
export type CreatePrivacyRequestDto = z.infer<typeof CreatePrivacyRequestSchema>;

export const VerifyPrivacyRequestSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  outcomeNote: z.string().min(5),
});
export type VerifyPrivacyRequestDto = z.infer<typeof VerifyPrivacyRequestSchema>;

export const AcceptConsentSchema = z.object({
  version: z.string().min(1).max(20),
});
export type AcceptConsentDto = z.infer<typeof AcceptConsentSchema>;

