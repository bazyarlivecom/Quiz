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
      .positive('Option ID must be positive'),
    timeTaken: z
      .number()
      .int('Time taken must be an integer')
      .min(0, 'Time taken cannot be negative')
      .max(35, 'Time taken exceeds maximum allowed time'),
  }),
});

export type SubmitAnswerDto = z.infer<typeof submitAnswerSchema>['body'];

