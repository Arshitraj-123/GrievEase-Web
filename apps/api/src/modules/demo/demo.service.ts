import { Injectable, Logger } from '@nestjs/common';
import { pool } from '../../database/db';
import { EscalationService } from '../escalation/escalation.service';

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);
  private virtualOffsetMs = 0;

  constructor(private escalationService: EscalationService) {}

  getVirtualNow(): Date {
    return new Date(Date.now() + this.virtualOffsetMs);
  }

  async resetClock() {
    this.virtualOffsetMs = 0;
    this.logger.log('[DEMO] Clock reset to real time.');
    // Reset all open grievance SLA dates to standard 48-hour future windows
    await pool.query(`
      UPDATE grievance
      SET sla_due_at = NOW() + INTERVAL '48 hours'
      WHERE status NOT IN ('RESOLVED', 'CLOSED', 'DRAFT');
    `);
    return { success: true, message: 'Demo clock and SLA deadlines reset to baseline.' };
  }

  async advanceClock(hours: number) {
    if (!hours || hours <= 0) {
      hours = 24;
    }
    this.virtualOffsetMs += hours * 60 * 60 * 1000;
    this.logger.log(`[DEMO] Clock advanced by ${hours} hours. Virtual offset: ${this.virtualOffsetMs / 3600000}h`);

    // In demo database, adjust open grievances backward by specified hours to trigger SLA breaches
    const updateRes = await pool.query(
      `
      UPDATE grievance
      SET sla_due_at = sla_due_at - ($1 || ' hours')::interval
      WHERE status NOT IN ('RESOLVED', 'CLOSED', 'DRAFT')
      RETURNING id, public_id, current_level, sla_due_at;
    `,
      [hours]
    );

    // Trigger the escalation recovery sweep immediately to evaluate breaches
    const sweepResult = await this.escalationService.runHourlySweep();

    // Query state of escalated grievances
    const grievancesRes = await pool.query(`
      SELECT id, public_id, current_level, status, sla_due_at
      FROM grievance
      ORDER BY updated_at DESC
      LIMIT 10;
    `);

    return {
      success: true,
      advancedHours: hours,
      virtualNow: this.getVirtualNow().toISOString(),
      updatedDeadlines: updateRes.rowCount,
      sweepResult,
      grievances: grievancesRes.rows,
    };
  }

  async seedExtra(scenario?: string) {
    this.logger.log(`[DEMO] Seeding extra scenario: ${scenario || 'default'}`);

    if (scenario === 'tampered_chain') {
      // Intentionally tamper with a mock copy of audit log in demo to prove detection
      await pool.query(`
        UPDATE audit_log
        SET action = 'TAMPERED_ACTION_FOR_DEMO_ALERT'
        WHERE id = (SELECT id FROM audit_log ORDER BY id DESC LIMIT 1);
      `);
      return { success: true, scenario: 'tampered_chain', message: 'Injected deliberate hash tamper into demo audit log' };
    }

    if (scenario === 'emergency_notice') {
      const societyRes = await pool.query(`SELECT id FROM society LIMIT 1;`);
      const societyId = societyRes.rows[0]?.id;
      if (societyId) {
        await pool.query(`
          INSERT INTO notice (society_id, title_en, title_hi, body_en, body_hi, priority, published_at)
          VALUES (
            $1,
            'EMERGENCY: Water Tank Maintenance at 4:00 PM',
            'आपातकालीन: शाम 4:00 बजे पानी की टंकी का रखरखाव',
            'Water supply will be paused between 4:00 PM and 7:00 PM for scheduled cleaning.',
            'नियमित सफाई के लिए शाम 4:00 बजे से 7:00 बजे तक पानी की आपूर्ति बाधित रहेगी।',
            'EMERGENCY',
            NOW()
          );
        `, [societyId]);
      }
      return { success: true, scenario: 'emergency_notice' };
    }

    return { success: true, scenario: scenario || 'none' };
  }
}
