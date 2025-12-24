import { z } from 'zod';

export const getRandomQuestionsSchema = z.object({
  query: z.object({
    categoryId: z
      .string()
      .regex(/^\d+$/, 'Category ID must be a number')
      .transform((val) => parseInt(val, 10))
      .optional(),
    difficulty: z
      .enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MIXED'])
      .optional()
      .default('MIXED'),
    count: z
      .string()
      .regex(/^\d+$/, 'Count must be a number')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val >= 1 && val <= 50, {
        message: 'Count must be between 1 and 50',
      })
      .default('10'),
  }),
});

export type GetRandomQuestionsDto = z.infer<typeof getRandomQuestionsSchema>['query'];

