const newsService = require('../services/newsService');
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * GET /api/news
 * Fetches news for a given category / query and optionally ranks via AI.
 */
exports.getNews = async (req, res) => {
  try {
    const {
      category = 'general',
      q = '',
      page = 1,
      pageSize = 10,
      ai = 'false',      // set to "true" to enable AI ranking
    } = req.query;

    // Validate pageSize
    const size = Math.min(parseInt(pageSize, 10) || 10, 20);
    const pg   = Math.max(parseInt(page, 10) || 1, 1);

    const articles = await newsService.fetchArticles({ category, q, page: pg, pageSize: size });

    // Optional AI ranking step
    if (ai === 'true' && articles.length > 0) {
      const ranked = await _rankWithAI(articles, req.query.interests || '');
      return res.json({ success: true, category, total: ranked.length, articles: ranked });
    }

    return res.json({ success: true, category, total: articles.length, articles });
  } catch (err) {
    console.error('[newsController] getNews error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/news/rank
 * Accepts a pre-fetched article list and user history, returns AI-ranked results.
 */
exports.getRankedNews = async (req, res) => {
  try {
    const { articles = [], userHistory = [] } = req.body;

    if (!Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ success: false, error: 'No articles provided.' });
    }

    const ranked = await _rankWithAI(articles, userHistory);
    return res.json({ success: true, total: ranked.length, articles: ranked });
  } catch (err) {
    console.error('[newsController] getRankedNews error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Private Helpers ──────────────────────────────────────────────────────────

async function _rankWithAI(articles, interests) {
  try {
    const { data } = await axios.post(
      `${AI_SERVICE_URL}/rank`,
      { articles, interests },
      { timeout: 5000 }
    );
    return data.ranked || articles;
  } catch {
    // AI service unavailable – return original order
    console.warn('[newsController] AI service unreachable. Returning unranked articles.');
    return articles;
  }
}
