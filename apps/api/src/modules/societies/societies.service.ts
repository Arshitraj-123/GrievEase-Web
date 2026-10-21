import { Injectable, NotFoundException } from '@nestjs/common';
import { pool } from '../../database/db';

@Injectable()
export class SocietiesService {
  async getCurrentSociety(societyId: string) {
    const res = await pool.query(`
      SELECT s.*,
             (SELECT COUNT(*) FROM app_user WHERE society_id = s.id AND status = 'ACTIVE') as active_members,
             (SELECT COUNT(*) FROM flat WHERE society_id = s.id) as total_flats,
             (SELECT COUNT(*) FROM wing WHERE society_id = s.id) as total_wings
      FROM society s
      WHERE s.id = $1;
    `, [societyId]);

    if (res.rows.length === 0) throw new NotFoundException('Society not found');
    return res.rows[0];
  }

  async getWings(societyId: string) {
    const res = await pool.query(`
      SELECT w.*,
             (SELECT COUNT(*) FROM flat WHERE wing_id = w.id) as flats_count
      FROM wing w
      WHERE w.society_id = $1
      ORDER BY w.name ASC;
    `, [societyId]);
    return res.rows;
  }

  async getFlats(societyId: string, wingId?: string) {
    if (wingId) {
      const res = await pool.query(`
        SELECT f.*, w.name as wing_name
        FROM flat f
        JOIN wing w ON f.wing_id = w.id
        WHERE f.society_id = $1 AND f.wing_id = $2
        ORDER BY f.floor ASC, f.flat_number ASC;
      `, [societyId, wingId]);
      return res.rows;
    }

    const res = await pool.query(`
      SELECT f.*, w.name as wing_name
      FROM flat f
      JOIN wing w ON f.wing_id = w.id
      WHERE f.society_id = $1
      ORDER BY w.name ASC, f.floor ASC, f.flat_number ASC;
    `, [societyId]);
    return res.rows;
  }
}
