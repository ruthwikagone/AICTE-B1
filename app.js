const fields = [
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
];

const sampleProfile = {
  fullName: "Riya Sharma",
  targetRole: "Generative AI Intern",
  email: "riya.sharma@example.com",
  phone: "+91 98765 43210",
  location: "Hyderabad, India",
  linkedinUrl: "https://linkedin.com/in/riya-sharma-ai",
  githubUrl: "https://github.com/riya-sharma-ai",
  portfolioUrl: "https://riya-sharma-ai.github.io/portfolio",
  links: "Kaggle - https://kaggle.com/riya-sharma-ai | LeetCode - https://leetcode.com/riya-sharma-ai",
  education: "B.Tech Computer Science Engineering, Anurag University, 3rd year",
  gpa: "3.7 / 4.0",
  cgpa: "8.8 CGPA",
  graduationYear: "2027",
  skills:
    "Python, Gemini API, Hugging Face Router, LLMs, prompt engineering, RAG basics, HTML, CSS, JavaScript, REST APIs, JSON, GitHub, scikit-learn, pandas, accessibility",
  internships:
    "AI Intern at Campus Innovation Lab - tested 25 prompt templates, documented API responses, compared Gemini and demo outputs, and improved generated resume quality using mentor feedback",
  workExperience:
    "Freelance Web Developer - built 4 responsive event pages using HTML, CSS and JavaScript; collaborated with classmates to collect requirements, fix mobile layout issues, and deliver updates within 48 hours",
  projects:
    "AI Resume & Portfolio Builder - built a Python backend that calls Gemini API and Hugging Face Router, generates ATS resumes, cover letters and portfolio pages, and scores keyword readiness; Mentor Portfolio Studio - designed a clickable student portfolio generator with project URLs, certificate links, grades, languages and achievements; Student Result Dashboard - created a responsive dashboard to visualize academic performance and identify subject-wise improvement areas; Smart Attendance Tracker - prototyped a web tool for attendance summaries with simple risk labels",
  projectUrls:
    "AI Resume & Portfolio Builder - https://github.com/riya-sharma-ai/ai-resume-builder\nLive Portfolio Demo - https://riya-sharma-ai.github.io/portfolio\nStudent Result Dashboard - https://github.com/riya-sharma-ai/result-dashboard",
  achievements:
    "AICTE internship project shortlisted for department demo day; Hackathon finalist for a student productivity tool; Presented AI resume builder workflow to 2 faculty mentors; Maintained 90%+ profile completeness across test student data",
  certifications: "Google AI Essentials, Python for Everybody, SQL Fundamentals, Introduction to Generative AI",
  certificationUrls:
    "Google AI Essentials - https://coursera.org/verify/mentor-demo\nGenerative AI Certificate - https://cloudskillsboost.google/public_profiles/demo",
  languages: "English, Hindi, Telugu",
  strengths: "Problem solving, teamwork, mentor feedback implementation, communication, documentation, fast learning, responsible AI awareness",
  jobDescription:
    "Generative AI internship requiring Python, LLM API integration, prompt engineering, REST APIs, JavaScript, responsive web development, ATS keyword analysis, documentation, GitHub projects, communication, and willingness to learn in a mentor-led environment.",
};

const rolePresets = {
  aiMlIntern: {
    targetRole: "AI/ML Intern",
    skills: "Python, machine learning, data preprocessing, scikit-learn, Gemini API, prompt engineering, HTML, CSS, JavaScript, REST APIs",
    projects:
      "AI Resume & Portfolio Builder - generated tailored resumes using Gemini API; Student Performance Predictor - trained an ML model to predict academic risk; Chatbot for College FAQs - built an LLM-powered assistant",
    jobDescription:
      "AI/ML internship requiring Python, machine learning basics, generative AI APIs, prompt engineering, data preprocessing, model evaluation, web development and documentation.",
  },
  dataAnalyst: {
    targetRole: "Data Analyst Intern",
    skills: "Python, SQL, Excel, Power BI, data cleaning, pandas, charts, dashboards, statistics, storytelling",
    projects:
      "Student Result Dashboard - analyzed marks and attendance patterns; Sales Insights Dashboard - cleaned CSV data and visualized KPIs; Survey Analysis - summarized responses using Python and charts",
    jobDescription:
      "Data analyst internship requiring SQL, Excel, Python, data cleaning, dashboards, visualization, statistics, business insights and reporting.",
  },
  webDeveloper: {
    targetRole: "Web Developer Intern",
    skills: "HTML, CSS, JavaScript, responsive design, REST APIs, GitHub, accessibility, forms, UI testing",
    projects:
      "AI Resume Builder - full-stack web app using Python and JavaScript; College Event Website - responsive event pages; Portfolio Website - project showcase with contact form",
    jobDescription:
      "Web developer internship requiring HTML, CSS, JavaScript, responsive UI, API integration, GitHub, accessibility and clean documentation.",
  },
  cybersecurity: {
    targetRole: "Cybersecurity Intern",
    skills: "Networking basics, Linux, Python, OWASP, vulnerability assessment, security documentation, risk analysis, incident response basics",
    projects:
      "Phishing Awareness Analyzer - classified suspicious message patterns; Password Strength Checker - built a secure validation tool; Network Log Summary - analyzed sample logs for unusual activity",
    jobDescription:
      "Cybersecurity internship requiring networking, Linux, Python, OWASP basics, vulnerability assessment, risk reporting and security documentation.",
  },
};

