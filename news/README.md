# ⬡ NeuralPress — AI-Powered News Recommendation App

A full-stack web application that fetches news articles based on user interests and uses an AI model to personalise recommendations.

---

## 🗂 Project Structure

```
news-ai-app/
├── backend/
│   ├── server.js                  # Express entry point
│   ├── routes/news.js             # API route definitions
│   ├── controllers/newsController.js  # Request handling logic
│   ├── services/newsService.js    # External NewsAPI integration
│   ├── .env.example               # Environment variable template
│   └── package.json
│
├── frontend/
│   ├── index.html                 # Main UI
│   ├── style.css                  # Editorial dark theme
│   └── script.js                  # Fetch + render logic
│
├── ai-service/
│   ├── app.py                     # Flask AI ranking service
│   ├── requirements.txt           # Python dependencies
│   └── MODEL_PLACEHOLDER.md      # Instructions for model.pt
│
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10
- A free [NewsAPI](https://newsapi.org/register) key

---

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set NEWS_API_KEY=your_key_here

npm install
npm start          # or: npm run dev  (with hot-reload via nodemon)
```

Server runs at `http://localhost:5000`

---

### 3. Frontend

The frontend is served statically by the Express backend.
Open `http://localhost:5000` in your browser — no extra build step needed.

For standalone dev, open `frontend/index.html` directly in a browser.
> **Note:** update `API_BASE` in `script.js` if your backend runs on a different port.

---

### 4. AI Service (optional but recommended)

```bash
cd ai-service
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

pip install -r requirements.txt
python app.py                 # runs on http://localhost:8000
```

Set `AI_SERVICE_URL=http://localhost:8000` in `backend/.env`.

---

## 🔌 API Reference

### `GET /api/news`

| Param      | Type    | Default     | Description                            |
|------------|---------|-------------|----------------------------------------|
| `category` | string  | `general`   | News category                          |
| `q`        | string  | —           | Free-text search term                  |
| `page`     | number  | `1`         | Page number                            |
| `pageSize` | number  | `10`        | Articles per page (max 20)             |
| `ai`       | boolean | `false`     | Enable AI ranking via Python service   |

**Response:**
```json
{
  "success": true,
  "category": "technology",
  "total": 9,
  "articles": [
    {
      "id": "https://...",
      "title": "...",
      "description": "...",
      "url": "https://...",
      "imageUrl": "https://...",
      "source": "BBC News",
      "publishedAt": "2025-01-01T12:00:00Z",
      "author": "Jane Doe"
    }
  ]
}
```

### `POST /api/news/rank`

```json
{
  "articles": [...],
  "userHistory": ["technology", "AI", "startups"]
}
```

Forwards articles to the AI service and returns a ranked list.

### `GET /api/health`
Returns server status and timestamp.

---

## 🤖 AI Architecture

```
User selects "Technology + AI Ranking ON"
         │
         ▼
  script.js  →  GET /api/news?category=technology&ai=true
         │
         ▼
  newsController  →  newsService  →  NewsAPI
         │
         ▼
  POST http://localhost:8000/rank  (Python AI service)
         │
    ┌────┴────┐
    │         │
  model.pt  TF-IDF fallback
    │         │
    └────┬────┘
         │ ranked articles
         ▼
  JSON response  →  frontend renders cards
```

### Ranking methods (in priority order)
1. **PyTorch model** (`model.pt`) — your custom trained model
2. **TF-IDF cosine similarity** (scikit-learn) — keyword-based ranking
3. **Date sort** — newest first, if no ML libs available

---

## 🌐 Environment Variables

| Variable           | Description                          | Default              |
|--------------------|--------------------------------------|----------------------|
| `PORT`             | Backend server port                  | `5000`               |
| `NEWS_API_KEY`     | NewsAPI.org API key                  | *(required)*         |
| `AI_SERVICE_URL`   | URL of the Python AI service         | `http://localhost:8000` |
| `FRONTEND_ORIGIN`  | CORS allowed origin                  | `*`                  |

---

## 🚀 Future Enhancements

- [ ] User accounts + preference persistence
- [ ] Fine-tuned sentence transformer model for deeper personalisation
- [ ] Redis caching layer to reduce NewsAPI quota usage
- [ ] WebSocket-based live news feed
- [ ] Browser extension using the `/api/news` endpoint
- [ ] Docker Compose setup for one-command deployment

---

## 📄 License

MIT — feel free to fork and extend!
