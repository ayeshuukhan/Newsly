# Newsly — AI-Powered News Recommendation App

A full-stack web application that fetches news articles based on user interests and uses an AI model to personalise recommendations.

## Project Structure

```
news-ai-app/
├── backend/
│   ├── server.js                  
│   ├── routes/news.js            
│   ├── controllers/newsController.js  
│   ├── services/newsService.js   
│   ├── .env.example              
│   └── package.json
│
├── frontend/
│   ├── index.html                
│   ├── style.css                  
│   └── script.js               
│
├── ai-service/
│   ├── app.py                    
│   ├── requirements.txt           
│   └── MODEL_PLACEHOLDER.md      
│
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10

### 2. Backend

```bash
cd backend
cp .env.example .env

npm install
npm start        
```

Server runs at `http://localhost:5000`

---

### 3. Frontend

The frontend is served statically by the Express backend.
Open `http://localhost:5000` in your browser — no extra build step needed.

For standalone dev, open `frontend/index.html` directly in a browser.
> **Note:** update `API_BASE` in `script.js` if your backend runs on a different port.


### 4. AI Service (optional but recommended)

```bash
cd ai-service
python -m venv venv
source venv/bin/activate      

pip install -r requirements.txt
python app.py                
```


## API Reference

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

## AI Architecture

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


## License

MIT — feel free to fork and extend!

link : https://newsly-ecru.vercel.app/
