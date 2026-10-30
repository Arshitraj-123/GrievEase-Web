import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  FaqItemSchema,
  TestimonialSubmitSchema,
  TestimonialModerateSchema,
  ContactRequestSchema,
  CreateConversationSchema,
  SendMessageSchema,
  CreateSupportTicketSchema,
} from '@grievease/contracts';

// ─── Public CMS Endpoints (No Auth Required) ─────────────────────────────────

@Controller(['cms', 'api/cms'])
export class PublicCmsController {
  constructor(private cmsService: CmsService) {}

  @Get('faq')
  async getFaqs(@Query('societyId') societyId?: string) {
    return this.cmsService.getFaqs(societyId);
  }

  @Get('testimonials')
  async getTestimonials(@Query('societyId') societyId?: string) {
    return this.cmsService.getApprovedTestimonials(societyId);
  }

  @Post('contact')
  async submitContact(@Body() body: any, @Req() req: any) {
    const validated = ContactRequestSchema.parse(body);
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    return this.cmsService.submitContactRequest(validated, String(ip));
  }

  @Get('site-settings')
  async getSiteSettings(@Query('societyId') societyId?: string) {
    return this.cmsService.getSiteSettings(societyId || null);
  }
}

// ─── Resident CMS & Messaging Endpoints ──────────────────────────────────────

@Controller(['cms/resident', 'api/cms/resident'])
@UseGuards(JwtGuard)
export class ResidentCmsController {
  constructor(private cmsService: CmsService) {}

  @Post('testimonials')
  async submitTestimonial(@CurrentUser() user: any, @Body() body: any) {
    const validated = TestimonialSubmitSchema.parse(body);
    return this.cmsService.submitTestimonial(user.societyId, user.userId, validated);
  }

  @Get('conversations')
  async listConversations(@CurrentUser() user: any) {
    return this.cmsService.listConversations(user.societyId, user.userId, false);
  }

  @Get('conversations/:id')
  async getConversation(@CurrentUser() user: any, @Param('id') id: string) {
    return this.cmsService.getConversation(user.societyId, id, user.userId, false);
  }

  @Post('conversations')
  async createConversation(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateConversationSchema.parse(body);
    return this.cmsService.createConversation(user.societyId, user.userId, user.flatId || null, validated);
  }

  @Post('conversations/:id/messages')
  async sendMessage(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    const validated = SendMessageSchema.parse(body);
    return this.cmsService.sendMessage(id, user.userId, user.role, validated);
  }

  @Post('support-tickets')
  async createSupportTicket(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateSupportTicketSchema.parse(body);
    return this.cmsService.createSupportTicket(user.societyId, user.userId, validated);
  }
}

// ─── Admin CMS & Management Endpoints ────────────────────────────────────────

@Controller(['admin/cms', 'api/admin/cms'])
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE')
export class AdminCmsController {
  constructor(private cmsService: CmsService) {}

  @Get('faq')
  async getAllFaqs(@CurrentUser() user: any) {
    return this.cmsService.getAllFaqsAdmin(user.societyId);
  }

  @Post('faq')
  async saveFaq(@CurrentUser() user: any, @Body() body: any) {
    const validated = FaqItemSchema.parse(body);
    return this.cmsService.saveFaq(validated, user.societyId, user.userId);
  }

  @Get('testimonials')
  async listTestimonials(@CurrentUser() user: any) {
    return this.cmsService.listAdminTestimonials(user.societyId);
  }

  @Post('testimonials/:id/moderate')
  async moderateTestimonial(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const validated = TestimonialModerateSchema.parse(body);
    return this.cmsService.moderateTestimonial(user.societyId, user.userId, id, validated);
  }

  @Get('contact-requests')
  async listContactRequests(@Query('status') status?: string) {
    return this.cmsService.listContactRequests(status);
  }

  @Put('contact-requests/:id')
  async updateContactRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.cmsService.updateContactRequest(id, user.userId, body.status, body.notes);
  }

  @Get('support/conversations')
  async listSupportConversations(@CurrentUser() user: any) {
    return this.cmsService.listConversations(user.societyId, user.userId, true);
  }

  @Get('support/conversations/:id')
  async getSupportConversation(@CurrentUser() user: any, @Param('id') id: string) {
    return this.cmsService.getConversation(user.societyId, id, user.userId, true);
  }

  @Post('support/conversations/:id/messages')
  async replySupportConversation(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    const validated = SendMessageSchema.parse(body);
    return this.cmsService.sendMessage(id, user.userId, user.role, validated);
  }

  @Get('support/tickets')
  async listSupportTickets(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.cmsService.listSupportTickets(user.societyId, status);
  }

  @Post('support/tickets/:id/resolve')
  async resolveSupportTicket(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('resolutionNote') resolutionNote: string,
  ) {
    return this.cmsService.resolveSupportTicket(user.societyId, id, user.userId, resolutionNote);
  }

  @Get('settings')
  async getSettings(@CurrentUser() user: any) {
    return this.cmsService.getSiteSettings(user.societyId);
  }

  @Put('settings/:key')
  async updateSetting(
    @CurrentUser() user: any,
    @Param('key') key: string,
    @Body() body: any,
  ) {
    return this.cmsService.updateSiteSetting(user.societyId, key, body, user.userId);
  }
}

