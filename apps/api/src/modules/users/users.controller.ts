import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StepUpGuard } from '../../common/guards/step-up.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireStepUp } from '../../common/decorators/require-step-up.decorator';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@grievease/contracts';

@Controller('users')
@UseGuards(JwtGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SECRETARY', 'CHAIRMAN', 'COMMITTEE', 'GOVERNING_BODY')
  async listUsers(
    @CurrentUser() user: UserPayload,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('wing') wing?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50'
  ) {
    return this.usersService.listUsers(
      user.societyId,
      { search, role, status, wing },
      Number(page),
      Number(limit)
    );
  }

  @Post()
  @Roles('SUPER_ADMIN')
  async createUser(
    @CurrentUser() user: UserPayload,
    @Body()
    body: {
      fullName: string;
      username?: string;
      mobile: string;
      email?: string | null;
      role: Role;
      wing: string;
      flat: string;
      verifyDetail: string;
      directoryVisible?: boolean;
    }
  ) {
    return this.usersService.createUser(user.societyId, user.userId, body);
  }

  @Get('recovery-requests')
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async listRecoveryRequests(@CurrentUser() user: UserPayload) {
    return this.usersService.listRecoveryRequests(user.societyId);
  }

  @Post('recovery-requests/:ticketId/cancel')
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async cancelRecovery(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: UserPayload
  ) {
    return this.usersService.cancelRecoveryRequest(ticketId, user.userId, user.societyId);
  }

  @Post('recovery-requests/:ticketId/approve')
  @UseGuards(StepUpGuard)
  @RequireStepUp()
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async approveRecovery(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: UserPayload
  ) {
    return this.usersService.approveRecoveryRequest(ticketId, user.userId, user.societyId);
  }

  @Post('super-admin/nominate')
  @Roles('SUPER_ADMIN')
  async nominateSuperAdmin(
    @Body('nomineeUserId') nomineeUserId: string,
    @CurrentUser() user: UserPayload
  ) {
    return this.usersService.nominateSuperAdmin(nomineeUserId, user.userId, user.societyId);
  }

  @Post('super-admin/confirm')
  @UseGuards(StepUpGuard)
  @RequireStepUp()
  @Roles('SUPER_ADMIN')
  async confirmSuperAdmin(
    @Body('transferId') transferId: string,
    @Body('demotedRole') demotedRole: Role,
    @CurrentUser() user: UserPayload
  ) {
    return this.usersService.confirmSuperAdminTransfer(transferId, user.userId, demotedRole);
  }

  @Get('me/sessions')
  async getMySessions(@CurrentUser() user: UserPayload) {
    return this.usersService.getUserSessions(user.userId);
  }

  @Delete('me/sessions/:sessionId')
  async revokeMySession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: UserPayload
  ) {
    return this.usersService.revokeSession(user.userId, sessionId);
  }

  @Post('me/sessions/revoke-others')
  async revokeOtherSessions(@CurrentUser() user: UserPayload) {
    return this.usersService.revokeAllOtherSessions(user.userId, user.sessionId || '');
  }

  @Get('me')
  async getMyProfile(@CurrentUser() user: UserPayload) {
    return this.usersService.getMyProfile(user.userId);
  }

  @Patch('me/preferences')
  async updateMyPreferences(
    @CurrentUser() user: UserPayload,
    @Body() body: { language?: string; fontSize?: string; directoryVisible?: boolean }
  ) {
    return this.usersService.updateMyPreferences(user.userId, body);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SECRETARY', 'CHAIRMAN')
  async getUser(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.usersService.getUserById(id, user.societyId);
  }

  @Post(':id/activation-code')
  @UseGuards(StepUpGuard)
  @RequireStepUp()
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async reissueCode(
    @Param('id') id: string,
    @Body('verifyDetail') verifyDetail: string,
    @CurrentUser() user: UserPayload
  ) {
    return this.usersService.reissueActivationCode(id, user.societyId, user.userId, verifyDetail);
  }

  @Post(':id/change-role')
  @UseGuards(StepUpGuard)
  @RequireStepUp()
  @Roles('SUPER_ADMIN')
  async changeRole(
    @Param('id') id: string,
    @Body('newRole') newRole: Role,
    @CurrentUser() user: UserPayload
  ) {
    return this.usersService.changeRole(id, user.societyId, user.userId, newRole);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'DISABLED',
    @CurrentUser() user: UserPayload
  ) {
    return this.usersService.updateUserStatus(id, user.societyId, user.userId, status);
  }
}
