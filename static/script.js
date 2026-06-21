/*
========================================================================
   AI Resume Analyzer - Frontend Interactivity Script
   Vanilla JavaScript with Clean Event Handlers & State Management
========================================================================
*/

document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let selectedFile = null;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB Limit

    // DOM Elements - Views
    const uploadView = document.getElementById('upload-view');
    const loadingView = document.getElementById('loading-view');
    const dashboardView = document.getElementById('dashboard-view');

    // DOM Elements - Form & Upload
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfoBox = document.getElementById('file-info-box');
    const fileNameEl = document.getElementById('file-name');
    const fileSizeEl = document.getElementById('file-size');
    const btnRemoveFile = document.getElementById('btn-remove-file');
    const btnAnalyze = document.getElementById('btn-analyze');
    const errorAlert = document.getElementById('error-alert');
    const errorMessageEl = document.getElementById('error-message');

    // DOM Elements - Dashboard Outputs
    const demoBanner = document.getElementById('demo-banner');
    const resumeScoreRing = document.getElementById('resume-score-ring');
    const resumeScoreText = document.getElementById('resume-score-text');
    const atsScoreRing = document.getElementById('ats-score-ring');
    const atsScoreText = document.getElementById('ats-score-text');
    const skillsFoundContainer = document.getElementById('skills-found');
    const skillsMissingContainer = document.getElementById('skills-missing');
    const strengthsContainer = document.getElementById('strengths-list');
    const weaknessesContainer = document.getElementById('weaknesses-list');
    const recommendationsContainer = document.getElementById('recommendations-timeline');
    const btnReset = document.getElementById('btn-reset');

    /* ==========================================
       1. View Switcher Helper
       ========================================== */
    function showView(view) {
        uploadView.classList.remove('active');
        loadingView.classList.remove('active');
        dashboardView.classList.remove('active');

        if (view === 'upload') {
            uploadView.classList.add('active');
        } else if (view === 'loading') {
            loadingView.classList.add('active');
        } else if (view === 'dashboard') {
            dashboardView.classList.add('active');
        }
    }

    /* ==========================================
       2. Error Handler Helper
       ========================================== */
    function showError(message) {
        errorMessageEl.textContent = message;
        errorAlert.classList.add('active');
        // Scroll to error if not fully visible
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function clearError() {
        errorAlert.classList.remove('active');
        errorMessageEl.textContent = '';
    }

    /* ==========================================
       3. File Drag and Drop / Input Processing
       ========================================== */
    // Open file chooser on drop zone click
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        }, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });

    // Handle chosen file via input
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Remove file listener
    btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid opening file picker
        resetFileInputs();
    });

    // File validation and caching
    function handleFileSelection(file) {
        clearError();
        
        // Ensure file is PDF
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            showError('Invalid file type. Please upload a PDF resume.');
            resetFileInputs();
            return;
        }

        // Limit size (e.g. 10MB)
        if (file.size > MAX_FILE_SIZE) {
            showError('File size is too large. Max limit is 10MB.');
            resetFileInputs();
            return;
        }

        selectedFile = file;
        
        // Show file details in UI
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileInfoBox.style.display = 'flex';
        btnAnalyze.removeAttribute('disabled');
    }

    function resetFileInputs() {
        selectedFile = null;
        fileInput.value = '';
        fileInfoBox.style.display = 'none';
        btnAnalyze.setAttribute('disabled', 'true');
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /* ==========================================
       4. Perform Analysis API Call
       ========================================== */
    btnAnalyze.addEventListener('click', () => {
        if (!selectedFile) return;

        showView('loading');
        clearError();

        // Create FormData payload
        const formData = new FormData();
        formData.append('file', selectedFile);

        // Perform AJAX Fetch
        fetch('/analyze', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                // Read error message from JSON response
                return response.json().then(errData => {
                    throw new Error(errData.error || errData.details || 'Server error occurred during analysis.');
                });
            }
            return response.json();
        })
        .then(data => {
            // Render report
            populateDashboard(data);
            showView('dashboard');
        })
        .catch(err => {
            // Rollback to upload view and display errors
            showView('upload');
            showError(err.message || 'Connection failure. Please ensure the server is running.');
        });
    });

    /* ==========================================
       5. Populate Dashboard UI Elements
       ========================================== */
    function populateDashboard(data) {
        // Toggle Demo Alert banner
        if (data.is_demo) {
            demoBanner.classList.add('active');
        } else {
            demoBanner.classList.remove('active');
        }

        // 1. Animate Scores Circular Rings
        animateScoreRing(resumeScoreRing, resumeScoreText, data.resume_score || 0);
        animateScoreRing(atsScoreRing, atsScoreText, data.ats_score || 0);

        // 2. Populate Skills Badges
        skillsFoundContainer.innerHTML = '';
        if (data.skills && data.skills.length > 0) {
            data.skills.forEach(skill => {
                const tag = document.createElement('span');
                tag.className = 'tag tag-found';
                tag.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ${escapeHtml(skill)}
                `;
                skillsFoundContainer.appendChild(tag);
            });
        } else {
            skillsFoundContainer.innerHTML = '<span class="tag" style="background: rgba(255,255,255,0.03); color: var(--text-muted);">No skills extracted</span>';
        }

        skillsMissingContainer.innerHTML = '';
        if (data.missing_skills && data.missing_skills.length > 0) {
            data.missing_skills.forEach(skill => {
                const tag = document.createElement('span');
                tag.className = 'tag tag-missing';
                tag.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    ${escapeHtml(skill)}
                `;
                skillsMissingContainer.appendChild(tag);
            });
        } else {
            skillsMissingContainer.innerHTML = '<span class="tag" style="background: rgba(255,255,255,0.03); color: var(--success);">All typical skills matched!</span>';
        }

        // 3. Populate Strengths Bullet List
        strengthsContainer.innerHTML = '';
        if (data.strengths && data.strengths.length > 0) {
            data.strengths.forEach(strength => {
                const li = document.createElement('li');
                li.textContent = strength;
                strengthsContainer.appendChild(li);
            });
        } else {
            strengthsContainer.innerHTML = '<li style="list-style: none; padding-left: 0; color: var(--text-muted);">No major strengths mentioned.</li>';
        }

        // 4. Populate Weaknesses Bullet List
        weaknessesContainer.innerHTML = '';
        if (data.weaknesses && data.weaknesses.length > 0) {
            data.weaknesses.forEach(weakness => {
                const li = document.createElement('li');
                li.textContent = weakness;
                weaknessesContainer.appendChild(li);
            });
        } else {
            weaknessesContainer.innerHTML = '<li style="list-style: none; padding-left: 0; color: var(--text-muted);">No structural weaknesses found.</li>';
        }

        // 5. Populate Recommendations Timeline
        recommendationsContainer.innerHTML = '';
        if (data.recommendations && data.recommendations.length > 0) {
            data.recommendations.forEach(rec => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                item.innerHTML = `
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        ${escapeHtml(rec)}
                    </div>
                `;
                recommendationsContainer.appendChild(item);
            });
        } else {
            recommendationsContainer.innerHTML = '<div style="color: var(--text-muted);">Your resume looks top-tier! No major improvements needed.</div>';
        }
    }

    // Helper: Circle SVG offset animation
    function animateScoreRing(ringElement, textElement, score) {
        const radius = 45;
        const circumference = 2 * Math.PI * radius; // Approx 282.74
        
        // Reset offsets before animating
        ringElement.style.strokeDashoffset = circumference;
        
        // Force layout repaint to ensure animation triggers
        ringElement.getBoundingClientRect();
        
        // Calculate target dashoffset
        const offset = circumference - (score / 100) * circumference;
        ringElement.style.strokeDashoffset = offset;

        // Animate count-up text
        let startScore = 0;
        const duration = 1500; // Match CSS transition timing (1.5s)
        const stepTime = Math.abs(Math.floor(duration / score));
        
        // Safety guard for score = 0
        if (score === 0) {
            textElement.textContent = "0";
            return;
        }

        const timer = setInterval(() => {
            startScore++;
            textElement.textContent = startScore;
            if (startScore >= score) {
                clearInterval(timer);
                textElement.textContent = score; // Set precise final value
            }
        }, stepTime);
    }

    // Simple helper to prevent HTML injections
    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* ==========================================
       6. Reset Dashboard Flow
       ========================================== */
    btnReset.addEventListener('click', () => {
        resetFileInputs();
        showView('upload');
    });
});
