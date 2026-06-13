# Deployment Guide

## Local Run

1. Install Python 3.10 or newer.
2. Copy `.env.example` to `.env`.
3. Add at least one real key:

```text
GEMINI_API_KEY=your_key
HF_TOKEN=your_token
```

4. Start the Python backend:

```bash
python backend.py
```

On Windows, this may also work:

```bash
py backend.py
```

5. Open:

```text
http://localhost:5000
```

The frontend calls `/api/generate`, and the Python backend calls Gemini or Hugging Face.

## Deploy On Render

1. Push this folder to GitHub.
2. Open Render and create a new Web Service.
3. Select the GitHub repository.
4. Use these settings:

```text
Environment: Python
Build Command: pip install -r requirements.txt
Start Command: python backend.py
```

5. Add environment variables in Render:

```text
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
HF_TOKEN=your_hugging_face_token
HF_MODEL=google/gemma-2-2b-it:preferred
```

6. Deploy and open the Render URL.

## Deploy With Docker

Build:

```bash
docker build -t ai-python-llm-resume-builder .
```

Run:

```bash
docker run -p 5000:5000 --env-file .env ai-python-llm-resume-builder
```

## API Routes

```text
GET  /api/health
GET  /api/providers
POST /api/generate
```

Example request:

```json
{
  "provider": "gemini",
  "outputType": "all",
  "tone": "professional",
  "profile": {
    "fullName": "Ruthwika Sharma",
    "targetRole": "AI/ML Intern",
    "skills": "Python, Gemini API, Hugging Face, LLMs",
    "projects": "AI Python LLM Resume Builder using Gemini and Hugging Face APIs"
  }
}
```

## Security

Do not put real keys in frontend code. This project stores keys only in `.env` or deployment environment variables.
