import { pool } from '../../../shared/database/connection';

export interface UserAnswer {
  id: number;
  match_id: number;
  question_id: number;
  selected_option_id: number | null;
  user_answer_text: string | null;
  is_correct: boolean;
  time_taken: number;
  points_earned: number;
  answered_at: Date;
}

export const quizAnswerRepository = {
  async create(answerData: {
    match_id: number;
    question_id: number;
    selected_option_id: number | null;
    user_answer_text: string | null;
    is_correct: boolean;
    time_taken: number;
    points_earned: number;
  }): Promise<UserAnswer> {
    const [result] = await pool.query(
      `INSERT INTO user_answers (
        match_id, question_id, selected_option_id, user_answer_text,
        is_correct, time_taken, points_earned, answered_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        answerData.match_id,
        answerData.question_id,
        answerData.selected_option_id,
        answerData.user_answer_text,
        answerData.is_correct,
        answerData.time_taken,
        answerData.points_earned,
      ]
    ) as any;

    const [rows] = await pool.query(
      'SELECT * FROM user_answers WHERE id = ?',
      [result.insertId]
    );
    return (rows as UserAnswer[])[0];
  },

  async findByMatchAndQuestion(
    matchId: number,
    questionId: number
  ): Promise<UserAnswer | null> {
    const [rows] = await pool.query(
      `SELECT * FROM user_answers
       WHERE match_id = ? AND question_id = ?`,
      [matchId, questionId]
    );
    return (rows as UserAnswer[])[0] || null;
  },

  async getAnswersByMatch(matchId: number): Promise<UserAnswer[]> {
    const [rows] = await pool.query(
      `SELECT * FROM user_answers
       WHERE match_id = ?
       ORDER BY answered_at ASC`,
      [matchId]
    );
    return rows as UserAnswer[];
  },
};
