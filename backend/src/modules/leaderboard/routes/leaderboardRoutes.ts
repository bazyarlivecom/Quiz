import { Router } from 'express';
import { LeaderboardController } from '../controllers/leaderboardController';

const router = Router();
const leaderboardController = new LeaderboardController();

router.get('/global', leaderboardController.getGlobalLeaderboard);
router.get('/weekly', leaderboardController.getWeeklyLeaderboard);
router.get('/category/:categoryId', leaderboardController.getCategoryLeaderboard);
router.get('/user/:userId/rank', leaderboardController.getUserRank);

export default router;

