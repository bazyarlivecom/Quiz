import { z } from 'zod';

export const startGameSchema = z.object({
  body: z
    .object({
      gameMode: z.enum(['SINGLE_PLAYER', 'MULTI_PLAYER', 'PRACTICE'], {
        errorMap: () => ({
          message: 'Game mode must be SINGLE_PLAYER, MULTI_PLAYER, or PRACTICE',
        }),
      }),
      categoryId: z
        .number()
        .int('Category ID must be an integer')
        .positive('Category ID must be positive')
        .optional(),
      difficulty: z
        .enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MIXED'])
        .optional()
        .default('MIXED'),
      questionsCount: z
        .number()
        .int('Questions count must be an integer')
        .min(1, 'Minimum 1 question required')
        .max(50, 'Maximum 50 questions allowed')
        .default(3),
      opponentUserId: z
        .number()
        .int('Opponent user ID must be an integer')
        .positive('Opponent user ID must be positive')
        .optional(),
    })
    .refine(
      (data) => {
        if (data.gameMode === 'MULTI_PLAYER' && !data.opponentUserId) {
          return false;
        }
        return true;
      },
      {
        message: 'Opponent user ID is required for multiplayer mode',
        path: ['opponentUserId'],
      }
    ),
});

export type StartGameDto = z.infer<typeof startGameSchema>['body'];

