"""
ai-service/app.py
─────────────────────────────────────────────────────────────────
AI Ranking Service for NeuralPress
Receives a list of news articles and returns them ranked by
relevance to the user's interests using a lightweight TF-IDF
approach (or the saved PyTorch model if available).
─────────────────────────────────────────────────────────────────
"""

import os
import json
import logging
from typing import List, Dict, Any

from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Optional heavy deps (graceful fallback if not installed) ──────────────────
try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

# ── App setup ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("ai-service")

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pt")

# ── Optional: load PyTorch model ──────────────────────────────────────────────
pytorch_model = None

if TORCH_AVAILABLE and os.path.exists(MODEL_PATH):
    try:
        pytorch_model = torch.load(MODEL_PATH, map_location="cpu")
        pytorch_model.eval()
        log.info("✅  PyTorch model loaded from model.pt")
    except Exception as e:
        log.warning(f"⚠️  Could not load model.pt: {e}. Falling back to TF-IDF.")

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "torch_available": TORCH_AVAILABLE,
        "sklearn_available": SKLEARN_AVAILABLE,
        "model_loaded": pytorch_model is not None,
    })


@app.post("/rank")
def rank_articles():
    """
    POST /rank
    Body: { "articles": [...], "interests": "technology AI startups" }
    Returns: { "ranked": [...] }
    Articles are ranked by relevance to the supplied interest string.
    """
    body = request.get_json(silent=True) or {}
    articles: List[Dict[str, Any]] = body.get("articles", [])
    interests: str = body.get("interests", "")

    if not articles:
        return jsonify({"error": "No articles provided"}), 400

    try:
        if pytorch_model is not None:
            ranked = _rank_with_pytorch(articles, interests)
        elif SKLEARN_AVAILABLE:
            ranked = _rank_with_tfidf(articles, interests)
        else:
            ranked = _rank_fallback(articles)

        return jsonify({"ranked": ranked, "method": _detect_method()})

    except Exception as e:
        log.error(f"Ranking error: {e}")
        return jsonify({"error": str(e)}), 500


# ── Ranking strategies ────────────────────────────────────────────────────────

def _rank_with_tfidf(
    articles: List[Dict], interests: str
) -> List[Dict]:
    """TF-IDF cosine similarity ranking."""
    corpus = [
        f"{a.get('title', '')} {a.get('description', '')}"
        for a in articles
    ]
    query = interests if interests.strip() else "news"

    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform([query] + corpus)

    query_vec   = tfidf_matrix[0]
    article_vecs= tfidf_matrix[1:]

    scores = cosine_similarity(query_vec, article_vecs).flatten()

    scored = sorted(
        zip(scores, articles),
        key=lambda x: x[0],
        reverse=True
    )
    return [dict(article, _score=float(score)) for score, article in scored]


def _rank_with_pytorch(
    articles: List[Dict], interests: str
) -> List[Dict]:
    """
    Stub — feed article embeddings through your trained model.
    Replace this with real inference logic matching your model.pt architecture.
    """
    log.info("Running PyTorch model inference…")
    # Placeholder: just return articles in original order tagged with model flag
    return [dict(a, _model="pytorch") for a in articles]


def _rank_fallback(articles: List[Dict]) -> List[Dict]:
    """Return articles sorted by publish date (newest first) when no ML available."""
    log.warning("No ML backend available — sorting by date.")
    return sorted(
        articles,
        key=lambda a: a.get("publishedAt", ""),
        reverse=True,
    )


def _detect_method() -> str:
    if pytorch_model is not None:
        return "pytorch"
    if SKLEARN_AVAILABLE:
        return "tfidf"
    return "date_sort"


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    log.info(f"🤖  AI Service starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
