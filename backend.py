import json
import os
import re
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
PORT = int(os.getenv("PORT", "5000"))
MAX_BODY_BYTES = 1_000_000
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
HF_MODEL = os.getenv("HF_MODEL", "google/gemma-2-2b-it:preferred")
GEMINI_FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]


def load_env_file():
    env_path = ROOT / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip().lstrip("\ufeff")
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_env_file()


class ResumeBuilderHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/health":
            return self.send_json(200, {"ok": True, "service": "AI Resume & Portfolio Builder", "backend": "Python LLM"})

        if parsed.path == "/api/providers":
            load_env_file()
            return self.send_json(
                200,
                {
                    "gemini": bool(os.getenv("GEMINI_API_KEY")),
                    "huggingface": bool(os.getenv("HF_TOKEN")),
                    "geminiModel": os.getenv("GEMINI_MODEL", GEMINI_MODEL),
                    "huggingFaceModel": os.getenv("HF_MODEL", HF_MODEL),
                },
            )

        return self.serve_static(parsed.path)

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path != "/api/generate":
            return self.send_json(404, {"error": "API route not found."})

        try:
            body = self.read_json()
            profile = sanitize_profile(body.get("profile", {}))
            provider = body.get("provider", "gemini")
            output_type = body.get("outputType", "all")
            tone = body.get("tone", "professional")

            validate_request(profile, output_type, tone)

            if provider == "gemini":
                raw = generate_with_gemini(profile, output_type, tone)
                provider_used = "gemini"
            elif provider == "huggingface":
                raw = generate_with_hugging_face(profile, output_type, tone)
                provider_used = "huggingface"
            elif provider == "demo":
                raw = generate_demo(profile, output_type, tone)
                provider_used = "demo"
            else:
                raise ValueError("Unsupported provider selected.")

            self.send_json(
                200,
                {
                    "providerUsed": provider_used,
                    "documents": normalize_documents(raw, profile, output_type, tone),
                },
            )
        except Exception as exc:
            self.send_json(400, {"error": str(exc)})

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > MAX_BODY_BYTES:
            raise ValueError("Request body is too large.")

        raw = self.rfile.read(length)
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def serve_static(self, request_path):
        safe_path = unquote(request_path)
        if safe_path == "/":
            safe_path = "/index.html"

        file_path = (ROOT / safe_path.lstrip("/")).resolve()
        if not str(file_path).startswith(str(ROOT)) or should_hide_file(file_path):
            return self.send_text(404, "Not found")

        if not file_path.exists() or not file_path.is_file():
            return self.send_text(404, "Not found")

        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        content = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def send_json(self, status, payload):
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def send_text(self, status, text):
        encoded = text.encode("utf-8")
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format_text, *args):
        print(f"{self.address_string()} - {format_text % args}")


def generate_with_gemini(profile, output_type, tone):
    load_env_file()
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", GEMINI_MODEL)
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing. Add it to .env or deployment environment variables, or choose Demo Generator.")

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": build_prompt(profile, output_type, tone)}],
            }
        ],
        "generationConfig": {
            "temperature": 0.45,
            "maxOutputTokens": 2400,
        },
    }

    last_error = None
    for model_name in unique_items([model, *GEMINI_FALLBACK_MODELS]):
        try:
            data = post_json(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent",
                payload,
                {
                    "Content-Type": "application/json",
                    "x-goog-api-key": api_key,
                },
            )
            break
        except ValueError as exc:
            last_error = exc
            if "HTTP 404" not in str(exc) and "not found" not in str(exc).lower():
                raise
    else:
        raise ValueError(f"Gemini generation failed for configured and fallback models: {last_error}") from last_error

    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "\n".join(part.get("text", "") for part in parts).strip()


def generate_with_hugging_face(profile, output_type, tone):
    token = os.getenv("HF_TOKEN")
    model = os.getenv("HF_MODEL", HF_MODEL)
    if not token:
        raise ValueError("HF_TOKEN is missing. Add it to .env or deployment environment variables.")

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You generate professional student career documents in clean Markdown.",
            },
            {
                "role": "user",
                "content": build_prompt(profile, output_type, tone),
            },
        ],
        "temperature": 0.45,
        "max_tokens": 2400,
    }

    data = post_json(
        "https://router.huggingface.co/v1/chat/completions",
        payload,
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
    )
    return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()