const documents = {
  resume: "",
  cover: "",
  portfolio: "",
};

const API_BASE_URL = "https://aicte-b1.onrender.com";

let activeTab = "resume";

const output = document.querySelector("#output");
const statusEl = document.querySelector("#status");
const providerStatus = document.querySelector("#providerStatus");
const generateBtn = document.querySelector("#generateBtn");
const downloadBtn = document.querySelector("#downloadBtn");
const copyBtn = document.querySelector("#copyBtn");
const sampleBtn = document.querySelector("#sampleBtn");
const clearBtn = document.querySelector("#clearBtn");
const rolePreset = document.querySelector("#rolePreset");
const insightSummary = document.querySelector("#insightSummary");
const atsScore = document.querySelector("#atsScore");
const mentorScore = document.querySelector("#mentorScore");
const matchedKeywords = document.querySelector("#matchedKeywords");
const missingKeywords = document.querySelector("#missingKeywords");
const aiTips = document.querySelector("#aiTips");
const atsChecks = document.querySelector("#atsChecks");
const interviewQuestions = document.querySelector("#interviewQuestions");
const resumeCorrections = document.querySelector("#resumeCorrections");
const skillRoadmap = document.querySelector("#skillRoadmap");
const projectIdeas = document.querySelector("#projectIdeas");
const profileCompleteness = document.querySelector("#profileCompleteness");
const skillCount = document.querySelector("#skillCount");
const projectCount = document.querySelector("#projectCount");
const keywordCount = document.querySelector("#keywordCount");

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  refreshProviderStatus();
});

function bindEvents() {
  sampleBtn.addEventListener("click", loadSample);
  clearBtn.addEventListener("click", clearForm);
  rolePreset.addEventListener("change", applyRolePreset);
  generateBtn.addEventListener("click", generateDocuments);
  downloadBtn.addEventListener("click", downloadPdf);
  copyBtn.addEventListener("click", copyActiveDocument);
  document.querySelector("#outputType").addEventListener("change", syncActiveTabToSelection);

  fields.forEach((field) => {
    document.querySelector(`#${field}`).addEventListener("input", updateLiveIntelligence);
  });

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.tab;
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      renderActiveDocument();
    });
  });

  updateLiveIntelligence();
}

async function refreshProviderStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/providers`);
    const data = await response.json();
    const gemini = data.gemini ? "Gemini ready" : "Gemini key missing";
    const huggingFace = data.huggingface ? "Hugging Face ready" : "Hugging Face key missing";
    providerStatus.textContent = `${gemini} | ${huggingFace} | Model: ${data.geminiModel}`;
  } catch (error) {
    providerStatus.textContent = "Backend is not reachable. Start Python with: python backend.py";
  }
}

function loadSample() {
  fields.forEach((field) => {
    document.querySelector(`#${field}`).value = sampleProfile[field] || "";
  });
  statusEl.textContent = "Mentor demo profile loaded with dummy AI/LLM student details.";
  updateLiveIntelligence();
}

function clearForm() {
  fields.forEach((field) => {
    document.querySelector(`#${field}`).value = "";
  });
  rolePreset.value = "";
  documents.resume = "";
  documents.cover = "";
  documents.portfolio = "";
  renderActiveDocument();
  resetInsights();
  updateLiveIntelligence();
  statusEl.textContent = "Form cleared.";
}

