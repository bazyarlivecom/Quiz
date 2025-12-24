import { Router } from 'express';
import { QuestionController } from '../controllers/questionController';
import { validate } from '../../../shared/middleware/validation';
import { authenticate } from '../../../shared/middleware/auth';
import { getRandomQuestionsSchema } from '../dto/getRandomQuestionsDto';

const router = Router();
const questionController = new QuestionController();

router.get('/random', validate(getRandomQuestionsSchema), questionController.getRandomQuestions);
router.get('/categories', questionController.getAllCategories);
router.get('/categories/:id', questionController.getCategoryById);
router.get('/category/:categoryId', questionController.getQuestionsByCategory);
router.get('/:id', questionController.getQuestionById);

router.post('/', authenticate, questionController.createQuestion);
router.put('/:id', authenticate, questionController.updateQuestion);
router.delete('/:id', authenticate, questionController.deleteQuestion);

export default router;

