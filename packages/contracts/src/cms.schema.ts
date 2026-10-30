import { z } from 'zod';

export const FaqItemSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.string().default('GENERAL'),
  question_en: z.string().min(5),
  question_hi: z.string().min(5),
  answer_en: z.string().min(5),
  answer_hi: z.string().min(5),
  sort: z.number().int().default(0),
  published: z.boolean().default(true),
});
export type FaqItemDto = z.infer<typeof FaqItemSchema>;

export const TestimonialSubmitSchema = z.object({
  displayName: z.string().min(2).max(100),
  roleOrFlatLabel: z.string().min(2).max(100),
  quote: z.string().min(10).max(280),
  stars: z.number().int().min(1).max(5).default(5),
  photoKey: z.string().optional(),
  consentToPublish: z.literal(true), // mandatory consent
});
export type TestimonialSubmitDto = z.infer<typeof TestimonialSubmitSchema>;

export const TestimonialModerateSchema = z.object({
  status: z.enum(['APPROVED', 'HIDDEN']),
  moderationReason: z.string().optional(),
});
export type TestimonialModerateDto = z.infer<typeof TestimonialModerateSchema>;

export const ContactRequestSchema = z.object({
  type: z.enum(['GENERAL', 'DEMO', 'SOCIETY_ENQUIRY']).default('GENERAL'),
  name: z.string().min(2).max(100),
  society: z.string().max(150).optional(),
  role: z.string().max(50).optional(),
  phone: z.string().min(10).max(15).optional(),
  email: z.string().email().optional(),
  message: z.string().min(10).max(2000),
  honeypot: z.string().max(0).optional(), // must be empty for bot prevention
  powNonce: z.string().min(1),
  powSolution: z.string().min(1),
});
export type ContactRequestDto = z.infer<typeof ContactRequestSchema>;

export const CreateConversationSchema = z.object({
  subject: z.string().min(3).max(200),
  initialMessage: z.string().min(2).max(2000),
  attachmentKeys: z.array(z.string()).max(3).optional(),
});
export type CreateConversationDto = z.infer<typeof CreateConversationSchema>;

export const SendMessageSchema = z.object({
  body: z.string().min(1).max(2000),
  attachmentKeys: z.array(z.string()).max(3).optional(),
});
export type SendMessageDto = z.infer<typeof SendMessageSchema>;

export const CreateSupportTicketSchema = z.object({
  category: z.enum(['BUG', 'SUGGESTION', 'ACCOUNT', 'OTHER']),
  description: z.string().min(10).max(2000),
  screenshotKeys: z.array(z.string()).max(3).optional(),
  deviceInfo: z.string().optional(),
});
export type CreateSupportTicketDto = z.infer<typeof CreateSupportTicketSchema>;

