import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboardController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

router.get('/global', leaderboardController.getGlobal);
router.get('/my-rank', authenticate, leaderboardController.getUserRank);
router.get('/category/:categoryId', leaderboardController.getCategory);

export default router;



