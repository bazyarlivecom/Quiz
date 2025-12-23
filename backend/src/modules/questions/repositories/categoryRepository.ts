import { pool } from '../../../shared/database/connection';

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export const categoryRepository = {
  async findAll(): Promise<Category[]> {
    const [rows] = await pool.query(
      `SELECT * FROM categories
       WHERE is_active = true
       ORDER BY sort_order ASC, name ASC`
    );
    return rows as Category[];
  },

  async findById(id: number): Promise<Category | null> {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE id = ? AND is_active = true',
      [id]
    );
    return (rows as Category[])[0] || null;
  },
};
