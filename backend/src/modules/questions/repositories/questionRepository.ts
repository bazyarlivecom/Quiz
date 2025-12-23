import { pool } from '../../../shared/database/connection';

export interface Question {
  id: number;
  category_id: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  question_text: string;
  explanation?: string;
  points: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// DB model (includes correct flag)
export interface QuestionOptionDb {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
  option_order: number;
}

export interface QuestionWithOptions extends Question {
  // Public API: never expose is_correct / question_id
  options: QuestionOptionPublic[];
}

export type QuestionOptionPublic = Pick<
  QuestionOptionDb,
  'id' | 'option_text' | 'option_order'
>;

export const questionRepository = {
  async findById(id: number): Promise<Question | null> {
    const [rows] = await pool.query(
      'SELECT * FROM questions WHERE id = ? AND is_active = true',
      [id]
    );
    return (rows as Question[])[0] || null;
  },

  async findRandom(
    categoryId: number | null,
    difficulty: string | null,
    count: number
  ): Promise<Question[]> {
    let query = `
      SELECT * FROM questions
      WHERE is_active = true
    `;
    const params: any[] = [];

    if (categoryId !== null) {
      query += ` AND category_id = ?`;
      params.push(categoryId);
    }

    if (difficulty && difficulty !== 'MIXED') {
      query += ` AND difficulty = ?`;
      params.push(difficulty);
    }

    query += ` ORDER BY RAND() LIMIT ?`;
    params.push(count);

    const [rows] = await pool.query(query, params);
    return rows as Question[];
  },

  async getOptions(questionId: number): Promise<QuestionOptionDb[]> {
    const [rows] = await pool.query(
      `SELECT * FROM question_options
       WHERE question_id = ?
       ORDER BY option_order ASC`,
      [questionId]
    );
    return rows as QuestionOptionDb[];
  },

  async getQuestionsWithOptions(
    categoryId: number | null,
    difficulty: string | null,
    count: number
  ): Promise<QuestionWithOptions[]> {
    const questions = await this.findRandom(categoryId, difficulty, count);
    
    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await this.getOptions(question.id);
        // Shuffle options but don't reveal correct answer
        const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
        return {
          ...question,
          options: shuffledOptions.map((opt) => ({
            id: opt.id,
            option_text: opt.option_text,
            option_order: opt.option_order,
            // Don't include is_correct in response
          })) as QuestionOptionPublic[],
        };
      })
    );

    return questionsWithOptions;
  },
};
