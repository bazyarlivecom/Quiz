import { z } from 'zod';

export const createQuestionSchema = z.object({
  body: z.object({
    categoryId: z
      .number()
      .int('Category ID must be an integer')
      .positive('Category ID must be positive'),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT'], {
      errorMap: () => ({ message: 'Difficulty must be EASY, MEDIUM, HARD, or EXPERT' }),
    }),
    questionText: z
      .string()
      .min(10, 'Question text must be at least 10 characters')
      .max(1000, 'Question text must be less than 1000 characters')
      .trim(),
    explanation: z
      .string()
      .max(2000, 'Explanation must be less than 2000 characters')
      .trim()
      .optional(),
    points: z
      .number()
      .int('Points must be an integer')
      .min(1, 'Points must be at least 1')
      .max(100, 'Points must be less than 100')
      .default(10),
    options: z
      .array(
        z.object({
          text: z
            .string()
            .min(1, 'Option text cannot be empty')
            .max(255, 'Option text must be less than 255 characters')
            .trim(),
          isCorrect: z.boolean(),
        })
      )
      .length(4, 'Exactly 4 options are required')
      .refine(
        (options) => options.filter((opt) => opt.isCorrect).length === 1,
        {
          message: 'Exactly one option must be marked as correct',
          path: ['options'],
        }
      ),
  }),
});

export type CreateQuestionDto = z.infer<typeof createQuestionSchema>['body'];

