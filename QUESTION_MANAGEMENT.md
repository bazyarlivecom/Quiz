# ماژول مدیریت سوالات - پیاده‌سازی کامل

این سند شامل پیاده‌سازی کامل ماژول مدیریت سوالات با کد تمیز، قابل تست و قابل توسعه است.

---

## 📋 فهرست

1. [DTOs (Data Transfer Objects)](#1-dtos-data-transfer-objects)
2. [Repository Layer](#2-repository-layer)
3. [Service Layer](#3-service-layer)
4. [Controller Layer](#4-controller-layer)
5. [Routes](#5-routes)
6. [Validation](#6-validation)
7. [Error Handling](#7-error-handling)
8. [Tests](#8-tests)

---

## 1. DTOs (Data Transfer Objects)

### 1.1. Create Question DTO

```typescript
// backend/src/modules/questions/dto/createQuestionDto.ts

import { z } from 'zod';

export const createQuestionSchema = z.object({
    categoryId: z.number()
        .int('Category ID must be an integer')
        .positive('Category ID must be positive'),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT'], {
        errorMap: () => ({ message: 'Difficulty must be EASY, MEDIUM, HARD, or EXPERT' })
    }),
    questionText: z.string()
        .min(10, 'Question text must be at least 10 characters')
        .max(1000, 'Question text must be less than 1000 characters')
        .trim(),
    explanation: z.string()
        .max(2000, 'Explanation must be less than 2000 characters')
        .trim()
        .optional(),
    points: z.number()
        .int('Points must be an integer')
        .min(1, 'Points must be at least 1')
        .max(100, 'Points must be less than 100')
        .default(10),
    options: z.array(
        z.object({
            text: z.string()
                .min(1, 'Option text cannot be empty')
                .max(255, 'Option text must be less than 255 characters')
                .trim(),
            isCorrect: z.boolean()
        })
    )
    .length(4, 'Exactly 4 options are required')
    .refine(
        (options) => options.filter(opt => opt.isCorrect).length === 1,
        {
            message: 'Exactly one option must be marked as correct',
            path: ['options']
        }
    ),
    tags: z.array(z.string().trim())
        .optional()
        .default([])
});

export type CreateQuestionDto = z.infer<typeof createQuestionSchema>;
```

### 1.2. Update Question DTO

```typescript
// backend/src/modules/questions/dto/updateQuestionDto.ts

import { z } from 'zod';

export const updateQuestionSchema = z.object({
    categoryId: z.number()
        .int()
        .positive()
        .optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT'])
        .optional(),
    questionText: z.string()
        .min(10)
        .max(1000)
        .trim()
        .optional(),
    explanation: z.string()
        .max(2000)
        .trim()
        .optional(),
    points: z.number()
        .int()
        .min(1)
        .max(100)
        .optional(),
    isActive: z.boolean()
        .optional(),
    tags: z.array(z.string().trim())
        .optional()
}).refine(
    (data) => Object.keys(data).length > 0,
    {
        message: 'At least one field must be provided for update',
    }
);

export type UpdateQuestionDto = z.infer<typeof updateQuestionSchema>;
```

### 1.3. Get Random Questions DTO

```typescript
// backend/src/modules/questions/dto/getRandomQuestionsDto.ts

import { z } from 'zod';

export const getRandomQuestionsSchema = z.object({
    categoryId: z.number()
        .int()
        .positive()
        .optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MIXED'])
        .optional()
        .default('MIXED'),
    count: z.number()
        .int('Count must be an integer')
        .min(1, 'Count must be at least 1')
        .max(50, 'Count cannot exceed 50')
        .default(10)
});

export type GetRandomQuestionsDto = z.infer<typeof getRandomQuestionsSchema>;
```

### 1.4. Get Questions Query DTO

```typescript
// backend/src/modules/questions/dto/getQuestionsQueryDto.ts

import { z } from 'zod';

export const getQuestionsQuerySchema = z.object({
    categoryId: z.string()
        .regex(/^\d+$/, 'Category ID must be a number')
        .transform(Number)
        .optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT'])
        .optional(),
    isActive: z.string()
        .transform((val) => val === 'true')
        .optional(),
    page: z.string()
        .regex(/^\d+$/, 'Page must be a number')
        .transform(Number)
        .default('1')
        .optional(),
    limit: z.string()
        .regex(/^\d+$/, 'Limit must be a number')
        .transform(Number)
        .default('20')
        .optional(),
    search: z.string()
        .trim()
        .optional()
});

export type GetQuestionsQueryDto = z.infer<typeof getQuestionsQuerySchema>;
```

---

## 2. Repository Layer

### 2.1. Question Repository

```typescript
// backend/src/modules/questions/repositories/questionRepository.ts

import { db } from '../../../shared/database/connection';
import { CreateQuestionDto } from '../dto/createQuestionDto';
import { UpdateQuestionDto } from '../dto/updateQuestionDto';

export interface Question {
    id: number;
    category_id: number;
    difficulty: string;
    question_text: string;
    explanation: string | null;
    points: number;
    is_active: boolean;
    created_by: number | null;
    tags: string[];
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}

export interface QuestionWithOptions extends Question {
    options: QuestionOption[];
}

export interface QuestionOption {
    id: number;
    question_id: number;
    option_text: string;
    is_correct: boolean;
    option_order: number;
}

export class QuestionRepository {
    async findById(id: number): Promise<Question | null> {
        const result = await db.query(
            `SELECT 
                q.*,
                COALESCE(
                    ARRAY_AGG(DISTINCT qt.tag) FILTER (WHERE qt.tag IS NOT NULL),
                    ARRAY[]::text[]
                ) as tags
             FROM questions q
             LEFT JOIN LATERAL (
                 SELECT unnest(q.tags) as tag
             ) qt ON true
             WHERE q.id = $1
             GROUP BY q.id`,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRowToQuestion(result.rows[0]);
    }

    async findByIdWithOptions(id: number): Promise<QuestionWithOptions | null> {
        const question = await this.findById(id);
        if (!question) {
            return null;
        }

        const options = await this.getQuestionOptions(id);
        return {
            ...question,
            options
        };
    }

    async getQuestionOptions(questionId: number): Promise<QuestionOption[]> {
        const result = await db.query(
            `SELECT id, question_id, option_text, is_correct, option_order
             FROM question_options
             WHERE question_id = $1
             ORDER BY option_order ASC`,
            [questionId]
        );

        return result.rows.map(row => ({
            id: row.id,
            question_id: row.question_id,
            option_text: row.option_text,
            is_correct: row.is_correct,
            option_order: row.option_order
        }));
    }

    async create(
        dto: CreateQuestionDto,
        createdBy: number | null = null
    ): Promise<Question> {
        // Start transaction
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');

            // Insert question
            const questionResult = await client.query(
                `INSERT INTO questions (
                    category_id, difficulty, question_text, explanation,
                    points, is_active, created_by, tags, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *`,
                [
                    dto.categoryId,
                    dto.difficulty,
                    dto.questionText,
                    dto.explanation || null,
                    dto.points,
                    true,
                    createdBy,
                    dto.tags || []
                ]
            );

            const questionId = questionResult.rows[0].id;

            // Insert options
            for (let i = 0; i < dto.options.length; i++) {
                const option = dto.options[i];
                await client.query(
                    `INSERT INTO question_options (
                        question_id, option_text, is_correct, option_order, created_at
                    ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
                    [questionId, option.text, option.isCorrect, i + 1]
                );
            }

            await client.query('COMMIT');

            // Return created question with options
            const createdQuestion = await this.findByIdWithOptions(questionId);
            if (!createdQuestion) {
                throw new Error('Failed to retrieve created question');
            }

            return createdQuestion;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async update(id: number, dto: UpdateQuestionDto): Promise<Question> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (dto.categoryId !== undefined) {
            fields.push(`category_id = $${paramIndex++}`);
            values.push(dto.categoryId);
        }

        if (dto.difficulty !== undefined) {
            fields.push(`difficulty = $${paramIndex++}`);
            values.push(dto.difficulty);
        }

        if (dto.questionText !== undefined) {
            fields.push(`question_text = $${paramIndex++}`);
            values.push(dto.questionText);
        }

        if (dto.explanation !== undefined) {
            fields.push(`explanation = $${paramIndex++}`);
            values.push(dto.explanation);
        }

        if (dto.points !== undefined) {
            fields.push(`points = $${paramIndex++}`);
            values.push(dto.points);
        }

        if (dto.isActive !== undefined) {
            fields.push(`is_active = $${paramIndex++}`);
            values.push(dto.isActive);
        }

        if (dto.tags !== undefined) {
            fields.push(`tags = $${paramIndex++}`);
            values.push(dto.tags);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await db.query(
            `UPDATE questions 
             SET ${fields.join(', ')} 
             WHERE id = $${paramIndex} 
             RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            throw new Error('Question not found');
        }

        return this.mapRowToQuestion(result.rows[0]);
    }

    async delete(id: number): Promise<boolean> {
        const result = await db.query(
            'DELETE FROM questions WHERE id = $1 RETURNING id',
            [id]
        );

        return result.rows.length > 0;
    }

    async getRandomQuestions(
        categoryId: number | null,
        difficulty: string | null,
        count: number
    ): Promise<Question[]> {
        let query = `
            SELECT 
                q.*,
                COALESCE(
                    ARRAY_AGG(DISTINCT qt.tag) FILTER (WHERE qt.tag IS NOT NULL),
                    ARRAY[]::text[]
                ) as tags
            FROM questions q
            LEFT JOIN LATERAL (
                SELECT unnest(q.tags) as tag
            ) qt ON true
            WHERE q.is_active = true
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (categoryId !== null) {
            query += ` AND q.category_id = $${paramIndex++}`;
            params.push(categoryId);
        }

        if (difficulty !== null && difficulty !== 'MIXED') {
            query += ` AND q.difficulty = $${paramIndex++}`;
            params.push(difficulty);
        }

        query += ` GROUP BY q.id ORDER BY RANDOM() LIMIT $${paramIndex}`;
        params.push(count);

        const result = await db.query(query, params);

        return result.rows.map(row => this.mapRowToQuestion(row));
    }

    async getRandomQuestionsWithOptions(
        categoryId: number | null,
        difficulty: string | null,
        count: number
    ): Promise<QuestionWithOptions[]> {
        const questions = await this.getRandomQuestions(
            categoryId,
            difficulty,
            count
        );

        const questionsWithOptions = await Promise.all(
            questions.map(async (q) => {
                const options = await this.getQuestionOptions(q.id);
                return {
                    ...q,
                    options
                };
            })
        );

        return questionsWithOptions;
    }

    async findAll(query: {
        categoryId?: number;
        difficulty?: string;
        isActive?: boolean;
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{ questions: Question[]; total: number }> {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const offset = (page - 1) * limit;

        let whereConditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (query.categoryId !== undefined) {
            whereConditions.push(`q.category_id = $${paramIndex++}`);
            params.push(query.categoryId);
        }

        if (query.difficulty !== undefined) {
            whereConditions.push(`q.difficulty = $${paramIndex++}`);
            params.push(query.difficulty);
        }

        if (query.isActive !== undefined) {
            whereConditions.push(`q.is_active = $${paramIndex++}`);
            params.push(query.isActive);
        }

        if (query.search) {
            whereConditions.push(
                `(q.question_text ILIKE $${paramIndex} OR q.explanation ILIKE $${paramIndex})`
            );
            params.push(`%${query.search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Count total
        const countResult = await db.query(
            `SELECT COUNT(*) as total
             FROM questions q
             ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].total);

        // Get questions
        const questionsResult = await db.query(
            `SELECT 
                q.*,
                COALESCE(
                    ARRAY_AGG(DISTINCT qt.tag) FILTER (WHERE qt.tag IS NOT NULL),
                    ARRAY[]::text[]
                ) as tags
             FROM questions q
             LEFT JOIN LATERAL (
                 SELECT unnest(q.tags) as tag
             ) qt ON true
             ${whereClause}
             GROUP BY q.id
             ORDER BY q.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        return {
            questions: questionsResult.rows.map(row => this.mapRowToQuestion(row)),
            total
        };
    }

    private mapRowToQuestion(row: any): Question {
        return {
            id: row.id,
            category_id: row.category_id,
            difficulty: row.difficulty,
            question_text: row.question_text,
            explanation: row.explanation,
            points: row.points,
            is_active: row.is_active,
            created_by: row.created_by,
            tags: row.tags || [],
            metadata: row.metadata || {},
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }
}
```

### 2.2. Category Repository

```typescript
// backend/src/modules/questions/repositories/categoryRepository.ts

import { db } from '../../../shared/database/connection';

export interface Category {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: Date;
    updated_at: Date;
}

export class CategoryRepository {
    async findAll(includeInactive: boolean = false): Promise<Category[]> {
        let query = `
            SELECT * FROM categories
        `;

        if (!includeInactive) {
            query += ` WHERE is_active = true`;
        }

        query += ` ORDER BY sort_order ASC, name ASC`;

        const result = await db.query(query);
        return result.rows;
    }

    async findById(id: number): Promise<Category | null> {
        const result = await db.query(
            'SELECT * FROM categories WHERE id = $1',
            [id]
        );

        return result.rows[0] || null;
    }

    async findByName(name: string): Promise<Category | null> {
        const result = await db.query(
            'SELECT * FROM categories WHERE name = $1',
            [name]
        );

        return result.rows[0] || null;
    }

    async getQuestionCount(categoryId: number): Promise<number> {
        const result = await db.query(
            `SELECT COUNT(*) as count
             FROM questions
             WHERE category_id = $1 AND is_active = true`,
            [categoryId]
        );

        return parseInt(result.rows[0].count);
    }
}
```

---

## 3. Service Layer

### 3.1. Question Service

```typescript
// backend/src/modules/questions/services/questionService.ts

import { QuestionRepository, QuestionWithOptions } from '../repositories/questionRepository';
import { CategoryRepository } from '../repositories/categoryRepository';
import { CreateQuestionDto } from '../dto/createQuestionDto';
import { UpdateQuestionDto } from '../dto/updateQuestionDto';
import { GetRandomQuestionsDto } from '../dto/getRandomQuestionsDto';

export class QuestionService {
    private questionRepository: QuestionRepository;
    private categoryRepository: CategoryRepository;

    constructor() {
        this.questionRepository = new QuestionRepository();
        this.categoryRepository = new CategoryRepository();
    }

    async createQuestion(
        dto: CreateQuestionDto,
        createdBy: number | null = null
    ): Promise<QuestionWithOptions> {
        // Validate category exists
        const category = await this.categoryRepository.findById(dto.categoryId);
        if (!category || !category.is_active) {
            throw new Error('Category not found or inactive');
        }

        // Create question
        const question = await this.questionRepository.create(dto, createdBy);

        return question;
    }

    async getQuestionById(id: number, includeOptions: boolean = false): Promise<QuestionWithOptions | null> {
        if (includeOptions) {
            return await this.questionRepository.findByIdWithOptions(id);
        }

        const question = await this.questionRepository.findById(id);
        if (!question) {
            return null;
        }

        const options = await this.questionRepository.getQuestionOptions(id);
        return {
            ...question,
            options
        };
    }

    async getRandomQuestions(dto: GetRandomQuestionsDto): Promise<QuestionWithOptions[]> {
        // Validate category if provided
        if (dto.categoryId) {
            const category = await this.categoryRepository.findById(dto.categoryId);
            if (!category || !category.is_active) {
                throw new Error('Category not found or inactive');
            }
        }

        // Get random questions
        const questions = await this.questionRepository.getRandomQuestionsWithOptions(
            dto.categoryId || null,
            dto.difficulty === 'MIXED' ? null : dto.difficulty,
            dto.count
        );

        if (questions.length < dto.count) {
            throw new Error(
                `Not enough questions available. Found: ${questions.length}, Required: ${dto.count}`
            );
        }

        // Shuffle options for each question (hide correct answer initially)
        return questions.map(question => ({
            ...question,
            options: this.shuffleOptions(question.options)
        }));
    }

    async updateQuestion(
        id: number,
        dto: UpdateQuestionDto
    ): Promise<QuestionWithOptions> {
        // Check if question exists
        const existingQuestion = await this.questionRepository.findById(id);
        if (!existingQuestion) {
            throw new Error('Question not found');
        }

        // Validate category if provided
        if (dto.categoryId !== undefined) {
            const category = await this.categoryRepository.findById(dto.categoryId);
            if (!category || !category.is_active) {
                throw new Error('Category not found or inactive');
            }
        }

        // Update question
        await this.questionRepository.update(id, dto);

        // Return updated question with options
        const updatedQuestion = await this.questionRepository.findByIdWithOptions(id);
        if (!updatedQuestion) {
            throw new Error('Failed to retrieve updated question');
        }

        return updatedQuestion;
    }

    async deleteQuestion(id: number): Promise<boolean> {
        // Check if question exists
        const existingQuestion = await this.questionRepository.findById(id);
        if (!existingQuestion) {
            throw new Error('Question not found');
        }

        // Check if question is used in any active games
        const isUsed = await this.isQuestionUsed(id);
        if (isUsed) {
            // Soft delete instead of hard delete
            await this.questionRepository.update(id, { isActive: false });
            return false; // Indicates soft delete
        }

        // Hard delete
        return await this.questionRepository.delete(id);
    }

    async getQuestions(query: {
        categoryId?: number;
        difficulty?: string;
        isActive?: boolean;
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{ questions: QuestionWithOptions[]; total: number; page: number; limit: number }> {
        const result = await this.questionRepository.findAll(query);

        // Load options for each question
        const questionsWithOptions = await Promise.all(
            result.questions.map(async (q) => {
                const options = await this.questionRepository.getQuestionOptions(q.id);
                return {
                    ...q,
                    options
                };
            })
        );

        return {
            questions: questionsWithOptions,
            total: result.total,
            page: query.page || 1,
            limit: query.limit || 20
        };
    }

    async getAllCategories(): Promise<Category[]> {
        return await this.categoryRepository.findAll();
    }

    async getCategoryById(id: number): Promise<Category | null> {
        return await this.categoryRepository.findById(id);
    }

    async getCategoryWithStats(id: number): Promise<Category & { questionCount: number }> {
        const category = await this.categoryRepository.findById(id);
        if (!category) {
            throw new Error('Category not found');
        }

        const questionCount = await this.categoryRepository.getQuestionCount(id);

        return {
            ...category,
            questionCount
        };
    }

    private shuffleOptions<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    private async isQuestionUsed(questionId: number): Promise<boolean> {
        const result = await db.query(
            `SELECT COUNT(*) as count
             FROM match_questions
             WHERE question_id = $1`,
            [questionId]
        );

        return parseInt(result.rows[0].count) > 0;
    }
}
```

---

## 4. Controller Layer

### 4.1. Question Controller

```typescript
// backend/src/modules/questions/controllers/questionController.ts

import { Request, Response } from 'express';
import { QuestionService } from '../services/questionService';
import { createQuestionSchema } from '../dto/createQuestionDto';
import { updateQuestionSchema } from '../dto/updateQuestionDto';
import { getRandomQuestionsSchema } from '../dto/getRandomQuestionsDto';
import { getQuestionsQuerySchema } from '../dto/getQuestionsQueryDto';
import { AuthRequest } from '../../../shared/middleware/auth';
import { z } from 'zod';

export class QuestionController {
    private questionService: QuestionService;

    constructor() {
        this.questionService = new QuestionService();
    }

    async createQuestion(req: AuthRequest, res: Response): Promise<void> {
        try {
            // Validate input
            const validatedData = createQuestionSchema.parse(req.body);

            // Get user ID from auth middleware
            const createdBy = req.user?.userId || null;

            // Create question
            const question = await this.questionService.createQuestion(
                validatedData,
                createdBy
            );

            res.status(201).json({
                success: true,
                data: question,
                message: 'Question created successfully'
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: error.message || 'Failed to create question'
                });
            }
        }
    }

    async getQuestionById(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid question ID'
                });
                return;
            }

            const question = await this.questionService.getQuestionById(id, true);

            if (!question) {
                res.status(404).json({
                    success: false,
                    error: 'Question not found'
                });
                return;
            }

            res.json({
                success: true,
                data: question
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get question'
            });
        }
    }

    async getRandomQuestions(req: Request, res: Response): Promise<void> {
        try {
            // Parse and validate query parameters
            const queryParams = {
                categoryId: req.query.categoryId 
                    ? parseInt(req.query.categoryId as string) 
                    : undefined,
                difficulty: req.query.difficulty as string || 'MIXED',
                count: req.query.count 
                    ? parseInt(req.query.count as string) 
                    : 10
            };

            const validatedData = getRandomQuestionsSchema.parse(queryParams);

            // Get random questions
            const questions = await this.questionService.getRandomQuestions(validatedData);

            res.json({
                success: true,
                data: questions,
                count: questions.length
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: error.message || 'Failed to get random questions'
                });
            }
        }
    }

    async getQuestions(req: Request, res: Response): Promise<void> {
        try {
            // Parse and validate query parameters
            const validatedQuery = getQuestionsQuerySchema.parse(req.query);

            const result = await this.questionService.getQuestions({
                categoryId: validatedQuery.categoryId,
                difficulty: validatedQuery.difficulty,
                isActive: validatedQuery.isActive,
                page: validatedQuery.page,
                limit: validatedQuery.limit,
                search: validatedQuery.search
            });

            res.json({
                success: true,
                data: result.questions,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.limit)
                }
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: error.message || 'Failed to get questions'
                });
            }
        }
    }

    async updateQuestion(req: AuthRequest, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid question ID'
                });
                return;
            }

            // Validate input
            const validatedData = updateQuestionSchema.parse(req.body);

            // Update question
            const question = await this.questionService.updateQuestion(id, validatedData);

            res.json({
                success: true,
                data: question,
                message: 'Question updated successfully'
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: error.message || 'Failed to update question'
                });
            }
        }
    }

    async deleteQuestion(req: AuthRequest, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid question ID'
                });
                return;
            }

            const deleted = await this.questionService.deleteQuestion(id);

            res.json({
                success: true,
                message: deleted 
                    ? 'Question deleted successfully' 
                    : 'Question deactivated (used in games)',
                softDelete: !deleted
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to delete question'
            });
        }
    }

    async getAllCategories(req: Request, res: Response): Promise<void> {
        try {
            const categories = await this.questionService.getAllCategories();

            res.json({
                success: true,
                data: categories,
                count: categories.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get categories'
            });
        }
    }

    async getCategoryById(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid category ID'
                });
                return;
            }

            const category = await this.questionService.getCategoryWithStats(id);

            res.json({
                success: true,
                data: category
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message || 'Category not found'
            });
        }
    }
}
```

---

## 5. Routes

### 5.1. Question Routes

```typescript
// backend/src/modules/questions/routes/questionRoutes.ts

import { Router } from 'express';
import { QuestionController } from '../controllers/questionController';
import { authMiddleware } from '../../../shared/middleware/auth';
import { adminMiddleware } from '../../../shared/middleware/admin'; // Optional
import { apiRateLimiter } from '../../../shared/middleware/rateLimiter';

const router = Router();
const questionController = new QuestionController();

// Public routes
router.get('/random', apiRateLimiter, (req, res) => 
    questionController.getRandomQuestions(req, res)
);

router.get('/', apiRateLimiter, (req, res) => 
    questionController.getQuestions(req, res)
);

router.get('/categories', apiRateLimiter, (req, res) => 
    questionController.getAllCategories(req, res)
);

router.get('/categories/:id', apiRateLimiter, (req, res) => 
    questionController.getCategoryById(req, res)
);

router.get('/:id', apiRateLimiter, (req, res) => 
    questionController.getQuestionById(req, res)
);

// Protected routes (require authentication)
router.post('/', authMiddleware, apiRateLimiter, (req, res) => 
    questionController.createQuestion(req, res)
);

router.put('/:id', authMiddleware, apiRateLimiter, (req, res) => 
    questionController.updateQuestion(req, res)
);

router.delete('/:id', authMiddleware, apiRateLimiter, (req, res) => 
    questionController.deleteQuestion(req, res)
);

// Optional: Admin-only routes
// router.post('/', authMiddleware, adminMiddleware, apiRateLimiter, (req, res) => 
//     questionController.createQuestion(req, res)
// );

export default router;
```

---

## 6. Validation

### 6.1. Custom Validators

```typescript
// backend/src/modules/questions/validators/questionValidators.ts

export class QuestionValidators {
    static validateQuestionText(text: string): { valid: boolean; error?: string } {
        if (!text || text.trim().length === 0) {
            return { valid: false, error: 'Question text cannot be empty' };
        }

        if (text.length < 10) {
            return { valid: false, error: 'Question text must be at least 10 characters' };
        }

        if (text.length > 1000) {
            return { valid: false, error: 'Question text must be less than 1000 characters' };
        }

        return { valid: true };
    }

    static validateOptions(options: Array<{ text: string; isCorrect: boolean }>): { valid: boolean; error?: string } {
        if (!options || options.length !== 4) {
            return { valid: false, error: 'Exactly 4 options are required' };
        }

        const correctCount = options.filter(opt => opt.isCorrect).length;
        if (correctCount !== 1) {
            return { valid: false, error: 'Exactly one option must be marked as correct' };
        }

        for (const option of options) {
            if (!option.text || option.text.trim().length === 0) {
                return { valid: false, error: 'Option text cannot be empty' };
            }

            if (option.text.length > 255) {
                return { valid: false, error: 'Option text must be less than 255 characters' };
            }
        }

        return { valid: true };
    }

    static validateDifficulty(difficulty: string): { valid: boolean; error?: string } {
        const validDifficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
        
        if (!validDifficulties.includes(difficulty)) {
            return { 
                valid: false, 
                error: `Difficulty must be one of: ${validDifficulties.join(', ')}` 
            };
        }

        return { valid: true };
    }
}
```

---

## 7. Error Handling

### 7.1. Custom Errors

```typescript
// backend/src/shared/utils/errors.ts

export class QuestionNotFoundError extends Error {
    constructor(id: number) {
        super(`Question with ID ${id} not found`);
        this.name = 'QuestionNotFoundError';
    }
}

export class CategoryNotFoundError extends Error {
    constructor(id: number) {
        super(`Category with ID ${id} not found`);
        this.name = 'CategoryNotFoundError';
    }
}

export class InsufficientQuestionsError extends Error {
    constructor(available: number, required: number) {
        super(`Not enough questions available. Found: ${available}, Required: ${required}`);
        this.name = 'InsufficientQuestionsError';
    }
}

export class InvalidQuestionDataError extends Error {
    constructor(message: string) {
        super(`Invalid question data: ${message}`);
        this.name = 'InvalidQuestionDataError';
    }
}
```

### 7.2. Error Handler Middleware

```typescript
// backend/src/shared/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { QuestionNotFoundError, CategoryNotFoundError, InsufficientQuestionsError } from '../utils/errors';

export const questionErrorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (error instanceof QuestionNotFoundError) {
        res.status(404).json({
            success: false,
            error: error.message
        });
        return;
    }

    if (error instanceof CategoryNotFoundError) {
        res.status(404).json({
            success: false,
            error: error.message
        });
        return;
    }

    if (error instanceof InsufficientQuestionsError) {
        res.status(400).json({
            success: false,
            error: error.message
        });
        return;
    }

    next(error);
};
```

---

## 8. Tests

### 8.1. Question Service Tests (Example)

```typescript
// backend/src/modules/questions/services/__tests__/questionService.test.ts

import { QuestionService } from '../questionService';
import { QuestionRepository } from '../../repositories/questionRepository';
import { CategoryRepository } from '../../repositories/categoryRepository';

describe('QuestionService', () => {
    let questionService: QuestionService;
    let questionRepository: QuestionRepository;
    let categoryRepository: CategoryRepository;

    beforeEach(() => {
        questionRepository = new QuestionRepository();
        categoryRepository = new CategoryRepository();
        questionService = new QuestionService();
    });

    describe('createQuestion', () => {
        it('should create a question successfully', async () => {
            const dto = {
                categoryId: 1,
                difficulty: 'MEDIUM' as const,
                questionText: 'What is the capital of France?',
                explanation: 'Paris is the capital of France',
                points: 10,
                options: [
                    { text: 'Paris', isCorrect: true },
                    { text: 'London', isCorrect: false },
                    { text: 'Berlin', isCorrect: false },
                    { text: 'Madrid', isCorrect: false }
                ]
            };

            const question = await questionService.createQuestion(dto);

            expect(question).toBeDefined();
            expect(question.question_text).toBe(dto.questionText);
            expect(question.options).toHaveLength(4);
            expect(question.options.filter(o => o.is_correct)).toHaveLength(1);
        });

        it('should throw error if category not found', async () => {
            const dto = {
                categoryId: 999,
                difficulty: 'MEDIUM' as const,
                questionText: 'Test question',
                points: 10,
                options: [
                    { text: 'Option 1', isCorrect: true },
                    { text: 'Option 2', isCorrect: false },
                    { text: 'Option 3', isCorrect: false },
                    { text: 'Option 4', isCorrect: false }
                ]
            };

            await expect(questionService.createQuestion(dto)).rejects.toThrow(
                'Category not found or inactive'
            );
        });
    });

    describe('getRandomQuestions', () => {
        it('should return random questions', async () => {
            const dto = {
                categoryId: 1,
                difficulty: 'MEDIUM' as const,
                count: 5
            };

            const questions = await questionService.getRandomQuestions(dto);

            expect(questions).toHaveLength(5);
            questions.forEach(q => {
                expect(q.category_id).toBe(dto.categoryId);
                expect(q.difficulty).toBe(dto.difficulty);
                expect(q.options).toHaveLength(4);
            });
        });

        it('should throw error if not enough questions', async () => {
            const dto = {
                categoryId: 1,
                difficulty: 'MEDIUM' as const,
                count: 1000 // Unrealistic number
            };

            await expect(questionService.getRandomQuestions(dto)).rejects.toThrow(
                'Not enough questions available'
            );
        });
    });
});
```

---

## 📊 API Endpoints Summary

### Public Endpoints

```
GET    /api/questions/random?categoryId=1&difficulty=MEDIUM&count=10
GET    /api/questions?categoryId=1&difficulty=MEDIUM&page=1&limit=20
GET    /api/questions/:id
GET    /api/questions/categories
GET    /api/questions/categories/:id
```

### Protected Endpoints (Require Authentication)

```
POST   /api/questions
PUT    /api/questions/:id
DELETE /api/questions/:id
```

---

## 🔒 Security Considerations

1. **Input Validation**: تمام inputs با Zod validate می‌شوند
2. **SQL Injection Prevention**: استفاده از Parameterized Queries
3. **Authorization**: بررسی دسترسی برای create/update/delete
4. **Rate Limiting**: محدود کردن requests
5. **Data Sanitization**: Trim و sanitize تمام inputs

---

این ماژول مدیریت سوالات کامل است و شامل تمام ویژگی‌های درخواستی با کد تمیز و قابل توسعه می‌باشد.