function applyRolePreset() {
  const preset = rolePresets[rolePreset.value];
  if (!preset) {
    updateLiveIntelligence();
    return;
  }

  Object.entries(preset).forEach(([field, value]) => {
    const input = document.querySelector(`#${field}`);
    if (input && !input.value.trim()) {
      input.value = value;
    }
  });
  statusEl.textContent = "Smart role preset applied.";
  updateLiveIntelligence();
}

async function generateDocuments() {
  const payload = {
    provider: document.querySelector("#provider").value,
    outputType: document.querySelector("#outputType").value,
    tone: document.querySelector("#tone").value,
    profile: readProfile(),
  };

  if (!payload.profile.fullName || !payload.profile.targetRole || !payload.profile.skills || !payload.profile.projects) {
    statusEl.textContent = "Please fill full name, target role, skills and projects.";
    return;
  }

  setLoading(true);
  statusEl.textContent = "Generating with the Python LLM backend...";

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Generation failed.");
    }

    documents.resume = data.documents.resume || "";
    documents.cover = data.documents.cover || "";
    documents.portfolio = data.documents.portfolio || "";
    syncActiveTabToSelection();
    statusEl.textContent = `Generated successfully using ${data.providerUsed}.`;
    renderActiveDocument();
    renderCareerInsights(payload.profile);
  } catch (error) {
    statusEl.textContent = error.message;
  } finally {
    setLoading(false);
    refreshProviderStatus();
  }
}

function readProfile() {
  return fields.reduce((profile, field) => {
    profile[field] = document.querySelector(`#${field}`).value.trim();
    return profile;
  }, {});
}

function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  generateBtn.textContent = isLoading ? "Generating..." : "Generate Documents";
}

function renderActiveDocument() {
  const markdown = documents[activeTab];
  if (!markdown) {
    output.innerHTML = '<p class="empty-state">No content for this tab yet. Generate documents first.</p>';
    return;
  }
  output.innerHTML = markdownToHtml(markdown);
}

function renderCareerInsights(profile) {
  const combined = getCombinedMarkdown();
  const insights = analyzeCareerFit(combined, profile);

  atsScore.textContent = `${insights.score}%`;
  mentorScore.textContent = `${insights.mentorScore}%`;
  insightSummary.textContent = `${insights.matched.length} keywords matched, ${insights.missing.length} useful keywords missing, ${insights.corrections.length} corrections suggested.`;
  matchedKeywords.innerHTML = renderChips(insights.matched, "No strong keyword matches yet.");
  missingKeywords.innerHTML = renderChips(insights.missing, "No missing keywords found.");
  aiTips.innerHTML = insights.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("");
  atsChecks.innerHTML = insights.checks.map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  interviewQuestions.innerHTML = insights.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("");
  resumeCorrections.innerHTML = insights.corrections.map((correction) => `<li>${escapeHtml(correction)}</li>`).join("");
  skillRoadmap.innerHTML = insights.roadmap.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  projectIdeas.innerHTML = insights.projectIdeas.map((idea) => `<li>${escapeHtml(idea)}</li>`).join("");
}

