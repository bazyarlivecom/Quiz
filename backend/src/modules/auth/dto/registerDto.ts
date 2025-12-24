import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .superRefine((password, ctx) => {
        const missingRequirements: string[] = [];

        // Check for lowercase letter
        if (!/[a-z]/.test(password)) {
          missingRequirements.push('lowercase letter');
        }

        // Check for uppercase letter
        if (!/[A-Z]/.test(password)) {
          missingRequirements.push('uppercase letter');
        }

        // Check for number
        if (!/\d/.test(password)) {
          missingRequirements.push('number');
        }

        // Check for special character
        if (!/[@$!%*?&]/.test(password)) {
          missingRequirements.push('special character (@, $, !, %, *, ?, &)');
        }

        // If there are missing requirements, add a single issue with all of them
        if (missingRequirements.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Password must contain at least one: ${missingRequirements.join(', ')}`,
            path: ['password'],
          });
        }
      }),
  }),
});

export type RegisterDto = z.infer<typeof registerSchema>['body'];

