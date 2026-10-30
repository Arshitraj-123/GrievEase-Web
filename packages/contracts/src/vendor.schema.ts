import { z } from 'zod';

export const VendorCategorySchema = z.enum([
  'PLUMBING',
  'ELECTRICAL',
  'LIFT',
  'PEST_CONTROL',
  'PAINTING',
  'HOUSEKEEPING',
  'CARPENTRY',
  'OTHER',
]);
export type VendorCategory = z.infer<typeof VendorCategorySchema>;

export const VendorStatusSchema = z.enum(['ACTIVE', 'SUSPENDED']);
export type VendorStatus = z.infer<typeof VendorStatusSchema>;

export const VendorTaskStatusSchema = z.enum([
  'ASSIGNED',
  'ACCEPTED',
  'DECLINED',
  'VISIT_SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'RESIDENT_CONFIRMED',
  'DISPUTED',
  'CANCELLED',
]);
export type VendorTaskStatus = z.infer<typeof VendorTaskStatusSchema>;

export const CreateVendorSchema = z.object({
  companyName: z.string().min(2).max(150),
  contactPerson: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  category: VendorCategorySchema,
  serviceProviderId: z.string().uuid().optional(),
  username: z.string().min(3).max(50).optional(), // to create login account
  notes: z.string().optional(),
});
export type CreateVendorDto = z.infer<typeof CreateVendorSchema>;

export const CreateVendorTaskSchema = z.object({
  vendorId: z.string().uuid(),
  grievanceId: z.string().uuid().optional(),
  flatId: z.string().uuid().optional(),
  areaText: z.string().max(150).optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(5),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).default('MEDIUM'),
  expectedVisitFrom: z.string().datetime().optional(),
  expectedVisitTo: z.string().datetime().optional(),
  shareContactWithVendor: z.boolean().default(false),
});
export type CreateVendorTaskDto = z.infer<typeof CreateVendorTaskSchema>;

export const AcceptDeclineTaskSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
  declineReason: z.string().min(5).optional(),
});
export type AcceptDeclineTaskDto = z.infer<typeof AcceptDeclineTaskSchema>;

export const ScheduleVisitSchema = z.object({
  expectedVisitFrom: z.string().datetime(),
  expectedVisitTo: z.string().datetime(),
});
export type ScheduleVisitDto = z.infer<typeof ScheduleVisitSchema>;

export const CompleteVendorTaskSchema = z.object({
  completionNote: z.string().min(5),
  afterPhotoKey: z.string().min(1),
  beforePhotoKey: z.string().optional(),
});
export type CompleteVendorTaskDto = z.infer<typeof CompleteVendorTaskSchema>;

export const ResidentConfirmTaskSchema = z.object({
  confirmation: z.enum(['CONFIRMED', 'NOT_FIXED']),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
  reopenReason: z.string().min(5).optional(),
});
export type ResidentConfirmTaskDto = z.infer<typeof ResidentConfirmTaskSchema>;