function analyzeCareerFit(markdown, profile) {
  const documentText = normalizeText(markdown);
  const jobKeywords = extractKeywords(profile.jobDescription || `${profile.targetRole} ${profile.skills}`);
  const matched = jobKeywords.filter((keyword) => documentText.includes(keyword));
  const missing = jobKeywords.filter((keyword) => !documentText.includes(keyword)).slice(0, 8);
  const skillCount = splitItems(profile.skills).length;
  const projectCount = splitItems(profile.projects).length;
  const certificationCount = splitItems(profile.certifications).length;
  const linkCount = countUrls(`${profile.linkedinUrl} ${profile.githubUrl} ${profile.portfolioUrl} ${profile.links} ${profile.projectUrls} ${profile.certificationUrls}`);
  const hasExperience = Boolean(profile.internships || profile.workExperience);
  const hasAcademics = Boolean(profile.education && (profile.gpa || profile.cgpa || profile.graduationYear));
  const hasContact = Boolean(profile.email && profile.phone && profile.links);
  const hasMetrics = /\b\d+[%+]?\b/.test(markdown);
  const hasStandardSections = ["professional summary", "education", "technical skills", "projects"].every((section) =>
    documentText.includes(section)
  );
  const hasActionVerbs = /\b(built|created|developed|implemented|designed|improved|analyzed|tested|documented|collaborated|integrated)\b/.test(
    documentText
  );
  const hasAiLlmFocus = /\b(ai|llm|gemini|hugging face|prompt|machine learning|ml|generative)\b/.test(documentText);
  const keywordScore = jobKeywords.length ? Math.round((matched.length / jobKeywords.length) * 30) : 18;
  const score = Math.min(
    98,
    32 +
      keywordScore +
      Math.min(skillCount, 8) * 2 +
      Math.min(projectCount, 4) * 3 +
      Math.min(certificationCount, 3) * 2 +
      (hasExperience ? 8 : 0) +
      (hasAcademics ? 6 : 0) +
      (hasContact ? 6 : 0) +
      (hasMetrics ? 5 : 0) +
      (hasStandardSections ? 4 : 0) +
      (hasActionVerbs ? 4 : 0)
  );
  const mentorScore = Math.min(
    99,
    Math.round(
      score * 0.55 +
        Math.min(projectCount, 4) * 6 +
        Math.min(linkCount, 6) * 4 +
        (hasAiLlmFocus ? 10 : 0) +
        (certificationCount ? 5 : 0) +
        (hasMetrics ? 6 : 0)
    )
  );

  return {
    score,
    mentorScore,
    matched: matched.slice(0, 10),
    missing,
    tips: buildImprovementTips({
      missing,
      skillCount,
      projectCount,
      certificationCount,
      hasExperience,
      hasAcademics,
      hasContact,
      hasMetrics,
      hasStandardSections,
      hasActionVerbs,
      profile,
    }),
    corrections: buildResumeCorrections({
      missing,
      linkCount,
      hasAiLlmFocus,
      hasMetrics,
      hasAcademics,
      hasContact,
      projectCount,
      certificationCount,
      profile,
    }),
    checks: buildAtsChecks({
      missing,
      hasContact,
      hasAcademics,
      hasMetrics,
      hasStandardSections,
      hasActionVerbs,
      profile,
    }),
    questions: buildInterviewQuestions(profile, matched),
    roadmap: buildSkillRoadmap(profile, missing),
    projectIdeas: buildProjectIdeas(profile, missing),
  };
}

function syncActiveTabToSelection() {
  const outputType = document.querySelector("#outputType").value;
  const nextTab = outputType === "all" ? activeTab : outputType;
  activeTab = nextTab === "cover" ? "cover" : nextTab === "portfolio" ? "portfolio" : "resume";
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === activeTab);
  });
  renderActiveDocument();
}

function buildImprovementTips(details) {
  const tips = [];
  if (details.missing.length) {
    tips.push(`Add these internship keywords where truthful: ${details.missing.slice(0, 4).join(", ")}.`);
  }
  if (!details.hasMetrics) {
    tips.push("Add one measurable result, such as accuracy, users, time saved, marks improved or features completed.");
  }
  if (!details.hasExperience) {
    tips.push("Add internship, freelance, academic or volunteer experience with responsibilities and tools used.");
  }
  if (!details.hasAcademics) {
    tips.push("Include GPA, CGPA or percentage and expected graduation year for a complete student resume.");
  }
  if (!details.certificationCount) {
    tips.push("Add relevant certifications such as Python, SQL, cloud, AI or web development courses.");
  }
  if (details.projectCount < 2) {
    tips.push("Include at least two projects with tools used, your role and final outcome.");
  }
  if (details.skillCount < 6) {
    tips.push("Expand the skills section with languages, tools, APIs and AI concepts you can explain confidently.");
  }
  if (!details.hasContact) {
    tips.push("Add email, phone and a portfolio or GitHub link for recruiter follow-up.");
  }
  tips.push(`Tailor the summary toward ${details.profile.targetRole || "the selected role"} using the same wording as the internship description.`);
  return tips.slice(0, 5);
}

function buildAtsChecks(details) {
  const checks = [];
  checks.push(details.hasContact ? "Contact line includes email, phone and link." : "Add email, phone and LinkedIn or GitHub link.");
  checks.push(
    details.hasStandardSections
      ? "Uses standard ATS headings: Professional Summary, Education, Technical Skills and Projects."
      : "Use standard headings so parsers can classify each section."
  );
  checks.push(
    details.hasActionVerbs
      ? "Bullet points include action verbs."
      : "Start bullets with action verbs such as Built, Developed, Tested, Improved or Documented."
  );
  checks.push(
    details.hasMetrics
      ? "Includes at least one measurable number."
      : "Add truthful numbers such as GPA, CGPA, project count, users, accuracy, time saved or features delivered."
  );
  checks.push(
    details.missing.length
      ? `Add missing role keywords only where honest: ${details.missing.slice(0, 3).join(", ")}.`
      : "Job-description keywords are represented well."
  );
  return checks;
}

