import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PollsService } from './polls.service';
import {
  CreatePollSchema,
  VotePollSchema,
} from '@grievease/contracts';

@Controller()
@UseGuards(JwtGuard)
export class PollsController {
  constructor(private pollsService: PollsService) {}

  // ---------------------------------------------------------------------------
  // RESIDENT COMMUNITY POLL ENDPOINTS
  // ---------------------------------------------------------------------------

  @Get('community/polls')
  async getCommunityPolls(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('flatId') flatId: string | null
  ) {
    return this.pollsService.getCommunityPolls(societyId, userId, flatId);
  }

  @Get('community/polls/:id')
  async getPollDetail(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('flatId') flatId: string | null,
    @CurrentUser('role') role: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.pollsService.getPollDetail(societyId, userId, flatId, id, role);
  }

  @Post('community/polls/:id/vote')
  async castVote(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @CurrentUser('flatId') flatId: string | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any
  ) {
    const parsed = VotePollSchema.parse(body);
    return this.pollsService.castVote(societyId, userId, role, flatId, id, parsed);
  }

  // ---------------------------------------------------------------------------
  // ADMIN POLL MANAGEMENT ENDPOINTS
  // ---------------------------------------------------------------------------

  @Get('admin/polls')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE')
  async getAdminPolls(@CurrentUser('societyId') societyId: string) {
    return this.pollsService.getAdminPolls(societyId);
  }

  @Post('admin/polls')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE')
  async createPoll(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Body() body: any
  ) {
    const parsed = CreatePollSchema.parse(body);
    return this.pollsService.createPoll(societyId, userId, parsed);
  }

  @Post('admin/polls/:id/extend')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE')
  async extendPoll(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { closesAt: string; reason: string }
  ) {
    const success = await this.pollsService.extendPollClosing(
      societyId,
      userId,
      id,
      body.closesAt,
      body.reason
    );
    return { success };
  }
}
