import { z } from 'zod';

export const submitAnswerSchema = z.object({
  body: z.object({
    questionId: z
      .number()
      .int('Question ID must be an integer')
      .positive('Question ID must be positive'),
    selectedOptionId: z
      .number()
      .int('Option ID must be an integer')
      .refine((val) => val > 0 || val === -1, {
        message: 'Option ID must be positive or -1 for timeout',
      }),
    timeTaken: z
      .number()
      .int('Time taken must be an integer')
      .min(0, 'Time taken cannot be negative')
      .max(120, 'Time taken exceeds maximum allowed time'),
  }),
});

export type SubmitAnswerDto = z.infer<typeof submitAnswerSchema>['body'];

