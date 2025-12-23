import { pool } from '../../../shared/database/connection';

export interface Match {
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

export const quizSessionRepository = {
  async create(matchData: {
    user_id: number;
    category_id: number | null;
    difficulty: string;
    questions_count: number;
    is_practice: boolean;
    game_mode: 'SINGLE_PLAYER' | 'MULTI_PLAYER' | 'PRACTICE';
  }): Promise<Match> {
    const [result] = await pool.query(
      `INSERT INTO matches (
        user_id, category_id, difficulty, questions_count,
        is_practice, game_mode, status, started_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', NOW())`,
      [
        matchData.user_id,
        matchData.category_id,
        matchData.difficulty,
        matchData.questions_count,
        matchData.is_practice,
        matchData.game_mode,
      ]
    ) as any;

    const [rows] = await pool.query(
      'SELECT * FROM matches WHERE id = ?',
      [result.insertId]
    );
    return (rows as Match[])[0];
  },

  async findById(id: number): Promise<Match | null> {
    const [rows] = await pool.query(
      'SELECT * FROM matches WHERE id = ?',
      [id]
    );
    return (rows as Match[])[0] || null;
  },

  async findActiveByUserId(userId: number): Promise<Match | null> {
    const [rows] = await pool.query(
      `SELECT * FROM matches
       WHERE user_id = ? AND status = 'ACTIVE'
       ORDER BY started_at DESC
       LIMIT 1`,
      [userId]
    );
    return (rows as Match[])[0] || null;
  },

  async addQuestions(matchId: number, questionIds: number[]): Promise<void> {
    for (let i = 0; i < questionIds.length; i++) {
      await pool.query(
        `INSERT INTO match_questions (match_id, question_id, question_order)
         VALUES (?, ?, ?)`,
        [matchId, questionIds[i], i + 1]
      );
    }
  },

  async getQuestions(matchId: number): Promise<MatchQuestion[]> {
    const [rows] = await pool.query(
      `SELECT * FROM match_questions
       WHERE match_id = ?
       ORDER BY question_order ASC`,
      [matchId]
    );
    return rows as MatchQuestion[];
  },

  async endSession(matchId: number, timeSpent: number): Promise<void> {
    await pool.query(
      `UPDATE matches
       SET status = 'COMPLETED',
           ended_at = NOW(),
           time_spent = ?
       WHERE id = ?`,
      [timeSpent, matchId]
    );
  },

  async updateScore(matchId: number, score: number): Promise<void> {
    await pool.query(
      `UPDATE matches
       SET total_score = total_score + ?
       WHERE id = ?`,
      [score, matchId]
    );
  },
};
