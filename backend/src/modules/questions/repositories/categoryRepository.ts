import { db } from '../../../shared/database/connection';

export interface Category {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export class CategoryRepository {
  async findAll(): Promise<Category[]> {
    const result = await db.query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY sort_order ASC, name ASC'
    );
    return result.rows as Category[];
  }

  async findById(id: number): Promise<Category | null> {
    const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(categoryData: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }): Promise<Category> {
    const result = await db.query(
      `INSERT INTO categories (name, description, icon, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        categoryData.name,
        categoryData.description || null,
        categoryData.icon || null,
        categoryData.color || null,
      ]
    );
    return result.rows[0] as Category;
  }

  async update(id: number, updates: Partial<Category>): Promise<Category> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key as keyof Category] !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(updates[key as keyof Category]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await db.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] as Category;
  }
}

