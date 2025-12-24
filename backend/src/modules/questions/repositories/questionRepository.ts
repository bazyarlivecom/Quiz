import { db } from '../../../shared/database/connection';

export interface Question {
  id: number;
  category_id: number;
  difficulty: string;
  question_text: string;
  explanation: string | null;
  points: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface QuestionOption {
  id: number;
  question_id: number;
  option_text: string;
  option_order: number;
  is_correct: boolean;
}

export interface QuestionWithOptions extends Question {
  options: QuestionOption[];
}

export class QuestionRepository {
  async findById(id: number, includeOptions: boolean = false): Promise<QuestionWithOptions | null> {
    const questionResult = await db.query('SELECT * FROM questions WHERE id = $1', [id]);

    if (questionResult.rows.length === 0) {
      return null;
    }

    const question = questionResult.rows[0] as Question;

    if (!includeOptions) {
      return { ...question, options: [] };
    }

    const optionsResult = await db.query(
      'SELECT * FROM question_options WHERE question_id = $1 ORDER BY option_order ASC',
      [id]
    );

    return {
      ...question,
      options: optionsResult.rows as QuestionOption[],
    };
  }

  async findRandom(
    categoryId: number | null,
    difficulty: string | null,
    count: number
  ): Promise<Question[]> {
    let query = 'SELECT * FROM questions WHERE is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (categoryId) {
      query += ` AND category_id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (difficulty && difficulty !== 'MIXED') {
      query += ` AND difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    query += ` ORDER BY RANDOM() LIMIT $${paramIndex}`;
    params.push(count);

    const result = await db.query(query, params);
    return result.rows as Question[];
  }

  async findByCategory(categoryId: number): Promise<Question[]> {
    const result = await db.query(
      'SELECT * FROM questions WHERE category_id = $1 AND is_active = true ORDER BY created_at DESC',
      [categoryId]
    );
    return result.rows as Question[];
  }

  async create(questionData: {
    categoryId: number;
    difficulty: string;
    questionText: string;
    explanation?: string;
    points: number;
    options: Array<{ text: string; isCorrect: boolean }>;
  }): Promise<QuestionWithOptions> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const questionResult = await client.query(
        `INSERT INTO questions (category_id, difficulty, question_text, explanation, points)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          questionData.categoryId,
          questionData.difficulty,
          questionData.questionText,
          questionData.explanation || null,
          questionData.points,
        ]
      );

      const question = questionResult.rows[0] as Question;
      const options: QuestionOption[] = [];

      for (let i = 0; i < questionData.options.length; i++) {
        const option = questionData.options[i];
        const optionResult = await client.query(
          `INSERT INTO question_options (question_id, option_text, option_order, is_correct)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [question.id, option.text, i + 1, option.isCorrect]
        );
        options.push(optionResult.rows[0] as QuestionOption);
      }

      await client.query('COMMIT');

      return {
        ...question,
        options,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: number, updates: Partial<Question>): Promise<Question> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key as keyof Question] !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(updates[key as keyof Question]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await db.query(
      `UPDATE questions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] as Question;
  }

  async delete(id: number): Promise<void> {
    await db.query('UPDATE questions SET is_active = false WHERE id = $1', [id]);
  }

  async hardDelete(id: number): Promise<void> {
    await db.query('DELETE FROM question_options WHERE question_id = $1', [id]);
    await db.query('DELETE FROM questions WHERE id = $1', [id]);
  }
}