def post_json(url, payload, headers):
    encoded = json.dumps(payload).encode("utf-8")
    request = Request(url, data=encoded, headers=headers, method="POST")

    try:
        with urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        message = exc.read().decode("utf-8", errors="ignore")
        try:
            parsed = json.loads(message)
            message = parsed.get("error", {}).get("message") or parsed.get("error") or message
        except json.JSONDecodeError:
            pass
        raise ValueError(f"LLM API returned HTTP {exc.code}: {message}") from exc
    except URLError as exc:
        raise ValueError(f"Could not reach LLM API: {exc.reason}") from exc


def build_prompt(profile, output_type, tone):
    requested = "three separate sections: RESUME, COVER_LETTER, PORTFOLIO" if output_type == "all" else output_type.upper()
    return f"""Act as a career mentor helping an Indian student apply for internships through an AICTE-style portal.

Create {requested}.
Use a {tone} tone. Make the output ATS-friendly, honest, concise and tailored to the target role.
Highlight projects, measurable impact, skills, internship readiness and learning attitude.
Make the result impressive for a faculty mentor or internship reviewer by showing proof of work, clickable evidence links, AI/LLM relevance, deployment readiness and honest improvement areas.
ATS rules:
- Use plain Markdown only, with a single-column layout.
- Do not use tables, icons, graphics, text boxes, columns or decorative symbols.
- Use standard section headings that ATS parsers recognize.
- Put contact details in plain text below the candidate name.
- Mirror important job-description keywords only where they match the student profile.
- Prefer simple bullets that start with action verbs and include tools, scope and measurable outcomes where provided.
For the resume, use ATS-friendly sections in this order when data is available: Professional Summary, Education, Technical Skills, Internship Experience, Work Experience, Projects, Certifications, Achievements, Languages, Strengths.
For the cover letter, keep it to one page with a confident opening, one project proof paragraph, one learning/mentor-fit paragraph and a respectful close.
For the portfolio, create attractive page-ready Markdown with sections for Hero, Mentor Snapshot, About, Education and Grades, AI and LLM Focus, Featured Projects, Experience, Achievements, Certifications, Skills, Languages, Proof Links and Contact.
Write bullet points with action verbs, tools used and measurable impact where possible. Do not invent employers, GPA, CGPA, dates or certifications that are not provided.
Return Markdown only. Use headings exactly when possible: RESUME, COVER_LETTER, PORTFOLIO.

Student profile:
Name: {profile["fullName"]}
Target role: {profile["targetRole"]}
Email: {profile["email"]}
Phone: {profile["phone"]}
Location: {profile["location"]}
Links: {profile["links"]}
LinkedIn URL: {profile["linkedinUrl"]}
GitHub URL: {profile["githubUrl"]}
Portfolio URL: {profile["portfolioUrl"]}
Education: {profile["education"]}
GPA: {profile["gpa"]}
CGPA/Percentage: {profile["cgpa"]}
Graduation year: {profile["graduationYear"]}
Skills: {profile["skills"]}
Internships: {profile["internships"]}
Work experience: {profile["workExperience"]}
Projects: {profile["projects"]}
Project URLs: {profile["projectUrls"]}
Achievements: {profile["achievements"]}
Certifications: {profile["certifications"]}
Certification URLs: {profile["certificationUrls"]}
Languages: {profile["languages"]}
Strengths: {profile["strengths"]}
Job description: {profile["jobDescription"]}"""


def normalize_documents(raw, profile, output_type, tone):
    text = raw.strip() if isinstance(raw, str) else ""
    if not text:
        return documents_for_output(split_documents(generate_demo(profile, output_type, tone)), output_type)

    split = split_documents(text)
    if output_type == "resume" and not split["resume"]:
        split["resume"] = text
    elif output_type == "cover" and not split["cover"]:
        split["cover"] = text
    elif output_type == "portfolio" and not split["portfolio"]:
        split["portfolio"] = text
    elif output_type == "all":
        split["resume"] = split["resume"] or generate_demo_resume(profile, tone)
        split["cover"] = split["cover"] or generate_demo_cover(profile, tone)
        split["portfolio"] = split["portfolio"] or generate_demo_portfolio(profile, tone)

    return documents_for_output(split, output_type)


