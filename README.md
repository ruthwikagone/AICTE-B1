# AI Python LLM Resume & Portfolio Builder

An AICTE internship-ready full-stack project that uses a Python backend and LLM APIs to generate a tailored resume, cover letter and portfolio page from one student profile form.

## Problem Statement

Many students struggle to present their skills and projects in a professional format. Generic templates do not highlight individual strengths. This project uses generative AI and LLM APIs to convert student data into role-specific career documents that improve internship and job readiness.

## Features

- Student profile form for education, skills, projects, achievements and target role.
- Python backend API that protects API keys.
- Gemini LLM API integration through Python.
- Hugging Face LLM router integration through Python.
- Demo generator that works without any API key for presentations.
- Smart role presets for AI/ML, data analyst, web developer and cybersecurity internships.
- Live ML-style profile quality dashboard for completeness, skills, projects and keywords.
- Resume, cover letter and portfolio preview tabs.
- PDF export through the browser print flow and copy-to-clipboard for each generated tab.
- ATS readiness score based on resume completeness and internship keyword fit.
- Keyword match analysis against the job or internship description.
- AI improvement tips, skill gap roadmap, project recommendations and interview preparation questions.
- Gemini model fallback support for stronger API reliability when a configured model is unavailable.
- Render, Docker and Procfile deployment support.

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Python `http.server`
- LLM APIs: Google Gemini API and Hugging Face Inference Providers Router
- Deployment: Render, Docker or any Python hosting platform

## Folder Structure

```text
index.html          Frontend UI
styles.css          Frontend styling
app.js              Frontend API calls and preview logic
backend.py          Python backend and LLM API integration
.env.example        Environment variable template
requirements.txt    Python dependency file
render.yaml         Render deployment config
Dockerfile          Docker deployment config
Procfile            Platform start command
DEPLOYMENT.md       Step-by-step deployment guide
PROJECT_REPORT.md   AICTE-style project report
```

## How To Run Locally

1. Install Python 3.10 or newer.
2. Copy `.env.example` to `.env`.
3. Add your API keys in `.env`.

```text
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
HF_TOKEN=your_hugging_face_token_here
```

4. Start the Python backend.

```bash
python backend.py
```

If `python` does not work on Windows, try:

```bash
py backend.py
```

5. Open:

```text
http://localhost:5000
```

## API Routes

```text
GET  /api/health
GET  /api/providers
POST /api/generate
```

The frontend calls `/api/generate`. The Python backend then calls Gemini or Hugging Face using environment variables.

## Deployment

See `DEPLOYMENT.md`.

Recommended easiest deployment: Render Web Service.

```text
Build Command: pip install -r requirements.txt
Start Command: python backend.py
```

Add these environment variables on Render:

```text
GEMINI_API_KEY
GEMINI_MODEL
HF_TOKEN
HF_MODEL
```

## Security Note

Real API keys are not stored in frontend code. They are read from `.env` locally or from deployment environment variables in production.

## Project Impact

The project supports students who need professional career documents but may not know how to write them. It makes resume creation faster, more personalized and easier to align with internship descriptions while demonstrating Python backend development and LLM integration.
