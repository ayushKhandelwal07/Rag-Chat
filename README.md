## RAG Chat App 

### Overview
This app lets you upload a PDF and chat with its contents. It has:
- Backend: FastAPI (RAG pipeline + LLM call)
- Frontend: React (`frontend/`)

The frontend calls the backend via relative paths (`/api/upload`, `/api/chat`). In development, use a dev proxy or run them under the same origin.


### Environment Variables
Create a `.env` file for the backend so the LLM URL and key are available at runtime.

Location (recommended): `backend/.env`

Required keys:
```
OPENROUTER_API_KEY=your_api_key_here
```

Optional overrides (defaults are used if not set):
```
# If not set, code expects you to provide it; recommended value below
OPENROUTER_URL=https://openrouter.ai/api/v1/chat/completions

# If not set, backend uses whatever model you configured; recommended:
OPENROUTER_MODEL=openrouter/auto
```

Notes:
- The backend loads env via `python-dotenv`. Place `.env` in `backend/` if you start the server from the `backend` directory (recommended). If you start from project root, either export shell env vars or put a root-level `.env` and ensure your process loads it before starting the app.
- If `OPENROUTER_API_KEY` is missing, the LLM call will fail.

---

### Backend – Install & Run
From the project root:

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # Windows (Git Bash)
# source .venv/bin/activate    # macOS/Linux

pip install -r requirements.txt

# Ensure backend/.env exists as described above

# Start the API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:
```bash
curl http://localhost:8000/api/health
```

If you see `{ "status": "ok" }`, the backend is up.

---

### Frontend – Install & Run
From the project root:

```bash
cd frontend
npm install

npm run dev
# or
npm start     
```



### Troubleshooting
- Error: `LLM API error: Invalid type for url. Expected str or httpx.URL, got <class 'NoneType'>: None`
  - Cause: `OPENROUTER_URL` was not set and the process did not have a default.
  - Fix: Set `OPENROUTER_URL` in `backend/.env` as shown above, and ensure `OPENROUTER_API_KEY` is also set.

- Error: `CORS` blocked
  - Fix: Update allowed origins in `backend/app/main.py` to match your frontend dev URL, or configure a dev proxy.

- Frontend cannot reach `/api` in dev
  - Fix: Add a dev proxy in your frontend config to forward `/api` to `http://localhost:8000`.

---

### Project Structure (key paths)
```
backend/
  app/
    main.py               
    rag_service.py        
    ollama_client.py      
  requirements.txt
  .env                    # Place your LLM keys here (recommended)

frontend/
  src/
    PdfChat.jsx           
```

---