def documents_for_output(documents, output_type):
    if output_type == "all":
        return documents
    return {
        "resume": documents["resume"] if output_type == "resume" else "",
        "cover": documents["cover"] if output_type == "cover" else "",
        "portfolio": documents["portfolio"] if output_type == "portfolio" else "",
    }


def split_documents(markdown):
    sections = {"resume": "", "cover": "", "portfolio": ""}
    resume = re.search(r"(?:^|\n)#{0,3}\s*RESUME\s*\n([\s\S]*?)(?=\n#{0,3}\s*COVER_LETTER|\n#{0,3}\s*COVER LETTER|\n#{0,3}\s*PORTFOLIO|$)", markdown, re.I)
    cover = re.search(r"(?:^|\n)#{0,3}\s*COVER[_ ]LETTER\s*\n([\s\S]*?)(?=\n#{0,3}\s*RESUME|\n#{0,3}\s*PORTFOLIO|$)", markdown, re.I)
    portfolio = re.search(r"(?:^|\n)#{0,3}\s*PORTFOLIO\s*\n([\s\S]*?)(?=\n#{0,3}\s*RESUME|\n#{0,3}\s*COVER[_ ]LETTER|$)", markdown, re.I)

    sections["resume"] = resume.group(1).strip() if resume else ""
    sections["cover"] = cover.group(1).strip() if cover else ""
    sections["portfolio"] = portfolio.group(1).strip() if portfolio else ""

    if not any(sections.values()):
        sections["resume"] = markdown.strip()
    return sections


def generate_demo(profile, output_type, tone):
    docs = {
        "resume": generate_demo_resume(profile, tone),
        "cover": generate_demo_cover(profile, tone),
        "portfolio": generate_demo_portfolio(profile, tone),
    }
    if output_type == "resume":
        return f"RESUME\n{docs['resume']}"
    if output_type == "cover":
        return f"COVER_LETTER\n{docs['cover']}"
    if output_type == "portfolio":
        return f"PORTFOLIO\n{docs['portfolio']}"
    return f"RESUME\n{docs['resume']}\n\nCOVER_LETTER\n{docs['cover']}\n\nPORTFOLIO\n{docs['portfolio']}"


def generate_demo_resume(profile, tone):
    key_skills = ", ".join(split_items(profile["skills"])[:6])
    academic_details = " | ".join(
        detail for detail in [profile["education"], profile["gpa"], profile["cgpa"], profile["graduationYear"]] if detail
    )
    keyword_line = build_keyword_line(profile)
    return f"""# {profile["fullName"]}
{profile["targetRole"]} | {profile["email"]} | {profile["phone"]} | {profile["location"]}
{build_contact_links(profile)}

## Professional Summary
{tone.title()} {profile["targetRole"]} candidate with a strong foundation in {key_skills or "student projects and technical learning"}. Experienced in building academic and internship-ready projects, documenting work clearly and applying role-specific tools from the job description. Prepared to contribute to real tasks, learn quickly, use AI responsibly and collaborate with mentors.

## Mentor Snapshot
- Built an AI-powered career document generator with resume, cover letter, portfolio, ATS scoring and interview preparation.
- Demonstrates practical LLM API integration, prompt engineering, frontend quality, backend deployment readiness and evidence-based project presentation.
- Uses clickable proof links so mentors can verify projects, certificates and profiles quickly.

## Education
{academic_details or "Add degree, college, GPA, CGPA or percentage and graduation year."}

## Technical Skills
{profile["skills"]}

## Target Keywords
{keyword_line}

## Internship Experience
{to_ats_bullet_list(profile["internships"], "Supported internship tasks involving")}

## Work Experience
{to_ats_bullet_list(profile["workExperience"], "Delivered project work involving")}

## Projects
{to_ats_bullet_list(profile["projects"], "Built")}

## Project Links
{to_markdown_link_list(profile["projectUrls"])}

## Certifications
{to_bullet_list(profile["certifications"])}

## Certification Links
{to_markdown_link_list(profile["certificationUrls"])}

## Achievements
{to_bullet_list(profile["achievements"])}

## Languages
{to_bullet_list(profile["languages"])}

## Strengths
{to_bullet_list(profile["strengths"])}

## Internship Fit
- Can build AI-enabled student productivity tools using modern APIs.
- Understands documentation, prompt design, user interface flow and project presentation.
- Prepared to learn quickly, accept mentor feedback and collaborate in an AICTE internship environment."""


