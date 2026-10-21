import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SocietiesService } from './societies.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@Controller('societies')
@UseGuards(JwtGuard)
export class SocietiesController {
  constructor(private societiesService: SocietiesService) {}

  @Get('current')
  async getCurrent(@CurrentUser() user: UserPayload) {
    return this.societiesService.getCurrentSociety(user.societyId);
  }

  @Get('wings')
  async getWings(@CurrentUser() user: UserPayload) {
    return this.societiesService.getWings(user.societyId);
  }

  @Get('flats')
  async getFlats(
    @CurrentUser() user: UserPayload,
    @Query('wingId') wingId?: string
  ) {
    return this.societiesService.getFlats(user.societyId, wingId);
  }
}
