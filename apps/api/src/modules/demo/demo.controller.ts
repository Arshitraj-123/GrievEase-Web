import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DemoSecurityGuard } from './demo.guard';
import { DemoService } from './demo.service';

@Controller('demo')
@UseGuards(DemoSecurityGuard)
export class DemoController {
  constructor(private demoService: DemoService) {}

  @Post('reset-clock')
  async resetClock() {
    return this.demoService.resetClock();
  }

  @Post('advance-clock')
  async advanceClock(@Body() body: { hours?: number }) {
    return this.demoService.advanceClock(body.hours || 24);
  }

  @Post('seed-extra')
  async seedExtra(@Body() body: { scenario?: string }) {
    return this.demoService.seedExtra(body.scenario);
  }
}