def generate_demo_cover(profile, tone):
    return f"""# Cover Letter

Dear Hiring Team,

I am applying for the {profile["targetRole"]} opportunity through the AICTE internship pathway. My academic background in {profile["education"] or "computer science"} and my hands-on work with {profile["skills"] or "AI and web technologies"} make me excited to contribute to practical, student-focused AI solutions.

My strongest project is an AI Resume & Portfolio Builder that transforms one student profile into a tailored resume, cover letter and mentor-ready portfolio. While building it, I practiced LLM API integration, prompt engineering, ATS keyword analysis, JavaScript UI design, Python backend development and deployment-friendly project structure.

My experience includes {profile["internships"] or profile["workExperience"] or "academic and project-based learning"}, supported by certifications such as {profile["certifications"] or "relevant technical coursework"}. I also maintain proof links for review: {build_contact_links(profile)}.

I would value the opportunity to learn from mentors, improve this solution further, document my work clearly and contribute responsibly to real internship goals.

Sincerely,
{profile["fullName"]}"""


def generate_demo_portfolio(profile, tone):
    return f"""# Portfolio Page Content

## Hero
{profile["fullName"]} - {profile["targetRole"]}

Building practical AI, Python and LLM tools that help students present their skills with clarity, evidence and mentor-ready project storytelling.

## Mentor Snapshot
- Target role: {profile["targetRole"] or "Add target role."}
- Academic standing: {profile["education"] or "Add education."} | {profile["cgpa"] or profile["gpa"] or "Add grade."}
- Project proof: {first_available_link(profile["projectUrls"], profile["githubUrl"], profile["portfolioUrl"])}
- Best value: Converts a single student profile into ATS-ready documents, clickable portfolio content and interview preparation.

## About
I am a {tone} student interested in generative AI, Python development, LLM APIs and career technology. I enjoy converting real student problems into simple working products.

## Education and Grades
{profile["education"] or "Add education details."}
{profile["gpa"] or profile["cgpa"] or "Add GPA, CGPA or percentage."}
{profile["graduationYear"] or "Add graduation year."}

## Featured Projects
{to_portfolio_project_list(profile)}

## Experience
{to_bullet_list(profile["internships"] or profile["workExperience"])}

## Skills Snapshot
{profile["skills"]}

## AI and LLM Focus
- Prompt engineering for role-specific career documents and mentor review.
- LLM API integration through a protected Python backend using environment variables.
- ATS keyword matching, resume scoring, correction suggestions and interview preparation questions.
- Responsible AI habit: keep claims truthful, avoid fake achievements and tie every statement to real project evidence.

## Achievements
{to_bullet_list(profile["achievements"])}

## Certifications
{to_bullet_list(profile["certifications"])}

## Certificate Links
{to_markdown_link_list(profile["certificationUrls"])}

## Languages
{to_bullet_list(profile["languages"])}

## Project and Profile URLs
{to_markdown_link_list(profile["projectUrls"])}
{to_markdown_link_list(build_contact_links(profile))}

## Mentor Review Highlights
- Evidence-first layout with clickable project, certificate, GitHub, LinkedIn and portfolio URLs.
- Clear sections for education, grades, skills, experience, achievements and languages.
- AI/LLM focus is visible without hiding the student's academic foundation.
- Deployment-friendly project structure using standard Python backend and static frontend files.

## Contact
{profile["email"]} | {profile["phone"]} | {build_contact_links(profile)}"""


def to_bullet_list(text):
    items = [item.strip() for item in re.split(r"[\n.;]+", text or "") if item.strip()]
    return "\n".join(f"- {item}" for item in items) if items else "- Add details here."


def build_contact_links(profile):
    links = [
        format_named_url("LinkedIn", profile["linkedinUrl"]),
        format_named_url("GitHub", profile["githubUrl"]),
        format_named_url("Portfolio", profile["portfolioUrl"]),
        profile["links"],
    ]
    return " | ".join(link for link in links if link)


def format_named_url(label, url):
    if not url:
        return ""
    return f"[{label}]({ensure_url(url)})"


