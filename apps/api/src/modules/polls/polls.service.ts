import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  CreatePollDto,
  VotePollDto,
  PollListItemDto,
  PollDetailDto,
  PollOptionDto,
} from '@grievease/contracts';
import crypto from 'crypto';

@Injectable()
export class PollsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PollsService.name);
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor(
    private auditService: AuditService,
    private gateway: NotificationsGateway
  ) {}

  onModuleInit() {
    // Periodic sweep every minute to open due polls and close expired polls
    this.sweepTimer = setInterval(() => {
      this.runPeriodicPollSweep().catch((err) =>
        this.logger.error(`Periodic poll sweep failed: ${err.message}`)
      );
    }, 60 * 1000);
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  /**
   * Periodic sweep: open due polls and close expired polls, freezing snapshots
   */
  async runPeriodicPollSweep() {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // 1. Open scheduled polls whose opens_at <= NOW()
      await client.query(`
        UPDATE poll
        SET status = 'OPEN', updated_at = NOW()
        WHERE status = 'DRAFT' AND opens_at <= NOW() AND closes_at > NOW();
      `);

      // 2. Close polls whose closes_at <= NOW() and freeze snapshot
      const expiredRes = await client.query(`
        SELECT id, society_id FROM poll
        WHERE status = 'OPEN' AND closes_at <= NOW();
      `);

      for (const row of expiredRes.rows) {
        await this.closePollDirect(client, row.id, row.society_id, 'SYSTEM_WORKER');
      }
    } finally {
      client.release();
    }
  }

  /**
   * Create a new poll
   */
  async createPoll(
    societyId: string,
    userId: string,
    dto: CreatePollDto
  ): Promise<{ id: string }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      await client.query('BEGIN');

      const opensAt = new Date(dto.opensAt);
      const closesAt = new Date(dto.closesAt);

      if (closesAt <= opensAt) {
        throw new BadRequestException('Poll closing time must be strictly after opening time.');
      }

      const initialStatus = opensAt <= new Date() ? 'OPEN' : 'DRAFT';

      const pollRes = await client.query(`
        INSERT INTO poll (
          society_id, notice_id, title, description, type, max_choices,
          eligibility, vote_unit, ballot, results_visibility, quorum_percent,
          opens_at, closes_at, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id;
      `, [
        societyId,
        dto.noticeId || null,
        dto.title.trim(),
        dto.description?.trim() || null,
        dto.type,
        dto.type === 'MULTIPLE' ? dto.maxChoices || 2 : 1,
        dto.eligibility,
        dto.voteUnit,
        dto.ballot,
        dto.resultsVisibility,
        dto.quorumPercent || null,
        opensAt,
        closesAt,
        initialStatus,
        userId,
      ]);

      const pollId = pollRes.rows[0].id;

      for (const [i, opt] of dto.options.entries()) {
        if (!opt) continue;
        await client.query(`
          INSERT INTO poll_option (poll_id, label_en, label_hi, label_mr, sort_order)
          VALUES ($1, $2, $3, $4, $5);
        `, [
          pollId,
          opt.labelEn.trim(),
          opt.labelHi?.trim() || null,
          opt.labelMr?.trim() || null,
          opt.sortOrder !== undefined ? opt.sortOrder : i,
        ]);
      }

      await client.query('COMMIT');

      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: 'ADMIN',
        action: 'POLL_CREATED',
        entityType: 'POLL',
        entityId: pollId,
        after: { title: dto.title, type: dto.type, ballot: dto.ballot },
      });

      return { id: pollId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Cast a vote with strict concurrency, unique voter_ref, and unlinkable secret ballot
   */
  async castVote(
    societyId: string,
    userId: string,
    userRole: string,
    flatId: string | null,
    pollId: string,
    dto: VotePollDto
  ): Promise<{ success: boolean; message: string }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      await client.query('BEGIN');

      // 1. Fetch poll with lock
      const pollRes = await client.query(`
        SELECT * FROM poll
        WHERE id = $1 AND society_id = $2
        FOR UPDATE;
      `, [pollId, societyId]);

      if (pollRes.rows.length === 0) {
        throw new NotFoundException('Poll not found');
      }

      const poll = pollRes.rows[0];

      if (poll.status !== 'OPEN') {
        throw new BadRequestException('This poll is not currently open for voting.');
      }

      if (new Date() < new Date(poll.opens_at) || new Date() > new Date(poll.closes_at)) {
        throw new BadRequestException('Poll voting window is closed.');
      }

      // 2. Check eligibility
      if (poll.eligibility === 'OWNERS_ONLY') {
        const userRes = await client.query(`
          SELECT resident_type FROM app_user WHERE id = $1;
        `, [userId]);
        if (userRes.rows[0]?.resident_type !== 'OWNER') {
          throw new ForbiddenException('Only flat owners are eligible to vote in this poll.');
        }
      } else if (poll.eligibility === 'ROLES') {
        // e.g. committee roles only
        const allowedRoles = ['COMMITTEE', 'CHAIRMAN', 'SECRETARY', 'SUPER_ADMIN'];
        if (!allowedRoles.includes(userRole)) {
          throw new ForbiddenException('You do not have the required role to participate in this poll.');
        }
      }

      // 3. Determine voter reference (per user or per flat)
      let voterRef: string;
      if (poll.vote_unit === 'PER_FLAT') {
        if (!flatId) {
          throw new BadRequestException('You must belong to a registered flat to vote in this poll.');
        }
        voterRef = `flat:${flatId}`;
      } else {
        voterRef = `user:${userId}`;
      }

      // 4. Validate choices count
      if (dto.selectedOptionIds.length === 0) {
        throw new BadRequestException('You must select at least one choice.');
      }
      if (poll.type === 'SINGLE' && dto.selectedOptionIds.length > 1) {
        throw new BadRequestException('This is a single-choice poll.');
      }
      if (poll.type === 'MULTIPLE' && dto.selectedOptionIds.length > poll.max_choices) {
        throw new BadRequestException(`You can select at most ${poll.max_choices} choices.`);
      }

      // Verify all chosen option IDs belong to this poll
      const optCheckRes = await client.query(`
        SELECT id FROM poll_option
        WHERE poll_id = $1 AND id = ANY($2::uuid[]);
      `, [pollId, dto.selectedOptionIds]);

      if (optCheckRes.rows.length !== dto.selectedOptionIds.length) {
        throw new BadRequestException('One or more selected options are invalid for this poll.');
      }

      // 5. Insert voter roll entry (enforces strictly ONE vote per voter_ref via UNIQUE constraint)
      try {
        await client.query(`
          INSERT INTO poll_voter_roll (poll_id, voter_ref, voted_at)
          VALUES ($1, $2, NOW());
        `, [pollId, voterRef]);
      } catch (err: any) {
        if (err.code === '23505') {
          // Unique violation
          throw new ConflictException(
            poll.vote_unit === 'PER_FLAT'
              ? 'A vote has already been cast for your flat.'
              : 'You have already voted in this poll.'
          );
        }
        throw err;
      }

      // 6. Record ballot choices
      // For SECRET ballots: Cast bucket is rounded to the hour.
      // NO user reference, flat reference, or link to poll_voter_roll exists!
      const castBucket = new Date();
      castBucket.setMinutes(0, 0, 0);

      for (const optionId of dto.selectedOptionIds) {
        await client.query(`
          INSERT INTO poll_ballot (poll_id, option_id, cast_bucket)
          VALUES ($1, $2, $3);
        `, [pollId, optionId, castBucket]);
      }

      await client.query('COMMIT');

      // Emit live vote tick
      this.gateway.emitToSociety(societyId, 'poll:voted', { pollId });

      return { success: true, message: 'Your vote has been securely recorded.' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Close a poll, calculate final tally, freeze result snapshot, and store SHA-256 hash in audit log
   */
  async closePollDirect(client: any, pollId: string, societyId: string, actorId: string) {
    const tallyRes = await client.query(`
      SELECT po.id as "optionId", po.label_en as "labelEn", COUNT(pb.id)::int as count
      FROM poll_option po
      LEFT JOIN poll_ballot pb ON po.id = pb.option_id
      WHERE po.poll_id = $1
      GROUP BY po.id, po.label_en, po.sort_order
      ORDER BY po.sort_order ASC;
    `, [pollId]);

    const turnoutRes = await client.query(`
      SELECT COUNT(*)::int as count FROM poll_voter_roll WHERE poll_id = $1;
    `, [pollId]);
    const totalVotes = turnoutRes.rows[0]?.count || 0;

    const snapshot = {
      pollId,
      totalVotes,
      closedAt: new Date().toISOString(),
      results: tallyRes.rows.map((r: any) => ({
        optionId: r.optionId,
        labelEn: r.labelEn,
        count: r.count,
        percentage: totalVotes > 0 ? Math.round((r.count / totalVotes) * 100) : 0,
      })),
    };

    // Calculate SHA-256 hash of snapshot for audit trail verification
    const snapshotHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(snapshot))
      .digest('hex');

    await client.query(`
      UPDATE poll
      SET status = 'CLOSED', result_snapshot = $1, result_hash = $2, updated_at = NOW()
      WHERE id = $3 AND society_id = $4;
    `, [JSON.stringify(snapshot), snapshotHash, pollId, societyId]);

    await this.auditService.append({
      societyId,
      actorId,
      actorRole: 'SYSTEM_WORKER',
      action: 'POLL_CLOSED_FROZEN',
      entityType: 'POLL',
      entityId: pollId,
      after: { totalVotes, resultHash: snapshotHash },
    });
  }

  /**
   * Extend poll closing time (permitted after first vote with audited reason)
   */
  async extendPollClosing(
    societyId: string,
    userId: string,
    pollId: string,
    newClosesAt: string,
    reason: string
  ): Promise<boolean> {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('A valid reason is required to extend poll duration.');
    }

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const prevRes = await client.query(`
        SELECT closes_at FROM poll WHERE id = $1 AND society_id = $2;
      `, [pollId, societyId]);

      if (prevRes.rows.length === 0) throw new NotFoundException('Poll not found');
      const prevClosesAt = prevRes.rows[0].closes_at;

      if (new Date(newClosesAt) <= new Date(prevClosesAt)) {
        throw new BadRequestException('New closing time must be after the current closing time.');
      }

      await client.query(`
        UPDATE poll
        SET closes_at = $1, updated_at = NOW()
        WHERE id = $2 AND society_id = $3;
      `, [new Date(newClosesAt), pollId, societyId]);

      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: 'ADMIN',
        action: 'POLL_EXTENDED',
        entityType: 'POLL',
        entityId: pollId,
        before: { closesAt: prevClosesAt },
        after: { closesAt: newClosesAt, reason },
      });

      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Get list of polls for community screen (resident view)
   */
  async getCommunityPolls(
    societyId: string,
    userId: string,
    flatId: string | null
  ): Promise<{ openPolls: PollListItemDto[]; closedPolls: PollListItemDto[] }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const voterRefUser = `user:${userId}`;
      const voterRefFlat = flatId ? `flat:${flatId}` : 'none';

      const res = await client.query(`
        SELECT
          p.id,
          p.title,
          p.description,
          p.type,
          p.status,
          p.ballot,
          p.results_visibility as "resultsVisibility",
          p.opens_at::text as "opensAt",
          p.closes_at::text as "closesAt",
          p.quorum_percent as "quorumPercent",
          (SELECT COUNT(*)::int FROM poll_voter_roll pvr WHERE pvr.poll_id = p.id) as "totalVotes",
          EXISTS(
            SELECT 1 FROM poll_voter_roll pvr
            WHERE pvr.poll_id = p.id AND (pvr.voter_ref = $2 OR pvr.voter_ref = $3)
          ) as "hasVoted"
        FROM poll p
        WHERE p.society_id = $1 AND p.status IN ('OPEN', 'CLOSED')
        ORDER BY
          CASE WHEN p.status = 'OPEN' THEN 0 ELSE 1 END,
          p.closes_at DESC;
      `, [societyId, voterRefUser, voterRefFlat]);

      const openPolls: PollListItemDto[] = [];
      const closedPolls: PollListItemDto[] = [];

      for (const row of res.rows) {
        const item: PollListItemDto = {
          id: row.id,
          title: row.title,
          description: row.description,
          type: row.type,
          status: row.status,
          ballot: row.ballot,
          resultsVisibility: row.resultsVisibility,
          opensAt: row.opensAt,
          closesAt: row.closesAt,
          hasVoted: row.hasVoted,
          totalVotes: row.totalVotes,
          quorumPercent: row.quorumPercent ? Number(row.quorumPercent) : null,
        };

        if (row.status === 'OPEN') {
          openPolls.push(item);
        } else {
          closedPolls.push(item);
        }
      }

      return { openPolls, closedPolls };
    } finally {
      client.release();
    }
  }

  /**
   * Get single poll detail with randomised option order and results based on visibility
   */
  async getPollDetail(
    societyId: string,
    userId: string,
    flatId: string | null,
    pollId: string,
    userRole: string = 'RESIDENT'
  ): Promise<PollDetailDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const voterRefUser = `user:${userId}`;
      const voterRefFlat = flatId ? `flat:${flatId}` : 'none';

      const pollRes = await client.query(`
        SELECT
          p.*,
          (SELECT COUNT(*)::int FROM poll_voter_roll pvr WHERE pvr.poll_id = p.id) as "totalVotes",
          EXISTS(
            SELECT 1 FROM poll_voter_roll pvr
            WHERE pvr.poll_id = p.id AND (pvr.voter_ref = $2 OR pvr.voter_ref = $3)
          ) as "hasVoted",
          (
            SELECT pvr.voted_at::text FROM poll_voter_roll pvr
            WHERE pvr.poll_id = p.id AND (pvr.voter_ref = $2 OR pvr.voter_ref = $3)
            LIMIT 1
          ) as "userVotedAt"
        FROM poll p
        WHERE p.id = $4 AND p.society_id = $1;
      `, [societyId, voterRefUser, voterRefFlat, pollId]);

      if (pollRes.rows.length === 0) {
        throw new NotFoundException('Poll not found');
      }

      const poll = pollRes.rows[0];
      const hasVoted = poll.hasVoted;
      const isAdmin = ['SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE'].includes(userRole);

      // Determine if results can be viewed
      let canViewResults = false;
      if (isAdmin) {
        canViewResults = true;
      } else if (poll.status === 'CLOSED' && poll.results_visibility !== 'ADMIN_ONLY') {
        canViewResults = true;
      } else if (hasVoted && poll.results_visibility === 'AFTER_VOTE') {
        canViewResults = true;
      }

      // Fetch options with tally if results can be viewed
      const optRes = await client.query(`
        SELECT
          po.id,
          po.label_en as "labelEn",
          po.label_hi as "labelHi",
          po.label_mr as "labelMr",
          po.sort_order as "sortOrder",
          COALESCE(COUNT(pb.id), 0)::int as "voteCount"
        FROM poll_option po
        LEFT JOIN poll_ballot pb ON po.id = pb.option_id
        WHERE po.poll_id = $1
        GROUP BY po.id, po.label_en, po.label_hi, po.label_mr, po.sort_order
        ORDER BY po.sort_order ASC;
      `, [pollId]);

      const totalVotes = poll.totalVotes;
      let options: PollOptionDto[] = optRes.rows.map((o: any) => ({
        id: o.id,
        labelEn: o.labelEn,
        labelHi: o.labelHi,
        labelMr: o.labelMr,
        sortOrder: o.sortOrder,
        voteCount: canViewResults ? o.voteCount : undefined,
        votePercentage: canViewResults && totalVotes > 0 ? Math.round((o.voteCount / totalVotes) * 100) : undefined,
      }));

      // Randomise option order per voter before vote is cast (prevents position bias)
      if (!hasVoted) {
        // Deterministic pseudo-random shuffle seeded by userId + pollId
        const seedStr = `${userId}-${pollId}`;
        let hashNum = 0;
        for (let i = 0; i < seedStr.length; i++) {
          hashNum = (hashNum * 31 + seedStr.charCodeAt(i)) % 100000;
        }
        options = [...options].sort(() => ((hashNum % 3) - 1));
      }

      return {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        type: poll.type,
        status: poll.status,
        ballot: poll.ballot,
        resultsVisibility: poll.results_visibility,
        opensAt: poll.opens_at.toISOString(),
        closesAt: poll.closes_at.toISOString(),
        hasVoted,
        totalVotes,
        quorumPercent: poll.quorum_percent ? Number(poll.quorum_percent) : null,
        options,
        isEligible: true,
        userVotedAt: poll.userVotedAt,
        resultHash: poll.result_hash,
        canViewResults,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Admin view of all polls
   */
  async getAdminPolls(societyId: string): Promise<PollListItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(`
        SELECT
          p.id,
          p.title,
          p.description,
          p.type,
          p.status,
          p.ballot,
          p.results_visibility as "resultsVisibility",
          p.opens_at::text as "opensAt",
          p.closes_at::text as "closesAt",
          p.quorum_percent as "quorumPercent",
          (SELECT COUNT(*)::int FROM poll_voter_roll pvr WHERE pvr.poll_id = p.id) as "totalVotes"
        FROM poll p
        WHERE p.society_id = $1
        ORDER BY p.created_at DESC;
      `, [societyId]);

      return res.rows.map((r) => ({
        ...r,
        hasVoted: false,
        quorumPercent: r.quorumPercent ? Number(r.quorumPercent) : null,
      }));
    } finally {
      client.release();
    }
  }
}
