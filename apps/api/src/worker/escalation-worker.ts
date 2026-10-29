import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EscalationService } from '../modules/escalation/escalation.service';
import { Logger } from '@nestjs/common';

async function bootstrapWorker() {
  const logger = new Logger('EscalationWorkerProcess');
  logger.log('⚙️ Starting standalone GrievEase Escalation Worker Process...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const escalationService = app.get(EscalationService);

  logger.log(`✅ Escalation Worker active (${escalationService.constructor.name}) and listening for breach events and periodic sweeps.`);

  const shutdown = async () => {
    logger.log('🛑 Gracefully stopping escalation worker...');
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  bootstrapWorker().catch((err) => {
    console.error('Fatal worker error:', err);
    process.exit(1);
  });
}
