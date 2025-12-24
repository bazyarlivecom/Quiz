import { QuestionRepository, QuestionWithOptions } from '../repositories/questionRepository';
import { CategoryRepository } from '../repositories/categoryRepository';
import { NotFoundError } from '../../../shared/utils/errors';
import { GetRandomQuestionsDto } from '../dto/getRandomQuestionsDto';

export class QuestionService {
  private questionRepository: QuestionRepository;
  private categoryRepository: CategoryRepository;

  constructor() {
    this.questionRepository = new QuestionRepository();
    this.categoryRepository = new CategoryRepository();
  }

  async getRandomQuestions(dto: GetRandomQuestionsDto): Promise<QuestionWithOptions[]> {
    const questions = await this.questionRepository.findRandom(
      dto.categoryId || null,
      dto.difficulty === 'MIXED' ? null : dto.difficulty,
      dto.count
    );

    if (questions.length < dto.count) {
      throw new NotFoundError(
        `Not enough questions available. Found: ${questions.length}, Required: ${dto.count}`
      );
    }

    const questionsWithOptions: QuestionWithOptions[] = [];

    for (const question of questions) {
      const questionWithOptions = await this.questionRepository.findById(question.id, true);
      if (questionWithOptions) {
        questionsWithOptions.push(questionWithOptions);
      }
    }

    return questionsWithOptions;
  }

  async getQuestionById(id: number, includeCorrectAnswer: boolean = false): Promise<QuestionWithOptions | null> {
    return this.questionRepository.findById(id, true);
  }

  async getQuestionsByCategory(categoryId: number): Promise<QuestionWithOptions[]> {
    const questions = await this.questionRepository.findByCategory(categoryId);
    const questionsWithOptions: QuestionWithOptions[] = [];

    for (const question of questions) {
      const questionWithOptions = await this.questionRepository.findById(question.id, true);
      if (questionWithOptions) {
        questionsWithOptions.push(questionWithOptions);
      }
    }

    return questionsWithOptions;
  }

  async createQuestion(questionData: {
    categoryId: number;
    difficulty: string;
    questionText: string;
    explanation?: string;
    points: number;
    options: Array<{ text: string; isCorrect: boolean }>;
  }): Promise<QuestionWithOptions> {
    const category = await this.categoryRepository.findById(questionData.categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return this.questionRepository.create(questionData);
  }

  async updateQuestion(id: number, updates: Partial<QuestionWithOptions>): Promise<QuestionWithOptions> {
    const question = await this.questionRepository.findById(id);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    await this.questionRepository.update(id, updates);
    const updated = await this.questionRepository.findById(id, true);
    if (!updated) {
      throw new NotFoundError('Question not found after update');
    }

    return updated;
  }

  async deleteQuestion(id: number, hardDelete: boolean = false): Promise<void> {
    const question = await this.questionRepository.findById(id);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    if (hardDelete) {
      await this.questionRepository.hardDelete(id);
    } else {
      await this.questionRepository.delete(id);
    }
  }
}

