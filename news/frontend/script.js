/**
 * NeuralPress — Frontend Logic
 * Handles UI interaction, API calls, and article rendering.
 */

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';
const PAGE_SIZE = 9;

// ─── State ────────────────────────────────────────────────────────────────────
let state = {
  category:    'general',
  query:       '',
  page:        1,
  aiEnabled:   false,
  lastTotal:   0,
  isLoading:   false,
  lastRetryFn: null,
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const chipRow      = document.getElementById('chipRow');
const searchInput  = document.getElementById('searchInput');
const searchBtn    = document.getElementById('searchBtn');
const aiToggle     = document.getElementById('aiToggle');
const articlesGrid = document.getElementById('articlesGrid');
const skeleton     = document.getElementById('skeleton');
const errorState   = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const emptyState   = document.getElementById('emptyState');
const loadMoreWrap = document.getElementById('loadMoreWrap');
const loadMoreBtn  = document.getElementById('loadMoreBtn');
const resultsHeader= document.getElementById('resultsHeader');
const resultsTitle = document.getElementById('resultsTitle');
const resultsCount = document.getElementById('resultsCount');
const retryBtn     = document.getElementById('retryBtn');
const template     = document.getElementById('articleTemplate');

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchNews(true);
});

// ─── Event Listeners ──────────────────────────────────────────────────────────
chipRow.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  state.category = chip.dataset.cat;
  state.query    = '';
  searchInput.value = '';
  resetAndFetch();
});

searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });

aiToggle.addEventListener('change', () => {
  state.aiEnabled = aiToggle.checked;
  resetAndFetch();
});

loadMoreBtn.addEventListener('click', () => {
  state.page++;
  fetchNews(false);
});

retryBtn.addEventListener('click', () => {
  if (state.lastRetryFn) state.lastRetryFn();
});

// ─── Core Fetch ───────────────────────────────────────────────────────────────
async function fetchNews(fresh = true) {
  if (state.isLoading) return;
  state.isLoading = true;

  if (fresh) {
    articlesGrid.innerHTML = '';
    showSkeleton(true);
    hideError();
    hideEmpty();
    loadMoreWrap.style.display = 'none';
    resultsHeader.style.display = 'none';
  } else {
    loadMoreBtn.textContent = 'Loading…';
    loadMoreBtn.disabled = true;
  }

  const params = new URLSearchParams({
    category: state.category,
    page:     state.page,
    pageSize: PAGE_SIZE,
    ai:       state.aiEnabled,
  });
  if (state.query) params.set('q', state.query);

  try {
    const res  = await fetch(`${API_BASE}/news?${params}`);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.error || 'Unknown error');

    state.lastTotal = data.total;
    renderArticles(data.articles, fresh);
    updateResultsHeader(data);
    updateLoadMore(data.articles.length);

  } catch (err) {
    console.error('[frontend] Fetch error:', err);
    if (fresh) showError(err.message, () => fetchNews(true));
  } finally {
    state.isLoading = false;
    showSkeleton(false);
    loadMoreBtn.textContent = 'Load More Stories';
    loadMoreBtn.disabled = false;
  }
}

function resetAndFetch() {
  state.page = 1;
  fetchNews(true);
}

function handleSearch() {
  const q = searchInput.value.trim();
  state.query    = q;
  state.category = q ? '' : state.category;
  resetAndFetch();
}

// ─── Rendering ────────────────────────────────────────────────────────────────
function renderArticles(articles, fresh) {
  if (fresh && articles.length === 0) {
    showEmpty();
    return;
  }

  articles.forEach((article, i) => {
    const card = buildCard(article, i);
    articlesGrid.appendChild(card);
  });
}

function buildCard(article, index) {
  const clone = template.content.cloneNode(true);
  const card  = clone.querySelector('.article-card');
  const link  = clone.querySelector('.card-link');
  const img   = clone.querySelector('.card-img');
  const source= clone.querySelector('.card-source');
  const date  = clone.querySelector('.card-date');
  const title = clone.querySelector('.card-title');
  const desc  = clone.querySelector('.card-desc');
  const badge = clone.querySelector('.ai-score-badge');

  link.href = article.url || '#';
  source.textContent = article.source || 'Unknown';
  date.textContent   = formatDate(article.publishedAt);
  title.textContent  = article.title || 'Untitled';
  desc.textContent   = article.description || '';

  if (state.aiEnabled) badge.style.display = 'inline';

  if (article.imageUrl) {
    img.src = article.imageUrl;
    img.alt = article.title;
    img.addEventListener('load',  () => img.classList.add('loaded'));
    img.addEventListener('error', () => img.classList.add('errored'));
  } else {
    img.classList.add('errored');
  }

  return clone;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function showSkeleton(visible) {
  skeleton.style.display = visible ? 'grid' : 'none';
}

function showError(msg, retryFn) {
  errorMessage.textContent = msg;
  errorState.style.display = 'block';
  state.lastRetryFn = retryFn;
}

function hideError() { errorState.style.display = 'none'; }

function showEmpty() { emptyState.style.display = 'block'; }
function hideEmpty() { emptyState.style.display = 'none'; }

function updateResultsHeader(data) {
  const label = state.query
    ? `"${state.query}"`
    : capitalize(state.category || 'All');

  resultsTitle.textContent  = `${label} News`;
  resultsCount.textContent  = `${data.total} article${data.total !== 1 ? 's' : ''} found`;
  resultsHeader.style.display = 'flex';
}

function updateLoadMore(count) {
  if (count >= PAGE_SIZE) {
    loadMoreWrap.style.display = 'block';
  } else {
    loadMoreWrap.style.display = 'none';
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(new Date(iso));
  } catch { return ''; }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
