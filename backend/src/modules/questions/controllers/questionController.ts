import { Request, Response, NextFunction } from 'express';
import { QuestionService } from '../services/questionService';
import { CategoryService } from '../services/categoryService';
import { sendSuccess } from '../../../shared/utils/response';

export class QuestionController {
  private questionService: QuestionService;
  private categoryService: CategoryService;

  constructor() {
    this.questionService = new QuestionService();
    this.categoryService = new CategoryService();
  }

  getRandomQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const questions = await this.questionService.getRandomQuestions(req.query as any);
      sendSuccess(res, questions);
    } catch (error) {
      next(error);
    }
  };

  getQuestionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const includeCorrectAnswer = req.query.includeCorrectAnswer === 'true';
      const question = await this.questionService.getQuestionById(id, includeCorrectAnswer);
      sendSuccess(res, question);
    } catch (error) {
      next(error);
    }
  };

  getQuestionsByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryId = parseInt(req.params.categoryId, 10);
      const questions = await this.questionService.getQuestionsByCategory(categoryId);
      sendSuccess(res, questions);
    } catch (error) {
      next(error);
    }
  };

  createQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const question = await this.questionService.createQuestion(req.body);
      sendSuccess(res, question, 'Question created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const question = await this.questionService.updateQuestion(id, req.body);
      sendSuccess(res, question, 'Question updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const hardDelete = req.query.hardDelete === 'true';
      await this.questionService.deleteQuestion(id, hardDelete);
      sendSuccess(res, null, 'Question deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.categoryService.getAllCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const category = await this.categoryService.getCategoryById(id);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  };
}

