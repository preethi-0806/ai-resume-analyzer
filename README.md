# AI Resume Analyzer 📄🚀

A comprehensive, self-contained AI-powered Resume Analyzer and ATS scoring tool. It extracts text content from PDF resumes, evaluates quality parameters against modern recruiters' guidelines using the OpenAI GPT API, and presents findings in a sleek, responsive dark-themed dashboard.

This project is built from scratch with beginner-friendly code, clean structures, and descriptive comments, making it an excellent demonstration project for software engineering, web development, and AI integration interviews.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Single Page Application (SPA) built with Semantic HTML5, Vanilla JavaScript (ES6+), and CSS3 Custom Properties (variables, HSL layout gradients, and responsive CSS grid).
- **Backend**: Python Flask REST API framework.
- **PDF Text Parsing**: PyPDF2 module (native PDF binary parsing).
- **AI Processing**: OpenAI Chat Completions API (`gpt-4o-mini` model).

```
resume-analyzer/
│
├── app.py                  # Core Flask backend API and route handlers
├── requirements.txt        # Backend dependencies & production packages
├── .env.example            # Configuration template for local setup
│
├── static/                 # Static asset subdirectory
│   ├── style.css           # Premium glassmorphic styles & CSS variables
│   └── script.js           # AJAX fetch requests and DOM manipulation
│
├── templates/              # HTML layout directory
│   └── index.html          # Shell layout structure for the SPA
│
└── README.md               # Documentation and interview preparation guide
```

---

## ✨ Features

1. **Premium Modern UI**: Built with a sleek HSL color scheme, dark theme, smooth transition micro-animations, glassmorphic cards, and responsive grids.
2. **Interactive Drag-and-Drop Uploader**: Visual indicators when dragging files over the dropzone, plus active file metadata display.
3. **Animated Circular Progress Gauges**: Smooth SVG animations representing Resume Content Score and search-matching ATS Score.
4. **Skills Gap Analysis**: Color-coded badges separating successfully identified skills from critical missing skills.
5. **Detailed Bullet Matrices**: Distinct sections highlighting professional strengths and critical structural weaknesses.
6. **Structured Path Timeline**: A vertical pathway showing sequential recommendations for resume improvement.
7. **Developer Demo Fallback**: Automatically activates simulation fallback if the OpenAI API key is missing, allowing you to showcase the application anywhere without setup friction.

---

## 💻 Local Setup Instructions

Follow these steps to run the application locally on your computer:

### 1. Clone or Download the Directory
Place the files into your local development workspace.

### 2. Configure a Virtual Environment (Recommended)
Open a terminal in the project directory and run:

**On Windows:**
```powershell
python -m venv venv
venv\Scripts\activate
```

**On macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
Install all the required Python modules from `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 4. Setup Environment Variables
1. Copy the template `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-API-KEY
   ```
   *Note: If the API key is not configured, the app will run using simulated mock report data so you can still demonstrate the frontend.*

### 5. Launch the Server
Start the Flask application:
```bash
python app.py
```
The server will start running locally. Open your browser and navigate to:
[http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## ☁️ Deployment Instructions for Render

You can easily host this application for free on [Render](https://render.com) using standard Python settings.

### Step 1: Create a GitHub Repository
1. Initialize Git in your project folder, commit all files (excluding `.env` or `venv` folders), and push them to a public or private GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of AI Resume Analyzer"
   ```

### Step 2: Create a Web Service on Render
1. Log into your Render dashboard and click **New > Web Service**.
2. Connect your GitHub account and select your repository.

### Step 3: Configure Settings
Set the following build parameters during the creation flow:
- **Environment**: `Python`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app`

### Step 4: Add Environment Variables
Click **Advanced** or navigate to the **Environment** tab on Render and add:
- `OPENAI_API_KEY` = `your-actual-api-key-here`
- `FLASK_ENV` = `production`
- `PORT` = `10000` (or leave default, Render matches ports automatically)

Click **Deploy**! Render will pull the code, install requirements, compile assets, and launch your live server.

---

## 🎤 Interview Guide: Explain This Project Like a Pro

If you are showcasing this project during technical interviews, be ready to discuss these key design choices:

### 1. How does the PDF text extraction work?
> *"We use **PyPDF2** to parse the binary structure of uploaded PDF files page-by-page. Its `PdfReader` iterates over the document pages and extracts plain text. This is a lightweight, pure-Python approach that avoids heavy external installations like Tesseract OCR, ensuring faster request responses."*

### 2. How did you structure the prompt to guarantee valid JSON from OpenAI?
> *"To ensure API stability, we do three things. First, we use the `response_format={"type": "json_object"}` setting on the client request which instructs OpenAI's API to enforce JSON output. Second, the system prompt contains an explicit JSON schema template. Third, in `app.py` we use a regex/substring sanitizer to clean off any markdown code wrappers (like ```json ... ```) before parsing with python's `json.loads()` library. This makes our JSON parsing bulletproof."*

### 3. Explain the frontend design strategy.
> *"The frontend is a single-page application built entirely with vanilla CSS and ES6 JavaScript. We avoided frameworks like React or Tailwind to keep the loading speed optimal and demonstrate core DOM manipulation. We used custom CSS custom properties (variables) to maintain color tokens, implemented SVG dashboard gauges for score progress animation by manipulating `stroke-dashoffset` dynamically, and used standard CSS Grid for layout flexibility."*

### 4. How are API keys kept secure?
> *"We never expose the OpenAI API key to the frontend client. The frontend makes a request to our local Flask backend (`/analyze`), and the Flask backend interacts with the OpenAI API securely. The API key is loaded into environment variables using `python-dotenv` and is kept safe on server hosting settings, keeping it completely hidden from the client browser inspector."*
