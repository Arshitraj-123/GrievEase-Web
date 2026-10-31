import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';
import { DemoSecurityGuard } from './demo.guard';
import { EscalationModule } from '../escalation/escalation.module';

@Module({
  imports: [EscalationModule],
  controllers: [DemoController],
  providers: [DemoService, DemoSecurityGuard],
  exports: [DemoService],
})
export class DemoModule {}
