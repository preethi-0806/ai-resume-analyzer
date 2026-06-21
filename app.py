import os
import json
import re
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from PyPDF2 import PdfReader
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Initialize OpenAI client if API key is provided
openai_api_key = os.getenv("OPENAI_API_KEY")
client = None
if openai_api_key and openai_api_key != "your_openai_api_key_here":
    client = OpenAI(api_key=openai_api_key)

@app.route('/')
def index():
    """Serve the single-page application dashboard."""
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Endpoint to extract text from a PDF resume and analyze it using OpenAI.
    Input: Multipart form-data with a file field 'file' containing the PDF.
    Output: JSON report with scores, skills, strengths, weaknesses, and suggestions.
    """
    # 1. Check if file is present in the request
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded. Please select a resume PDF."}), 400
    
    file = request.files['file']
    
    # 2. Check if a valid PDF file is selected
    if file.filename == '':
        return jsonify({"error": "No file selected. Please select a valid PDF file."}), 400
        
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Unsupported file format. Please upload a PDF file."}), 400

    try:
        # 3. Extract text from PDF using PyPDF2
        pdf_reader = PdfReader(file)
        resume_text = ""
        
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            extracted_text = page.extract_text()
            if extracted_text:
                resume_text += extracted_text + "\n"
        
        resume_text = resume_text.strip()
        
        # 4. Check if text extraction was successful
        if not resume_text or len(resume_text) < 50:
            return jsonify({
                "error": "Could not extract sufficient text from the PDF. Please make sure the PDF contains readable text, not just scanned images."
            }), 400

        # 5. Check if OpenAI API Key is configured
        # If API key is missing or set to placeholder, return mock data with a warning flag for easy interview demonstration!
        is_mock_fallback = False
        if not client:
            is_mock_fallback = True
        
        if is_mock_fallback:
            # Provide high-quality realistic mock response for demo purposes when API key is missing
            mock_data = {
                "resume_score": 78,
                "ats_score": 72,
                "skills": ["Python", "Flask", "JavaScript", "HTML", "CSS", "Git", "SQL"],
                "missing_skills": ["Docker", "Unit Testing (pytest)", "CI/CD Pipelines", "Redis", "RESTful API Best Practices"],
                "strengths": [
                    "Strong foundation in web application development using Python and Flask.",
                    "Competent in frontend integration using HTML/CSS and Vanilla Javascript.",
                    "Proper usage of Git version control shown in academic/personal projects."
                ],
                "weaknesses": [
                    "Lack of containerization or deployment tooling mentions (e.g. Docker, Kubernetes).",
                    "Limited mention of automated testing methodologies or test-driven development (TDD).",
                    "No reference to cloud platforms (AWS, Azure, or GCP)."
                ],
                "recommendations": [
                    "Add a section detailing automated test coverage (e.g., 'Wrote unit tests using unittest/pytest reaching 85% coverage').",
                    "Containerize one of your projects using Docker and list it under project descriptions.",
                    "Integrate cloud deployment details (e.g. 'Deployed application on Render/AWS using PostgreSQL database')."
                ],
                "is_demo": True
            }
            return jsonify(mock_data)

        # 6. Prepare prompt and call OpenAI API
        system_prompt = (
            "You are an expert recruiter and applicant tracking system (ATS) specialist.\n"
            "Analyze the provided resume text and generate a structured evaluation report.\n"
            "You must return ONLY a valid JSON object matching the following structure exactly:\n"
            "{\n"
            "  \"resume_score\": 85, // integer 0-100 evaluating content and formatting quality\n"
            "  \"ats_score\": 80,    // integer 0-100 indicating search and keyword optimization for ATS filters\n"
            "  \"skills\": [\"Python\", \"Flask\", ...], // list of all technical/soft skills identified\n"
            "  \"missing_skills\": [\"Docker\", ...],   // list of expected industry skills for the resume's target role that are missing\n"
            "  \"strengths\": [\"Clear project definitions\", ...], // list of key strengths\n"
            "  \"weaknesses\": [\"Gaps in employment history or cloud experience\", ...], // list of weak areas\n"
            "  \"recommendations\": [\"Add a skills section at the top\", ...] // actionable advice for improvement\n"
            "}\n"
            "Ensure the output contains only the JSON structure, with no pre-text, post-text, or markdown formatting tags (e.g., no ```json block formatting)."
        )

        user_content = f"Resume text to analyze:\n\n{resume_text}"

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            response_format={"type": "json_object"}
        )

        raw_response_content = response.choices[0].message.content.strip()

        # Sanitize response just in case markdown block formatting is returned
        sanitized_content = raw_response_content
        if sanitized_content.startswith("```json"):
            sanitized_content = sanitized_content[7:]
        elif sanitized_content.startswith("```"):
            sanitized_content = sanitized_content[3:]
        if sanitized_content.endswith("```"):
            sanitized_content = sanitized_content[:-3]
        sanitized_content = sanitized_content.strip()

        # Parse output JSON
        analysis_result = json.loads(sanitized_content)
        analysis_result["is_demo"] = False
        
        return jsonify(analysis_result)

    except json.JSONDecodeError as json_err:
        return jsonify({
            "error": "Failed to parse analysis results from AI model.",
            "details": str(json_err),
            "raw_response": raw_response_content if 'raw_response_content' in locals() else None
        }), 500
    except Exception as err:
        return jsonify({
            "error": "An unexpected error occurred during resume analysis.",
            "details": str(err)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    # In production, Flask-CORS/gunicorn manages running. In local dev, debug is enabled.
    debug_mode = os.getenv("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
