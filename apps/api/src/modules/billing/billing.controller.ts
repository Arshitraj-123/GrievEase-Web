import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateBillHeadSchema,
  CreateBillCycleSchema,
  RecordPaymentSchema,
  CreateAdjustmentSchema,
  CreateDisputeSchema,
  isAdminRole,
} from '@grievease/contracts';
import { pool } from '../../database/db';

@Controller('api/billing')
@UseGuards(JwtGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ─── Resident: Bills ───────────────────────────────────────────────────────

  @Get('bills')
  async getMyBills(@CurrentUser() user: any) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT b.*, c.name AS cycle_name, c.period_start, c.period_end,
                COALESCE((SELECT SUM(pa.amount_paise) FROM payment_allocation pa WHERE pa.bill_id = b.id), 0) AS paid_paise
         FROM bill b
         JOIN bill_cycle c ON b.cycle_id = c.id
         WHERE b.society_id = $1 AND b.flat_id = $2
         ORDER BY b.due_date DESC`,
        [user.societyId, user.flatId],
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  @Get('bills/:id')
  async getBillDetail(@CurrentUser() user: any, @Param('id') id: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT b.*, c.name AS cycle_name, c.period_start, c.period_end,
                f.flat_number, w.name AS wing_name
         FROM bill b
         JOIN bill_cycle c ON b.cycle_id = c.id
         JOIN flat f ON b.flat_id = f.id
         JOIN wing w ON f.wing_id = w.id
         WHERE b.id = $1 AND b.society_id = $2`,
        [id, user.societyId],
      );
      if (res.rows.length === 0) return null;
      const bill = res.rows[0];

      if (!isAdminRole(user.role) && bill.flat_id !== user.flatId) {
        return null;
      }

      const linesRes = await client.query(
        `SELECT bl.*, bh.name_en AS head_name
         FROM bill_line bl
         LEFT JOIN bill_head bh ON bl.head_id = bh.id
         WHERE bl.bill_id = $1`,
        [id],
      );

      return { ...bill, lines: linesRes.rows };
    } finally {
      client.release();
    }
  }

  // ─── Resident: Payments & Receipts ─────────────────────────────────────────

  @Get('payments')
  async getMyPayments(@CurrentUser() user: any) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT p.id, p.receipt_no, p.amount_paise, p.received_on, p.mode, p.status, p.created_at
         FROM payment p
         WHERE p.society_id = $1 AND p.flat_id = $2
         ORDER BY p.received_on DESC, p.created_at DESC`,
        [user.societyId, user.flatId],
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  @Get('payments/:id')
  async getReceipt(@CurrentUser() user: any, @Param('id') id: string) {
    return this.billingService.getReceipt(
      user.societyId,
      id,
      user.userId,
      isAdminRole(user.role),
    );
  }

  // ─── Resident: Statement ───────────────────────────────────────────────────

  @Get('statement')
  async getStatement(@CurrentUser() user: any) {
    return this.billingService.getFlatStatement(
      user.societyId,
      user.flatId,
      user.userId,
      isAdminRole(user.role),
    );
  }

  // ─── Resident: Disputes ────────────────────────────────────────────────────

  @Get('disputes')
  async getMyDisputes(@CurrentUser() user: any) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT d.*, p.receipt_no FROM payment_dispute d
         LEFT JOIN payment p ON d.payment_id = p.id
         WHERE d.society_id = $1 AND d.flat_id = $2
         ORDER BY d.created_at DESC`,
        [user.societyId, user.flatId],
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  @Post('disputes')
  async createDispute(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateDisputeSchema.parse(body);
    return this.billingService.createDispute(user.societyId, user.userId, user.flatId, validated);
  }

  // ─── Resident: How to Pay Information ───────────────────────────────────────

  @Get('how-to-pay')
  async getHowToPay(@CurrentUser() user: any) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const collectorsRes = await client.query(
        `SELECT full_name, role, mobile FROM app_user
         WHERE society_id = $1 AND role IN ('SECRETARY', 'SUPER_ADMIN') AND status = 'ACTIVE'`,
        [user.societyId],
      );
      const settings = await this.billingService.getSettings(user.societyId);
      return {
        instructions: settings.billing_cash_instructions,
        gstNote: settings.billing_gst_note,
        collectors: collectorsRes.rows,
      };
    } finally {
      client.release();
    }
  }
}

