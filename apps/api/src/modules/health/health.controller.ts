import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { pool } from '../../database/db';

@Controller('health')
export class HealthController {
  @Get('live')
  getLive() {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async getReady(@Res() res: Response) {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }

      return res.status(HttpStatus.OK).json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'not_ready',
        database: 'disconnected',
        error: err.message,
      });
    }
  }
}
