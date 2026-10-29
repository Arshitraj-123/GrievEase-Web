import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StepUpGuard } from '../../common/guards/step-up.guard';
import { RequireStepUp } from '../../common/decorators/require-step-up.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CategoryDto,
  AreaTagDto,
  GovernanceAssignmentDto,
  SlaConfigDto,
  ResolverLeaveDto,
  WorkingHoursDayDto,
} from '@grievease/contracts';

@Controller('governance')
@UseGuards(JwtGuard, RolesGuard)
export class GovernanceController {
  constructor(private governanceService: GovernanceService) {}

  // 1. Categories
  @Get('categories')
  async getCategories(
    @CurrentUser('societyId') societyId: string,
    @Query('all') all?: string
  ) {
    return this.governanceService.getCategories(societyId, all !== 'true');
  }

  @Post('categories')
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async saveCategory(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') actorId: string,
    @CurrentUser('role') actorRole: string,
    @Body() dto: CategoryDto
  ) {
    return this.governanceService.saveCategory(societyId, dto, actorId, actorRole);
  }

  // 2. Area Tags
  @Get('area-tags')
  async getAreaTags(@CurrentUser('societyId') societyId: string) {
    return this.governanceService.getAreaTags(societyId);
  }

  @Post('area-tags')
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async saveAreaTag(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') actorId: string,
    @CurrentUser('role') actorRole: string,
    @Body() dto: AreaTagDto
  ) {
    return this.governanceService.saveAreaTag(societyId, dto, actorId, actorRole);
  }

  // 3. Governance Chain & Vacancies
  @Get('chain')
  @Roles('SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY')
  async getChain(@CurrentUser('societyId') societyId: string) {
    return this.governanceService.getGovernanceChain(societyId);
  }

  @Post('chain/assign')
  @Roles('SUPER_ADMIN')
  @UseGuards(StepUpGuard)
  @RequireStepUp()
  async assignGovernance(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') actorId: string,
    @CurrentUser('role') actorRole: string,
    @Body() dto: GovernanceAssignmentDto
  ) {
    return this.governanceService.setGovernanceAssignment(societyId, dto, actorId, actorRole);
  }

  // 4. SLA Config
  @Get('sla')
  @Roles('SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY')
  async getSla(@CurrentUser('societyId') societyId: string) {
    return this.governanceService.getSlaConfig(societyId);
  }

  @Post('sla')
  @Roles('SUPER_ADMIN')
  @UseGuards(StepUpGuard)
  @RequireStepUp()
  async updateSla(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') actorId: string,
    @CurrentUser('role') actorRole: string,
    @Body() dtos: SlaConfigDto[]
  ) {
    return this.governanceService.updateSlaConfig(societyId, dtos, actorId, actorRole);
  }

  // 5. Resolver Leaves
  @Get('leave')
  @Roles('SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY')
  async getLeaves(@CurrentUser('societyId') societyId: string) {
    return this.governanceService.getResolverLeaves(societyId);
  }

  @Post('leave')
  @Roles('SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN')
  async createLeave(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') actorId: string,
    @CurrentUser('role') actorRole: string,
    @Body() dto: ResolverLeaveDto
  ) {
    return this.governanceService.createResolverLeave(societyId, dto, actorId, actorRole);
  }

  // 6. Working Hours
  @Get('working-hours')
  @Roles('SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY')
  async getWorkingHours(@CurrentUser('societyId') societyId: string) {
    return this.governanceService.getWorkingHours(societyId);
  }

  @Post('working-hours')
  @Roles('SUPER_ADMIN')
  @UseGuards(StepUpGuard)
  @RequireStepUp()
  async updateWorkingHours(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') actorId: string,
    @CurrentUser('role') actorRole: string,
    @Body() days: WorkingHoursDayDto[]
  ) {
    return this.governanceService.updateWorkingHours(societyId, days, actorId, actorRole);
  }

  // 7. Society Settings
  @Get('settings')
  @Roles('SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY')
  async getSettings(@CurrentUser('societyId') societyId: string) {
    return this.governanceService.getSocietySettings(societyId);
  }

  @Post('settings')
  @Roles('SUPER_ADMIN')
  @UseGuards(StepUpGuard)
  @RequireStepUp()
  async updateSettings(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') actorId: string,
    @CurrentUser('role') actorRole: string,
    @Body() settings: Record<string, any>
  ) {
    return this.governanceService.updateSocietySettings(societyId, settings, actorId, actorRole);
  }
}
