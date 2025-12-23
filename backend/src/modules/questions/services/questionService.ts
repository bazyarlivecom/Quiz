import { questionRepository, QuestionWithOptions } from '../repositories/questionRepository';
import { categoryRepository } from '../repositories/categoryRepository';
import { NotFoundError, ValidationError } from '../../../shared/utils/errors';

export const questionService = {
  async getRandomQuestions(
    categoryId: number | null,
    difficulty: string | null,
    count: number
  ): Promise<QuestionWithOptions[]> {
    if (count <= 0 || count > 50) {
      throw new ValidationError('Question count must be between 1 and 50');
    }

    // Validate category if provided
    if (categoryId !== null) {
      const category = await categoryRepository.findById(categoryId);
      if (!category) {
        throw new NotFoundError('Category');
      }
    }

    const questions = await questionRepository.getQuestionsWithOptions(
      categoryId,
      difficulty,
      count
    );

    if (questions.length < count) {
      throw new ValidationError(
        `Not enough questions available. Found: ${questions.length}, Required: ${count}`
      );
    }

    return questions;
  },

  async getQuestionById(id: number): Promise<QuestionWithOptions> {
    const question = await questionRepository.findById(id);
    if (!question) {
      throw new NotFoundError('Question');
    }

    const options = await questionRepository.getOptions(id);
    const publicOptions = options
      .map((opt) => ({
        id: opt.id,
        option_text: opt.option_text,
        option_order: opt.option_order,
      }))
      .sort(() => Math.random() - 0.5);

    return {
      ...question,
      options: publicOptions,
    };
  },

  async getAllCategories() {
    return categoryRepository.findAll();
  },
};