def to_markdown_link_list(text):
    links = []
    for item in re.split(r"[\n|]+", text or ""):
        item = item.strip()
        if not item:
            continue
        existing_link = re.search(r"\[([^\]]+)\]\((https?://[^)]+)\)", item)
        if existing_link:
            links.append(f"- [{existing_link.group(1)}]({ensure_url(existing_link.group(2))})")
            continue
        url_match = re.search(r"https?://[^\s,|)]+", item)
        if not url_match:
            links.append(f"- {item}")
            continue
        url = url_match.group(0)
        label = item.replace(url, "").strip(" -:|") or url
        links.append(f"- [{label}]({ensure_url(url)})")
    return "\n".join(links) if links else "- Add verified URLs here."


def to_portfolio_project_list(profile):
    project_items = split_items(profile["projects"])
    url_items = to_markdown_link_list(profile["projectUrls"])
    bullets = []
    for project in project_items:
        bullets.append(f"- {project} | Focus: AI/LLM value, tools used, your contribution and measurable result.")
    if url_items and "Add verified URLs" not in url_items:
        bullets.append(url_items)
    return "\n".join(bullets) if bullets else "- Add projects with problem, tools, result and live URL."


def ensure_url(url):
    url = url.strip()
    if url.startswith(("http://", "https://")):
        return url
    return f"https://{url}"


def first_available_link(*values):
    for value in values:
        match = re.search(r"https?://[^\s,|)]+", value or "")
        if match:
            return match.group(0)
    return "Add project, GitHub or portfolio URL."


def to_ats_bullet_list(text, fallback_verb):
    action_verbs = {
        "built",
        "created",
        "developed",
        "implemented",
        "designed",
        "improved",
        "analyzed",
        "tested",
        "documented",
        "collaborated",
        "integrated",
        "delivered",
        "supported",
        "managed",
        "prepared",
    }
    bullets = []
    for item in split_items(text):
        first_word = re.sub(r"[^A-Za-z]", "", item.split(" ", 1)[0]).lower()
        if first_word in action_verbs:
            bullets.append(f"- {item}")
        else:
            bullets.append(f"- {fallback_verb} {item}")
    return "\n".join(bullets) if bullets else "- Add details here."


def split_items(text):
    return [item.strip() for item in re.split(r"[\n.;]+", text or "") if item.strip()]


def unique_items(items):
    unique = []
    for item in items:
        if item and item not in unique:
            unique.append(item)
    return unique


def build_keyword_line(profile):
    source = " ".join([profile["targetRole"], profile["skills"], profile["jobDescription"]])
    stop_words = {
        "and",
        "the",
        "for",
        "with",
        "from",
        "that",
        "this",
        "your",
        "you",
        "are",
        "will",
        "role",
        "work",
        "team",
        "student",
        "internship",
        "requiring",
        "required",
    }
    keywords = []
    for word in re.findall(r"[A-Za-z0-9+#.]{3,}", source.lower()):
        if word not in stop_words and word not in keywords:
            keywords.append(word)
    return ", ".join(keywords[:16]) if keywords else "Add role-specific keywords from the job description."


def sanitize_profile(profile):
    allowed = [
        "fullName",
        "targetRole",
        "email",
        "phone",
        "location",
        "linkedinUrl",
        "githubUrl",
        "portfolioUrl",
        "links",
        "education",
        "gpa",
        "cgpa",
        "graduationYear",
        "skills",
        "internships",
        "workExperience",
        "projects",
        "projectUrls",
        "achievements",
        "certifications",
        "certificationUrls",
        "languages",
        "strengths",
        "jobDescription",
    ]
    return {key: str(profile.get(key, "")).strip()[:3000] for key in allowed}


def validate_request(profile, output_type, tone):
    if not profile["fullName"] or not profile["targetRole"] or not profile["skills"] or not profile["projects"]:
        raise ValueError("Name, target role, skills and projects are required.")
    if output_type not in {"all", "resume", "cover", "portfolio"}:
        raise ValueError("Invalid output type.")
    if tone not in {"professional", "confident", "fresh graduate", "technical"}:
        raise ValueError("Invalid tone.")


def should_hide_file(file_path):
    hidden_names = {
        ".env",
        ".env.example",
        ".gitignore",
        "backend.py",
        "server.js",
        "package.json",
        "package-lock.json",
        "requirements.txt",
        "render.yaml",
        "Dockerfile",
        "Procfile",
    }
    return file_path.name.startswith(".") or file_path.name in hidden_names


def main():
    server = ThreadingHTTPServer(("0.0.0.0", PORT), ResumeBuilderHandler)
    print(f"AI Resume & Portfolio Builder Python backend running at http://localhost:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
