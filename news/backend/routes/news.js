const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

/**
 * GET /api/news
 * Query params:
 *   - category  (string)  e.g. "technology"
 *   - q         (string)  free-text search (optional)
 *   - page      (number)  pagination (default 1)
 *   - pageSize  (number)  articles per page (default 10, max 20)
 */
router.get('/', newsController.getNews);

/**
 * POST /api/news/rank
 * Body: { articles: [...], userHistory: [...] }
 * Forwards articles to AI service for personalized ranking.
 */
router.post('/rank', newsController.getRankedNews);

module.exports = router;
