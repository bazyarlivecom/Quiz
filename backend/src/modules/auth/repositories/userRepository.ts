import { pool } from '../../../shared/database/connection';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  level: number;
  xp: number;
  total_score: number;
  avatar_url?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return (rows as User[])[0] || null;
  },

  async findById(id: number): Promise<User | null> {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return (rows as User[])[0] || null;
  },

  async findByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return (rows as User[])[0] || null;
  },

  async create(userData: {
    username: string;
    email: string;
    password_hash: string;
  }): Promise<User> {
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES (?, ?, ?)`,
      [userData.username, userData.email, userData.password_hash]
    ) as any;
    
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    );
    return (rows as User[])[0];
  },

  async updateLastLogin(id: number): Promise<void> {
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [id]
    );
  },
};

