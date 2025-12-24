import { db } from '../../../shared/database/connection';

export interface QuizSession {
  id: number;
  user_id: number;
  category_id: number | null;
  difficulty: string;
  questions_count: number;
  started_at: Date;
  ended_at: Date | null;
  total_score: number;
  correct_answers: number;
  wrong_answers: number;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'TIMED_OUT';
  time_spent: number | null;
  is_practice: boolean;
  game_mode: 'SINGLE_PLAYER' | 'MULTI_PLAYER' | 'PRACTICE';
  created_at: Date;
}

export interface MatchQuestion {
  id: number;
  match_id: number;
  question_id: number;
  question_order: number;
  created_at: Date;
}

export class QuizSessionRepository {
  async create(sessionData: {
    userId: number;
    categoryId: number | null;
    difficulty: string;
    questionsCount: number;
    gameMode: string;
    isPractice?: boolean;
    parentSessionId?: number;
  }): Promise<QuizSession> {
    const result = await db.query(
      `INSERT INTO matches (
                user_id, category_id, difficulty, questions_count,
                status, is_practice, game_mode, started_at, created_at
            ) VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
      [
        sessionData.userId,
        sessionData.categoryId,
        sessionData.difficulty,
        sessionData.questionsCount,
        sessionData.isPractice || false,
        sessionData.gameMode,
      ]
    );
    return result.rows[0] as QuizSession;
  }

  async findById(id: number): Promise<QuizSession | null> {
    const result = await db.query('SELECT * FROM matches WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByUserId(userId: number, status?: string): Promise<QuizSession[]> {
    let query = 'SELECT * FROM matches WHERE user_id = $1';
    const params: any[] = [userId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY started_at DESC';

    const result = await db.query(query, params);
    return result.rows as QuizSession[];
  }

  async update(
    id: number,
    updates: {
      totalScore?: number;
      correctAnswers?: number;
      wrongAnswers?: number;
      status?: string;
      endedAt?: Date;
      timeSpent?: number;
    }
  ): Promise<QuizSession> {
    // If updating answers, validate constraint first
    if (updates.correctAnswers !== undefined || updates.wrongAnswers !== undefined) {
      const currentSession = await this.findById(id);
      if (currentSession) {
        const currentCorrect = currentSession.correct_answers || 0;
        const currentWrong = currentSession.wrong_answers || 0;
        const newCorrect = currentCorrect + (updates.correctAnswers || 0);
        const newWrong = currentWrong + (updates.wrongAnswers || 0);
        
        if (newCorrect + newWrong > currentSession.questions_count) {
          throw new Error(`Cannot update: correct_answers (${newCorrect}) + wrong_answers (${newWrong}) exceeds questions_count (${currentSession.questions_count})`);
        }
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.totalScore !== undefined) {
      fields.push(`total_score = total_score + $${paramIndex}`);
      values.push(updates.totalScore);
      paramIndex++;
    }

    if (updates.correctAnswers !== undefined) {
      fields.push(`correct_answers = correct_answers + $${paramIndex}`);
      values.push(updates.correctAnswers);
      paramIndex++;
    }

    if (updates.wrongAnswers !== undefined) {
      fields.push(`wrong_answers = wrong_answers + $${paramIndex}`);
      values.push(updates.wrongAnswers);
      paramIndex++;
    }

    if (updates.status) {
      fields.push(`status = $${paramIndex}`);
      values.push(updates.status);
      paramIndex++;
    }

    if (updates.endedAt) {
      fields.push(`ended_at = $${paramIndex}`);
      values.push(updates.endedAt);
      paramIndex++;
    }

    if (updates.timeSpent !== undefined) {
      fields.push(`time_spent = $${paramIndex}`);
      values.push(updates.timeSpent);
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const result = await db.query(
      `UPDATE matches SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] as QuizSession;
  }

  async addMatchQuestion(matchId: number, questionId: number, order: number): Promise<void> {
    await db.query(
      `INSERT INTO match_questions (match_id, question_id, question_order)
       VALUES ($1, $2, $3)`,
      [matchId, questionId, order]
    );
  }

  async getMatchQuestions(matchId: number): Promise<MatchQuestion[]> {
    const result = await db.query(
      'SELECT * FROM match_questions WHERE match_id = $1 ORDER BY question_order ASC',
      [matchId]
    );
    return result.rows as MatchQuestion[];
  }
}