function buildResumeCorrections(details) {
  const corrections = [];
  if (!details.hasContact) {
    corrections.push("Put email, phone, LinkedIn/GitHub and location directly below your name.");
  }
  if (!details.hasAcademics) {
    corrections.push("Add college, degree, CGPA/percentage and graduation year in one clean Education line.");
  }
  if (!details.hasMetrics) {
    corrections.push("Rewrite at least two bullets with numbers, such as accuracy, users, modules, APIs, grades or time saved.");
  }
  if (details.projectCount < 3) {
    corrections.push("Add one more mentor-friendly project with problem, tools, your contribution and result.");
  }
  if (!details.hasAiLlmFocus) {
    corrections.push("For AI roles, mention LLM APIs, prompt engineering, model evaluation or responsible AI only where you can explain them.");
  }
  if (details.linkCount < 2) {
    corrections.push("Add clickable GitHub, live demo, LinkedIn, certificate or project URLs so mentors can verify your work quickly.");
  }
  if (!details.certificationCount) {
    corrections.push("Add one relevant certification or course completion that supports the target role.");
  }
  if (details.missing.length) {
    corrections.push(`Mirror these JD words truthfully in skills/projects: ${details.missing.slice(0, 3).join(", ")}.`);
  }
  corrections.push(`Practice a crisp answer for: "Why ${details.profile.targetRole || "this role"} and why this project?"`);
  return corrections.slice(0, 6);
}

function buildInterviewQuestions(profile, matchedKeywords) {
  const projects = splitItems(profile.projects);
  const firstProject = projects[0] || "your strongest project";
  const keySkill = splitItems(profile.skills)[0] || matchedKeywords[0] || "your main technical skill";
  const targetRole = profile.targetRole || "this internship";

  return [
    `How would you explain ${firstProject} to a non-technical interviewer?`,
    `Which part of ${keySkill} did you use practically, and what did you learn?`,
    `Why are you interested in the ${targetRole} role?`,
    "Describe one challenge you faced in a project and how you solved it.",
    "How would you improve this resume builder if you had one more week?",
  ];
}

function buildSkillRoadmap(profile, missingKeywords = []) {
  const skills = normalizeText(profile.skills);
  const role = normalizeText(profile.targetRole);
  const roadmap = [];

  if ((role.includes("ai") || role.includes("ml") || role.includes("machine")) && !skills.includes("scikit")) {
    roadmap.push("Build one small scikit-learn model and mention dataset, features, metric and result.");
  }
  if ((role.includes("data") || role.includes("analyst")) && !skills.includes("sql")) {
    roadmap.push("Practice SQL joins, grouping and filters, then add one dashboard project with insights.");
  }
  if (role.includes("web") && !skills.includes("api")) {
    roadmap.push("Add one REST API integration project with loading, error and empty states.");
  }
  if (role.includes("cyber") && !skills.includes("owasp")) {
    roadmap.push("Study OWASP Top 10 basics and document one safe vulnerability-analysis mini project.");
  }
  if (!skills.includes("git")) {
    roadmap.push("Publish projects on GitHub with README, screenshots, setup steps and clear commits.");
  }
  if (missingKeywords.length) {
    roadmap.push(`Learn and truthfully demonstrate: ${missingKeywords.slice(0, 3).join(", ")}.`);
  }
  roadmap.push("Prepare a 60-second project explanation covering problem, tools, your role and outcome.");
  return roadmap.slice(0, 5);
}

