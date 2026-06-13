# AI Python LLM Resume & Portfolio Builder - Project Report

## Student Role

This project is prepared from the perspective of a student applying for an AICTE internship. The goal is to show practical use of Python backend development, LLM APIs, frontend development, prompt engineering, deployment readiness and responsible handling of API keys.

## Abstract

Students often have useful skills and projects but struggle to present them in a polished resume, cover letter and portfolio. Generic templates do not adapt to a student's target role or internship description. The AI Python LLM Resume & Portfolio Builder solves this by collecting student data and using large language models to create personalized career documents.

## Objectives

- Build a Python-based AI application for student career document generation.
- Generate resume, cover letter and portfolio content from one profile form.
- Tailor output to a target internship role and job description.
- Integrate Gemini API and Hugging Face model router options through a Python backend API.
- Provide a demo generator so the project can be presented without exposing real API keys.
- Prepare the application for deployment on platforms such as Render or Docker.

## Technologies Used

- HTML for structure
- CSS for responsive user interface
- JavaScript for form handling and frontend API calls
- Python backend for API routes and secure LLM provider calls
- Gemini LLM API for generative text output
- Hugging Face LLM models through the router endpoint for alternate model support
- Render and Docker files for deployment

## System Modules

1. Student Profile Module

Collects name, target role, education, skills, projects, achievements, links and internship description.

2. Prompt Engineering Module

Creates a structured prompt that asks the AI model to act as a career mentor for an Indian student applying through an AICTE-style portal.

3. Backend API Module

Provides `/api/health`, `/api/providers` and `/api/generate` using Python. It validates requests, builds prompts and returns structured generated documents.

4. AI Provider Module

Supports Gemini LLM API, Hugging Face LLM Router and local demo generation. API keys are loaded from environment variables.

5. Preview Module

Displays generated resume, cover letter and portfolio content in separate tabs.

6. AI Career Insights Module

Calculates an ATS readiness score, compares the generated content with internship description keywords, suggests resume improvements and creates interview preparation questions.

7. Export Module

Opens a clean print view so the student can save the generated output and AI insights as a PDF.

## Workflow

1. Student enters academic and project details.
2. Student selects the AI provider and output type.
3. The frontend sends the profile to the backend endpoint `/api/generate`.
4. The backend validates data and builds a tailored prompt.
5. The selected AI model generates professional content.
6. The student reviews the result in tabs.
7. The student reviews ATS score, keyword match, improvement tips and interview questions.
8. The student exports the final output as a PDF.

## Expected Output

- ATS-friendly resume
- Professional cover letter
- Portfolio page content
- ATS readiness score and keyword analysis
- AI-generated improvement tips and interview questions
- Internship-ready project explanation

## Security Considerations

The project does not hard-code API keys. The backend reads keys from `.env` locally or from deployment environment variables in production. The frontend never receives or stores real API keys.

## Deployment Readiness

The project includes `backend.py`, `requirements.txt`, `Procfile`, `render.yaml`, `Dockerfile`, `.env.example` and `DEPLOYMENT.md`. It can run locally with `python backend.py` and can be deployed as a Python web service.

## Future Enhancements

- Add multiple resume templates.
- Add authentication for student profiles.
- Add backend storage for generated documents.
- Add multilingual resume generation for regional students.

## Conclusion

The AI Python LLM Resume & Portfolio Builder is a practical generative AI project that directly addresses a real student problem. It demonstrates Python backend API development, Gemini LLM integration, Hugging Face LLM integration, prompt engineering, frontend design, deployment readiness and career-readiness impact, making it suitable for an AICTE internship project submission.
