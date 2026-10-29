import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GrievancesService } from './grievances.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StepUpGuard } from '../../common/guards/step-up.guard';
import { RequireStepUp } from '../../common/decorators/require-step-up.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateGrievanceDto,
  UpdateGrievanceStatusDto,
  AddGrievanceNoteDto,
  RequestInfoDto,
  ManualEscalateDto,
  GrievanceAppealDto,
  GrievanceRateDto,
  GrievanceFlagDto,
  GrievanceAssignDto,
  RevealIdentityDto,
  CreateOnBehalfDto,
} from '@grievease/contracts';

// ==========================================
// 1. RESIDENT GRIEVANCES CONTROLLER
// ==========================================
@Controller('grievances')
export class GrievancesController {
  constructor(private grievancesService: GrievancesService) {}

  // Public Tracking Endpoint (No auth needed)
  @Get('public/track')
  async trackPublic(
    @Query('publicId') publicId: string,
    @Query('code') code: string
  ) {
    return this.grievancesService.trackPublic(publicId, code);
  }

  // Resident Drafts
  @Get('drafts')
  @UseGuards(JwtGuard)
  async getDraft(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string
  ) {
    return { draft: await this.grievancesService.getDraft(societyId, userId) };
  }

  @Put('drafts')
  @UseGuards(JwtGuard)
  async saveDraft(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Body() body: any
  ) {
    return this.grievancesService.saveDraft(societyId, userId, body);
  }

  @Delete('drafts')
  @UseGuards(JwtGuard)
  async cancelDraft(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string
  ) {
    return this.grievancesService.cancelDraft(societyId, userId);
  }

  // Resident Grievance Submission
  @Post()
  @UseGuards(JwtGuard)
  async createGrievance(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateGrievanceDto
  ) {
    return this.grievancesService.createGrievance(societyId, user, dto);
  }

  // Resident List
  @Get()
  @UseGuards(JwtGuard)
  async listGrievances(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Query('status') status?: string
  ) {
    return this.grievancesService.listGrievancesForResident(societyId, user, status);
  }

  // Resident Detail
  @Get(':id')
  @UseGuards(JwtGuard)
  async getGrievance(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.grievancesService.getGrievanceById(societyId, id, user);
  }

  // Resident Add Note
  @Post(':id/notes')
  @UseGuards(JwtGuard)
  async addNote(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AddGrievanceNoteDto
  ) {
    return this.grievancesService.addNote(societyId, id, user, { ...dto, isInternal: false });
  }

  // Resident Remind Resolver
  @Post(':id/remind')
  @UseGuards(JwtGuard)
  async remindResolver(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.grievancesService.remindResolver(societyId, id, user);
  }

  // Resident Confirm Resolved
  @Post(':id/mark-resolved')
  @UseGuards(JwtGuard)
  async markResolved(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.grievancesService.updateStatus(societyId, id, user, { status: 'CLOSED' });
  }

  // Resident Appeal
  @Post(':id/appeal')
  @UseGuards(JwtGuard)
  async appeal(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: GrievanceAppealDto
  ) {
    return this.grievancesService.appealGrievance(societyId, id, user, dto);
  }

  // Resident Reopen
  @Post(':id/reopen')
  @UseGuards(JwtGuard)
  async reopen(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.grievancesService.reopenGrievance(societyId, id, user);
  }

  // Resident Rate
  @Post(':id/rate')
  @UseGuards(JwtGuard)
  async rate(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: GrievanceRateDto
  ) {
    return this.grievancesService.rateGrievance(societyId, id, user, dto);
  }
}

// ==========================================
// 2. ADMIN GRIEVANCES CONTROLLER
// ==========================================
@Controller('admin/grievances')
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY')
export class AdminGrievancesController {
  constructor(private grievancesService: GrievancesService) {}

  @Get('inbox')
  async getInbox(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('level') level?: string,
    @Query('urgent') urgent?: string,
    @Query('assignedToMe') assignedToMe?: string
  ) {
    return this.grievancesService.listGrievancesForAdmin(societyId, user, {
      status,
      level: level ? Number(level) : undefined,
      urgent: urgent === 'true',
      assignedToMe: assignedToMe === 'true',
    });
  }

  @Get(':id')
  async getAdminGrievance(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.grievancesService.getGrievanceById(societyId, id, user);
  }

  @Post(':id/acknowledge')
  async acknowledge(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.grievancesService.acknowledgeGrievance(societyId, id, user);
  }

  @Post(':id/status')
  async updateStatus(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateGrievanceStatusDto
  ) {
    return this.grievancesService.updateStatus(societyId, id, user, dto);
  }

  @Post(':id/internal-note')
  async addInternalNote(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AddGrievanceNoteDto
  ) {
    return this.grievancesService.addNote(societyId, id, user, { ...dto, isInternal: true });
  }

  @Post(':id/request-info')
  async requestInfo(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: RequestInfoDto
  ) {
    return this.grievancesService.requestInfo(societyId, id, user, dto);
  }

  @Post(':id/escalate')
  async manualEscalate(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ManualEscalateDto
  ) {
    return this.grievancesService.manualEscalate(societyId, id, user, dto);
  }

  @Post(':id/assign')
  async assignGrievance(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: GrievanceAssignDto
  ) {
    return this.grievancesService.assignGrievance(societyId, id, user, dto);
  }

  @Post(':id/flag')
  async flagGrievance(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: GrievanceFlagDto
  ) {
    return this.grievancesService.flagGrievance(societyId, id, user, dto);
  }

  @Post(':id/reveal-identity')
  @Roles('SUPER_ADMIN')
  @UseGuards(StepUpGuard)
  @RequireStepUp()
  async revealIdentity(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: RevealIdentityDto
  ) {
    return this.grievancesService.revealIdentity(societyId, id, user, dto);
  }

  @Post('on-behalf')
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async createOnBehalf(
    @CurrentUser('societyId') societyId: string,
    @Body() dto: CreateOnBehalfDto
  ) {
    const residentProxy = {
      userId: dto.residentUserId,
      role: 'RESIDENT',
      flatId: null,
    };
    return this.grievancesService.createGrievance(societyId, residentProxy, {
      title: dto.title,
      description: dto.description,
      categoryId: dto.categoryId,
      priority: dto.priority,
      areaText: dto.areaText,
      areaTagId: dto.areaTagId,
      evidenceKeys: dto.evidenceKeys,
      isAnonymous: false,
      confirmDuplicate: true,
    });
  }
}