function buildProjectIdeas(profile, missingKeywords = []) {
  const role = normalizeText(profile.targetRole);
  const keywordHint = missingKeywords[0] ? ` with ${missingKeywords[0]}` : "";

  if (role.includes("data") || role.includes("analyst")) {
    return [
      `Internship Analytics Dashboard${keywordHint} using CSV data, filters and KPI cards.`,
      "Student Placement Insights project using SQL queries and visualization.",
      "Excel-to-Power-BI reporting workflow with clear business recommendations.",
    ];
  }
  if (role.includes("web")) {
    return [
      `AI-powered portfolio website${keywordHint} with responsive UI and API status handling.`,
      "Student task manager with local storage, filters and accessibility-friendly controls.",
      "College event registration app with validation and printable confirmation.",
    ];
  }
  if (role.includes("cyber")) {
    return [
      `Safe phishing-awareness checker${keywordHint} with educational risk labels.`,
      "Password strength analyzer with explainable security suggestions.",
      "Network log summarizer that flags unusual patterns in sample data.",
    ];
  }
  return [
    `Mini ML predictor${keywordHint} with dataset preprocessing and evaluation metric.`,
    "LLM chatbot for college FAQs with prompt templates and response-quality checks.",
    "AI resume scorer that explains missing ATS keywords and formatting improvements.",
  ];
}

function updateLiveIntelligence() {
  const profile = readProfile();
  const filled = fields.filter((field) => profile[field]).length;
  const skills = splitItems(profile.skills);
  const projects = splitItems(profile.projects);
  const keywords = extractKeywords(profile.jobDescription || `${profile.targetRole} ${profile.skills}`);
  const completeness = Math.round((filled / fields.length) * 100);

  profileCompleteness.textContent = `${completeness}%`;
  skillCount.textContent = skills.length;
  projectCount.textContent = projects.length;
  keywordCount.textContent = keywords.length;

  const liveInsights = {
    roadmap: buildSkillRoadmap(profile, keywords.slice(0, 5)),
    projectIdeas: buildProjectIdeas(profile, keywords.slice(0, 5)),
  };
  skillRoadmap.innerHTML = liveInsights.roadmap.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  projectIdeas.innerHTML = liveInsights.projectIdeas.map((idea) => `<li>${escapeHtml(idea)}</li>`).join("");
}

function resetInsights() {
  atsScore.textContent = "--";
  mentorScore.textContent = "--";
  insightSummary.textContent = "Generate documents to view ATS score, keyword match, format checks and interview prep.";
  matchedKeywords.innerHTML = '<span class="empty-state">Waiting for generated content.</span>';
  missingKeywords.innerHTML = '<span class="empty-state">Waiting for job description.</span>';
  aiTips.innerHTML = "<li>Generate documents first.</li>";
  atsChecks.innerHTML = "<li>Generate documents first.</li>";
  interviewQuestions.innerHTML = "<li>Generate documents first.</li>";
  resumeCorrections.innerHTML = "<li>Generate documents first.</li>";
}