@Controller('api/admin/billing')
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY')
export class AdminBillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('overview')
  async getOverview(@CurrentUser() user: any) {
    return this.billingService.getAdminOverview(user.societyId);
  }

  @Get('heads')
  async listHeads(@CurrentUser() user: any) {
    return this.billingService.listHeads(user.societyId, user.language || 'en');
  }

  @Post('heads')
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async createHead(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateBillHeadSchema.parse(body);
    return this.billingService.createHead(user.societyId, user.userId, validated);
  }

  @Put('heads/:id')
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async updateHead(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const validated = CreateBillHeadSchema.parse(body);
    return this.billingService.updateHead(user.societyId, user.userId, id, validated);
  }

  @Get('cycles')
  async listCycles(@CurrentUser() user: any) {
    return this.billingService.listCycles(user.societyId);
  }

  @Post('cycles/preview')
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async previewCycle(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateBillCycleSchema.parse(body);
    return this.billingService.previewCycle(user.societyId, user.userId, validated);
  }

  @Post('cycles/:id/commit')
  @Roles('CHAIRMAN', 'COMMITTEE', 'SUPER_ADMIN')
  async commitCycle(@CurrentUser() user: any, @Param('id') id: string) {
    return this.billingService.commitCycle(user.societyId, user.userId, id);
  }

  // Cash collection desk
  @Post('payments')
  @Roles('SECRETARY', 'SUPER_ADMIN')
  async recordPayment(
    @CurrentUser() user: any,
    @Body() body: any,
    @Req() req: any,
  ) {
    const validated = RecordPaymentSchema.parse(body);
    return this.billingService.recordPayment(user.societyId, user.userId, validated, req.ip);
  }

  @Get('receipts/verify')
  async verifyReceipt(@CurrentUser() user: any, @Query('q') q: string) {
    return this.billingService.verifyReceipt(user.societyId, q);
  }

  // Daily cash sessions
  @Get('sessions/current')
  async getCurrentSession(@CurrentUser() user: any) {
    return this.billingService.getSessionStatus(user.societyId, user.userId);
  }

  @Post('sessions/open')
  @Roles('SECRETARY', 'SUPER_ADMIN')
  async openSession(@CurrentUser() user: any) {
    return this.billingService.openSession(user.societyId, user.userId);
  }

  @Post('sessions/close')
  @Roles('SECRETARY', 'SUPER_ADMIN')
  async closeSession(
    @CurrentUser() user: any,
    @Body() body: { sessionId: string; countedPaise: number; varianceNote?: string; depositedPaise?: number; depositRef?: string; depositOn?: string },
  ) {
    return this.billingService.closeSession(user.societyId, user.userId, body.sessionId, body);
  }

  @Post('sessions/:id/reconcile')
  @Roles('CHAIRMAN', 'COMMITTEE', 'SUPER_ADMIN')
  async reconcileSession(@CurrentUser() user: any, @Param('id') id: string) {
    return this.billingService.reconcileSession(user.societyId, user.userId, id);
  }

  // Adjustments & Maker-Checker
  @Get('adjustments')
  async listAdjustments(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.billingService.listAdjustments(user.societyId, status);
  }

  @Post('adjustments')
  @Roles('SECRETARY', 'SUPER_ADMIN')
  async createAdjustment(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateAdjustmentSchema.parse(body);
    return this.billingService.createAdjustmentRequest(user.societyId, user.userId, validated);
  }

  @Post('adjustments/:id/decide')
  @Roles('CHAIRMAN', 'COMMITTEE', 'SUPER_ADMIN')
  async decideAdjustment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { decision: 'APPROVED' | 'REJECTED'; decisionNote?: string },
  ) {
    return this.billingService.decideAdjustment(user.societyId, user.userId, id, body.decision, body.decisionNote);
  }

  // Disputes queue
  @Get('disputes')
  async listDisputes(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.billingService.listDisputes(user.societyId, status);
  }

  @Post('disputes/:id/resolve')
  @Roles('CHAIRMAN', 'COMMITTEE', 'SUPER_ADMIN')
  async resolveDispute(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status: 'RESOLVED' | 'REJECTED'; outcomeNote: string },
  ) {
    return this.billingService.resolveDispute(user.societyId, user.userId, id, body.status, body.outcomeNote);
  }

  // Defaulters list (audited)
  @Get('defaulters')
  async getDefaulters(@CurrentUser() user: any) {
    return this.billingService.getDefaulters(user.societyId, user.userId);
  }

  // Flat ledger viewer
  @Get('ledger/:flatId')
  async getFlatLedger(@CurrentUser() user: any, @Param('flatId') flatId: string) {
    return this.billingService.getFlatStatement(user.societyId, flatId, user.userId, true);
  }

  @Post('ledger/:flatId/verify')
  async verifyLedger(@CurrentUser() user: any, @Param('flatId') flatId: string) {
    return this.billingService.verifyFlatLedgerChain(user.societyId, flatId);
  }

  // Opening balances
  @Post('opening-balances/preview')
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async previewOpeningBalances(@CurrentUser() user: any, @Body('rows') rows: any[]) {
    return this.billingService.previewOpeningBalances(user.societyId, user.userId, rows || []);
  }

  @Post('opening-balances/commit')
  @Roles('CHAIRMAN', 'COMMITTEE', 'SUPER_ADMIN')
  async commitOpeningBalances(
    @CurrentUser() user: any,
    @Body() body: { items: any[]; creatorId: string },
  ) {
    return this.billingService.commitOpeningBalances(user.societyId, user.userId, body.items, body.creatorId);
  }

  // Settings
  @Get('settings')
  async getSettings(@CurrentUser() user: any) {
    return this.billingService.getSettings(user.societyId);
  }

  @Put('settings')
  @Roles('SUPER_ADMIN')
  async updateSettings(@CurrentUser() user: any, @Body() body: Record<string, string>) {
    return this.billingService.updateSettings(user.societyId, user.userId, body);
  }
}
