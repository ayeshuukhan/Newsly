const axios = require('axios');

const NEWS_API_KEY  = process.env.NEWS_API_KEY  || 'YOUR_NEWSAPI_KEY_HERE';
const NEWS_API_BASE = 'https://newsapi.org/v2';

/**
 * Fetches and normalises articles from NewsAPI.
 *
 * @param {object} opts
 * @param {string} opts.category  - news category (general|business|technology|...)
 * @param {string} opts.q         - optional free-text search string
 * @param {number} opts.page      - page number (1-based)
 * @param {number} opts.pageSize  - articles per page (max 20)
 * @returns {Promise<Article[]>}
 */
exports.fetchArticles = async ({ category = 'general', q = '', page = 1, pageSize = 10 }) => {
  // Choose endpoint based on whether the user supplied a search term
  const endpoint = q ? `${NEWS_API_BASE}/everything` : `${NEWS_API_BASE}/top-headlines`;

  const params = q
    ? { q, language: 'en', sortBy: 'publishedAt', page, pageSize, apiKey: NEWS_API_KEY }
    : { category, language: 'en', page, pageSize, apiKey: NEWS_API_KEY };

  let raw = [];

  try {
    const { data } = await axios.get(endpoint, { params, timeout: 8000 });
    if (data.status !== 'ok') throw new Error(data.message || 'NewsAPI error');
    raw = data.articles || [];
  } catch (err) {
    // Fallback to mock data when API key is missing or quota exceeded
    console.warn('[newsService] NewsAPI unavailable – using mock data:', err.message);
    raw = _getMockArticles(category);
  }

  return raw
    .filter(a => a.title && a.title !== '[Removed]')
    .map(_normalise);
};

// ─── Private Helpers ──────────────────────────────────────────────────────────

function _normalise(article) {
  return {
    id:          article.url,
    title:       article.title         || 'Untitled',
    description: article.description   || 'No description available.',
    url:         article.url           || '#',
    imageUrl:    article.urlToImage    || null,
    source:      article.source?.name  || 'Unknown',
    publishedAt: article.publishedAt   || new Date().toISOString(),
    author:      article.author        || null,
  };
}

function _getMockArticles(category) {
  const templates = [
    { title: `Top ${category} story of the day`, description: 'A fascinating development in this field.' },
    { title: `Breaking: Major ${category} update`,     description: 'Experts weigh in on recent changes.' },
    { title: `How ${category} is changing in 2025`,    description: 'An in-depth look at current trends.' },
    { title: `The future of ${category}`,              description: 'What analysts predict for the coming year.' },
    { title: `${category} weekly roundup`,             description: 'Everything you need to know this week.' },
    { title: `5 things driving ${category} forward`,  description: 'Innovation continues at a rapid pace.' },
  ];

  return templates.map((t, i) => ({
    title:       t.title,
    description: t.description,
    url:         `https://example.com/${category}/${i + 1}`,
    urlToImage:  `https://picsum.photos/seed/${category}${i}/600/400`,
    source:      { name: 'Mock News Network' },
    publishedAt: new Date(Date.now() - i * 3_600_000).toISOString(),
    author:      'Editorial Team',
  }));
}
