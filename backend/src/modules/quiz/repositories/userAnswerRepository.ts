import { db } from '../../../shared/database/connection';

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

export class UserAnswerRepository {
  async create(answerData: {
    matchId: number;
    questionId: number;
    selectedOptionId: number | null;
    userAnswerText: string | null;
    isCorrect: boolean;
    timeTaken: number;
    pointsEarned: number;
  }): Promise<UserAnswer> {
    const result = await db.query(
      `INSERT INTO user_answers (
                match_id, question_id, selected_option_id, user_answer_text,
                is_correct, time_taken, points_earned, answered_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            RETURNING *`,
      [
        answerData.matchId,
        answerData.questionId,
        answerData.selectedOptionId,
        answerData.userAnswerText,
        answerData.isCorrect,
        answerData.timeTaken,
        answerData.pointsEarned,
      ]
    );
    return result.rows[0] as UserAnswer;
  }

  async findByMatchAndQuestion(matchId: number, questionId: number): Promise<UserAnswer | null> {
    const result = await db.query(
      'SELECT * FROM user_answers WHERE match_id = $1 AND question_id = $2',
      [matchId, questionId]
    );
    return result.rows[0] || null;
  }

  async getMatchAnswers(matchId: number): Promise<UserAnswer[]> {
    const result = await db.query(
      'SELECT * FROM user_answers WHERE match_id = $1 ORDER BY answered_at ASC',
      [matchId]
    );
    return result.rows as UserAnswer[];
  }

  async getAnswersForQuestion(matchId: number, questionId: number): Promise<UserAnswer[]> {
    const result = await db.query(
      'SELECT * FROM user_answers WHERE match_id = $1 AND question_id = $2',
      [matchId, questionId]
    );
    return result.rows as UserAnswer[];
  }
}

