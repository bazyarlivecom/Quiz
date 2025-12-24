import { db } from '../../../shared/database/connection';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  level: number;
  xp: number;
  total_score: number;
  avatar_url: string | null;
  is_active: boolean;
  is_admin: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  }

  async create(userData: {
    username: string;
    email: string;
    password_hash: string;
  }): Promise<User> {
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userData.username, userData.email, userData.password_hash]
    );
    return result.rows[0];
  }

  async update(id: number, updates: Partial<User>): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key as keyof User] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updates[key as keyof User]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async updateLastLogin(id: number): Promise<void> {
    await db.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }

  async delete(id: number): Promise<void> {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