function getCombinedMarkdown() {
  return [
    documents.resume && `# RESUME\n\n${documents.resume}`,
    documents.cover && `# COVER_LETTER\n\n${documents.cover}`,
    documents.portfolio && `# PORTFOLIO\n\n${documents.portfolio}`,
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");
}

function getSelectedDownloadMarkdown() {
  const target = getDownloadTarget();
  const markdown = documents[target] || "";
  if (!markdown) {
    return "";
  }

  const title = target === "cover" ? "COVER LETTER" : target.toUpperCase();
  return [`# ${title}`, markdown].filter(Boolean).join("\n\n");
}

function getDownloadTarget() {
  const selected = document.querySelector("#outputType").value;
  return selected === "all" ? activeTab : selected;
}

function renderChips(items, fallback) {
  if (!items.length) {
    return `<span class="empty-state">${escapeHtml(fallback)}</span>`;
  }
  return items.map((item) => `<span class="keyword-chip">${escapeHtml(item)}</span>`).join("");
}

function extractKeywords(text) {
  const stopWords = new Set([
    "and",
    "are",
    "for",
    "from",
    "have",
    "internship",
    "with",
    "that",
    "this",
    "will",
    "your",
    "you",
    "the",
    "using",
    "role",
    "work",
    "team",
    "student",
    "required",
    "requiring",
  ]);

  return Array.from(
    new Set(
      normalizeText(text)
        .split(/\s+/)
        .filter((word) => word.length > 2 && !stopWords.has(word))
    )
  ).slice(0, 18);
}

function splitItems(value) {
  return (value || "")
    .split(/[,;\n.]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .trim();
}

function downloadPdf() {
  const selectedMarkdown = getSelectedDownloadMarkdown();

  if (!selectedMarkdown) {
    statusEl.textContent = `Generate ${activeTabLabel().toLowerCase()} before downloading.`;
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    statusEl.textContent = "Allow pop-ups, then click Download PDF again.";
    return;
  }

  const target = getDownloadTarget();
  const title = `ai-${target}-builder`;
  printWindow.document.write(buildPrintableDocument(title, selectedMarkdown));
  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => {
    printWindow.print();
  }, 250);
  statusEl.textContent = `${documentLabel(target)} PDF opened with only that document. Choose Save as PDF in the print dialog.`;
}

async function copyActiveDocument() {
  const markdown = documents[activeTab];
  if (!markdown) {
    statusEl.textContent = "Generate content before copying.";
    return;
  }

  try {
    await navigator.clipboard.writeText(markdown);
    statusEl.textContent = `${activeTabLabel()} copied to clipboard.`;
  } catch (error) {
    statusEl.textContent = "Clipboard access failed. Select the preview text and copy manually.";
  }
}

function activeTabLabel() {
  return activeTab === "cover" ? "Cover letter" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
}

function documentLabel(documentType) {
  if (documentType === "cover") {
    return "Cover letter";
  }
  return documentType.charAt(0).toUpperCase() + documentType.slice(1);
}

function buildInsightsMarkdown() {
  const matched = Array.from(matchedKeywords.querySelectorAll(".keyword-chip")).map((chip) => chip.textContent);
  const missing = Array.from(missingKeywords.querySelectorAll(".keyword-chip")).map((chip) => chip.textContent);
  const tips = Array.from(aiTips.querySelectorAll("li")).map((item) => item.textContent);
  const questions = Array.from(interviewQuestions.querySelectorAll("li")).map((item) => item.textContent);
  const checks = Array.from(atsChecks.querySelectorAll("li")).map((item) => item.textContent);
  const corrections = Array.from(resumeCorrections.querySelectorAll("li")).map((item) => item.textContent);

  return [
    `## ATS Readiness\n${atsScore.textContent || "--"}`,
    `## Mentor Appeal\n${mentorScore.textContent || "--"}`,
    `## Matched Keywords\n${matched.length ? matched.map((item) => `- ${item}`).join("\n") : "- No matched keywords yet."}`,
    `## Missing Keywords\n${missing.length ? missing.map((item) => `- ${item}`).join("\n") : "- No missing keywords found."}`,
    `## AI Improvement Tips\n${tips.map((item) => `- ${item}`).join("\n")}`,
    `## Resume Corrections\n${corrections.map((item) => `- ${item}`).join("\n")}`,
    `## ATS Format Checks\n${checks.map((item) => `- ${item}`).join("\n")}`,
    `## Interview Prep Questions\n${questions.map((item) => `- ${item}`).join("\n")}`,
  ].join("\n\n");
}

function buildPrintableDocument(title, markdown) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #172026;
      font-family: "Times New Roman", Times, serif;
      font-size: 10.5pt;
      line-height: 1.45;
    }
    h1 {
      margin: 0 0 8pt;
      padding-bottom: 6pt;
      color: #111827;
      border-bottom: 2px solid #0f766e;
      font-size: 22pt;
    }
    h2 {
      margin: 15pt 0 6pt;
      padding-bottom: 3pt;
      color: #0b5d56;
      border-bottom: 1px solid #d7dde2;
      font-size: 14pt;
    }
    h3 {
      margin: 10pt 0 4pt;
      color: #172026;
      font-size: 11.5pt;
    }
    p { margin: 4pt 0; }
    ul { margin: 4pt 0 8pt 18pt; padding: 0; }
    li { margin: 2pt 0; }
    hr { margin: 12pt 0; border: 0; border-top: 1px solid #d7dde2; }
    strong { color: #111827; }
  </style>
</head>
<body>
  ${markdownToHtml(markdown)}
</body>
</html>`;
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inList = false;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      return;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push("<hr>");
      return;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)/);
    if (bullet) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${formatInline(bullet[1])}</li>`);
      return;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    if (trimmed.startsWith("### ")) {
      html.push(`<h3>${formatInline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      html.push(`<h2>${formatInline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      html.push(`<h1>${formatInline(trimmed.slice(2))}</h1>`);
    } else {
      html.push(`<p>${formatInline(trimmed)}</p>`);
    }
  });

  if (inList) {
    html.push("</ul>");
  }

  return html.join("");
}

function formatInline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function countUrls(value) {
  return (value.match(/https?:\/\/[^\s,|)]+/g) || []).length;
}
