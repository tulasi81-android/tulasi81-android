/**
 * EduGuard - Core Application Controller (app.js - Upgraded)
 * Coordinates single-page routing, local storage persistence, state updates,
 * clock synchronizers, exam simulations, proctor webcams, subjective grading desk,
 * and portfolio resume dashboards.
 */

document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------------
    // 1. DATA MODELS & STATE MANAGEMENT
    // -----------------------------------------------------------------
    
    const DEFAULT_PROFILE = {
        name: "Professor Tulasiraju",
        title: "Senior Lecturer in Computer Science",
        bio: "Passionate computer science educator specializing in systems engineering, cybersecurity, and secure web application development. Committed to crafting high-fidelity educational tools and student exam environments.",
        email: "tulasiraju@university.edu",
        office: "CS Department Building, Room 402",
        expertise: "Cybersecurity, Algorithms, Secure Software",
        experience: 8,
        github: "https://github.com/tulasiraju",
        avatar: "profile-photo.jpg",
        bannerTheme: "indigo"
    };

    const DEFAULT_EDUCATION = [
        { id: "edu-1", title: "Ph.D. in Computer Science", institution: "Stanford University", years: "2018 - 2022", type: "edu" },
        { id: "edu-2", title: "M.S. in Information Security", institution: "Georgia Institute of Technology", years: "2015 - 2017", type: "edu" },
        { id: "edu-3", title: "Senior Security Specialist", institution: "Tech Security Systems", years: "2022 - Present", type: "exp" }
    ];

    const DEFAULT_PUBLICATIONS = [
        { id: "pub-1", title: "An Invigilation Sandbox for Secure Browser-based Examinations", journal: "IEEE Transactions on Learning Technologies", year: "2025" },
        { id: "pub-2", title: "Analysis of Symmetric Key Integrity Checks in High-Throughput Networks", journal: "Journal of Cybersecurity Education", year: "2024" }
    ];

    const DEFAULT_SUBJECTS = [
        { id: "sub-1", code: "CS-301", name: "Cryptography & NetSec", year: "Spring 2026", theme: "purple", studentsCount: 42 },
        { id: "sub-2", code: "CS-202", name: "Data Structures & Algorithms", year: "Spring 2026", theme: "indigo", studentsCount: 58 },
        { id: "sub-3", code: "CS-101", name: "Secure Web Architectures", year: "Spring 2026", theme: "cyan", studentsCount: 65 }
    ];

    // Default Assignments featuring multi-format questions
    const DEFAULT_ASSIGNMENTS = [
        {
            id: "assign-1",
            title: "Data Structures Midterm 2026",
            subjectId: "sub-2",
            activeTime: new Date(Date.now() - 3600000).toISOString().slice(0, 16), // Active immediately
            duration: 25,
            violationLimit: 2,
            questions: [
                {
                    id: "q-1",
                    type: "MCQ",
                    text: "Which data structure follows a Last-In, First-Out (LIFO) pattern?",
                    options: { A: "Queue", B: "Linked List", C: "Stack", D: "Binary Tree" },
                    correct: "C"
                },
                {
                    id: "q-2",
                    type: "MSQ",
                    text: "Select all self-balancing trees from the choices below: (Select all that apply)",
                    options: { A: "AVL Tree", B: "Binary Search Tree", C: "Red-Black Tree", D: "Max-Heap" },
                    correct: ["A", "C"] // Multi-select array
                },
                {
                    id: "q-3",
                    type: "TF",
                    text: "A Hash Table guarantees O(1) worst-case search complexity.",
                    options: { True: "True", False: "False" },
                    correct: "False"
                },
                {
                    id: "q-4",
                    type: "WRITTEN",
                    text: "Briefly explain the structural difference between a Graph and a Tree data structure, detailing cycle constraints.",
                    options: {},
                    correct: "" // Subjective
                }
            ]
        }
    ];

    // Main local storage getters/setters
    let profile = JSON.parse(localStorage.getItem('eg_profile')) || DEFAULT_PROFILE;
    let education = JSON.parse(localStorage.getItem('eg_education')) || DEFAULT_EDUCATION;
    let publications = JSON.parse(localStorage.getItem('eg_publications')) || DEFAULT_PUBLICATIONS;
    let subjects = JSON.parse(localStorage.getItem('eg_subjects')) || DEFAULT_SUBJECTS;
    let assignments = JSON.parse(localStorage.getItem('eg_assignments')) || DEFAULT_ASSIGNMENTS;
    let submissions = JSON.parse(localStorage.getItem('eg_submissions')) || [];

    const saveProfile = () => localStorage.setItem('eg_profile', JSON.stringify(profile));
    const saveEducation = () => localStorage.setItem('eg_education', JSON.stringify(education));
    const savePublications = () => localStorage.setItem('eg_publications', JSON.stringify(publications));
    const saveSubjects = () => localStorage.setItem('eg_subjects', JSON.stringify(subjects));
    const saveAssignments = () => localStorage.setItem('eg_assignments', JSON.stringify(assignments));
    const saveSubmissions = () => localStorage.setItem('eg_submissions', JSON.stringify(submissions));

    // Global variables for active exam state
    let activeExamContext = null;
    let examGuard = null;
    let examCountdownTimer = null;
    let secondsRemaining = 0;
    let studentViolationCounter = 0;
    let studentViolationsLog = [];
    let gatewayTimer = null;
    let activeAuditSubmission = null; // Currently viewed submission in Reports details modal

    // -----------------------------------------------------------------
    // 2. DOM ELEMENT CACHING
    // -----------------------------------------------------------------
    const views = document.querySelectorAll('.app-view');
    const navItems = document.querySelectorAll('.sidebar-menu .nav-item, .nav-trigger');
    const pageTitle = document.getElementById('pageTitle');
    
    // Clock & Theme
    const liveClock = document.getElementById('liveClock');
    const themeToggle = document.getElementById('themeToggle');

    // Dashboard Elements
    const statSubjects = document.getElementById('statSubjects');
    const statAssignments = document.getElementById('statAssignments');
    const statSubmissions = document.getElementById('statSubmissions');
    const statWarnings = document.getElementById('statWarnings');
    const dashWelcomeName = document.getElementById('dashWelcomeName');
    
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const sidebarName = document.getElementById('sidebarName');
    const dashAvatar = document.getElementById('dashAvatar');
    const dashName = document.getElementById('dashName');
    const dashTitle = document.getElementById('dashTitle');
    const dashOffice = document.getElementById('dashOffice');
    const dashEmail = document.getElementById('dashEmail');
    const dashboardAssignmentsList = document.getElementById('dashboardAssignmentsList');

    // Profile elements
    const profileCardBanner = document.getElementById('profileCardBanner');
    const profilePreviewAvatar = document.getElementById('profilePreviewAvatar');
    const profilePreviewName = document.getElementById('profilePreviewName');
    const profilePreviewTitle = document.getElementById('profilePreviewTitle');
    const profilePreviewBio = document.getElementById('profilePreviewBio');
    const profileStatSubjects = document.getElementById('profileStatSubjects');
    const profileStatYears = document.getElementById('profileStatYears');
    const profileEditForm = document.getElementById('profileEditForm');
    const avatarUploadInput = document.getElementById('avatarUploadInput');
    const formAvatarUpload = document.getElementById('formAvatarUpload');
    
    // Academic timeline DOM
    const timelineList = document.getElementById('timelineList');
    const addTimelineItemBtn = document.getElementById('addTimelineItemBtn');
    const addTimelineModal = document.getElementById('addTimelineModal');
    const closeTimelineModal = document.getElementById('closeTimelineModal');
    const timelineForm = document.getElementById('timelineForm');
    const cancelTimelineBtn = document.getElementById('cancelTimelineBtn');

    // Publications DOM
    const publicationsList = document.getElementById('publicationsList');
    const addPublicationBtn = document.getElementById('addPublicationBtn');
    const addPubModal = document.getElementById('addPubModal');
    const closePubModal = document.getElementById('closePubModal');
    const pubForm = document.getElementById('pubForm');
    const cancelPubBtn = document.getElementById('cancelPubBtn');

    // Subjects Elements
    const subjectsContainer = document.getElementById('subjectsContainer');
    const addSubjectModal = document.getElementById('addSubjectModal');
    const openAddSubjectBtn = document.getElementById('openAddSubjectBtn');
    const closeAddSubjectModal = document.getElementById('closeAddSubjectModal');
    const addSubjectForm = document.getElementById('addSubjectForm');
    const cancelSubjectBtn = document.getElementById('cancelSubjectBtn');

    // Assignment Creator Elements
    const assignSubjectSelect = document.getElementById('assignSubject');
    const questionsContainer = document.getElementById('questionsContainer');
    const noQuestionsState = document.getElementById('noQuestionsState');
    const submitAssignmentBtn = document.getElementById('submitAssignmentBtn');
    const assignmentCreateForm = document.getElementById('assignmentCreateForm');

    // Simulator Elements
    const availableExamsContainer = document.getElementById('availableExamsContainer');
    const simStudentName = document.getElementById('simStudentName');
    const simStudentId = document.getElementById('simStudentId');

    // Gateway Elements
    const studentGateway = document.getElementById('studentGateway');
    const gwExamTitle = document.getElementById('gwExamTitle');
    const gwExamSubject = document.getElementById('gwExamSubject');
    const gwExamStatus = document.getElementById('gwExamStatus');
    const gwCountdownBox = document.getElementById('gwCountdownBox');
    const gwCountdownDigits = document.getElementById('gwCountdownDigits');
    const exitGatewayBtn = document.getElementById('exitGatewayBtn');
    const startSecureExamBtn = document.getElementById('startSecureExamBtn');

    // Exam Room Elements
    const secureExamRoom = document.getElementById('secureExamRoom');
    const examRoomTitle = document.getElementById('examRoomTitle');
    const examRoomStudent = document.getElementById('examRoomStudent');
    const examTimerValue = document.getElementById('examTimerValue');
    const examQuestionsContainer = document.getElementById('examQuestionsContainer');
    const securityWarningOverlay = document.getElementById('securityWarningOverlay');
    const securityWarningText = document.getElementById('securityWarningText');
    const currentViolationCount = document.getElementById('currentViolationCount');
    const allowedViolationLimit = document.getElementById('allowedViolationLimit');
    const acknowledgeWarningBtn = document.getElementById('acknowledgeWarningBtn');
    const finishExamBtn = document.getElementById('finishExamBtn');

    // Video / Webcam widgets
    const webcamVideo = document.getElementById('webcamVideo');
    const webcamRadarCanvas = document.getElementById('webcamRadarCanvas');
    const webcamStatusLabel = document.getElementById('webcamStatusLabel');

    // Reports elements & Grading
    const reportsTableBody = document.getElementById('reportsTableBody');
    const clearReportsBtn = document.getElementById('clearReportsBtn');
    const violationDetailModal = document.getElementById('violationDetailModal');
    const closeViolationModal = document.getElementById('closeViolationModal');
    const closeViolationModalBtn = document.getElementById('closeViolationModalBtn');
    const auditStudentName = document.getElementById('auditStudentName');
    const auditScore = document.getElementById('auditScore');
    const auditViolationsCount = document.getElementById('auditViolationsCount');
    const auditSubmitType = document.getElementById('auditSubmitType');
    const auditTimeline = document.getElementById('auditTimeline');
    const violationModalHeader = document.getElementById('violationModalHeader');
    
    // Grading Desk DOM references
    const gradingWorkspace = document.getElementById('gradingWorkspace');
    const writtenQuestionsGradingList = document.getElementById('writtenQuestionsGradingList');
    const gradingForm = document.getElementById('gradingForm');

    // -----------------------------------------------------------------
    // 3. CORE LAYOUT & NAVIGATION CONTROLLERS
    // -----------------------------------------------------------------
    
    function navigateToView(viewId) {
        views.forEach(view => {
            if (view.id === `view-${viewId}`) {
                view.classList.add('active');
            } else {
                view.classList.remove('active');
            }
        });

        let formattedTitle = viewId.replace('-', ' ');
        formattedTitle = formattedTitle.charAt(0).toUpperCase() + formattedTitle.slice(1);
        if (formattedTitle === 'Aboutme') formattedTitle = 'About Professor';
        pageTitle.textContent = formattedTitle;

        navItems.forEach(btn => {
            if (btn.getAttribute('data-target') === viewId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // View specific refresh steps
        if (viewId === 'dashboard') refreshDashboard();
        if (viewId === 'aboutme') { refreshProfileInfo(); renderEducationTimeline(); renderPublications(); }
        if (viewId === 'subjects') renderSubjects();
        if (viewId === 'create-assignment') populateSubjectsDropdown();
        if (viewId === 'simulator') renderSimulatorExams();
        if (viewId === 'reports') renderReports();
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const target = item.getAttribute('data-target');
            if (target) navigateToView(target);
        });
    });

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('eg_theme', nextTheme);
    });

    const savedTheme = localStorage.getItem('eg_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    function updateClock() {
        const now = new Date();
        liveClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    setInterval(updateClock, 1000);
    updateClock();

    // -----------------------------------------------------------------
    // 4. PORTFOLIO AND BIO ENGINE ("ABOUT ME" UPGRADES)
    // -----------------------------------------------------------------
    
    function refreshProfileInfo() {
        const shortInitial = profile.name.replace("Professor ", "").replace("Dr. ", "").charAt(0);
        
        sidebarName.textContent = profile.name;
        dashWelcomeName.textContent = profile.name;
        if (profile.avatar) {
            sidebarAvatar.innerHTML = `<img src="${profile.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            dashAvatar.innerHTML = `<img src="${profile.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            profilePreviewAvatar.innerHTML = `<img src="${profile.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else {
            sidebarAvatar.textContent = shortInitial;
            dashAvatar.textContent = shortInitial;
            profilePreviewAvatar.textContent = shortInitial;
        }

        dashName.textContent = profile.name;
        dashTitle.textContent = profile.title;
        dashOffice.textContent = profile.office;
        dashEmail.textContent = profile.email;

        profilePreviewName.textContent = profile.name;
        profilePreviewTitle.textContent = profile.title;
        profilePreviewBio.textContent = profile.bio;
        profileStatSubjects.textContent = subjects.length;
        profileStatYears.textContent = `${profile.experience}+`;

        // Banner class sync
        profileCardBanner.className = `profile-banner banner-${profile.bannerTheme || 'indigo'}`;

        document.getElementById('profName').value = profile.name;
        document.getElementById('profTitle').value = profile.title;
        document.getElementById('profBio').value = profile.bio;
        document.getElementById('profEmail').value = profile.email;
        document.getElementById('profOffice').value = profile.office;
        document.getElementById('profExpertise').value = profile.expertise;
        document.getElementById('profExperience').value = profile.experience;
        
        if(document.getElementById('profGithub')) {
             document.getElementById('profGithub').value = profile.github || '';
        }
        
        const githubPill = document.querySelector('.social-pills a:first-child');
        if(githubPill) {
            if (profile.github) {
                githubPill.href = profile.github;
                githubPill.style.display = 'inline-flex';
            } else {
                githubPill.style.display = 'none';
            }
        }
        
        // Sync Banner preset select
        const radioPreset = document.querySelector(`input[name="bannerTheme"][value="${profile.bannerTheme || 'indigo'}"]`);
        if (radioPreset) radioPreset.checked = true;
    }

    // Avatar conversions
    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                profile.avatar = uploadEvent.target.result;
                saveProfile();
                refreshProfileInfo();
            };
            reader.readAsDataURL(file);
        }
    };
    avatarUploadInput.addEventListener('change', handleAvatarUpload);
    if(formAvatarUpload) formAvatarUpload.addEventListener('change', handleAvatarUpload);

    // Profile Submit
    profileEditForm.addEventListener('submit', (e) => {
        e.preventDefault();
        profile.name = document.getElementById('profName').value;
        profile.title = document.getElementById('profTitle').value;
        profile.bio = document.getElementById('profBio').value;
        profile.email = document.getElementById('profEmail').value;
        profile.office = document.getElementById('profOffice').value;
        profile.expertise = document.getElementById('profExpertise').value;
        profile.experience = parseInt(document.getElementById('profExperience').value) || 0;
        
        if (document.getElementById('profGithub')) {
            profile.github = document.getElementById('profGithub').value;
        }

        profile.bannerTheme = document.querySelector('input[name="bannerTheme"]:checked').value;

        saveProfile();
        refreshProfileInfo();
        alert("Success! Profile details updated successfully.");
    });

    // --- ACADEMIC TIMELINE RENDERING ---
    function renderEducationTimeline() {
        timelineList.innerHTML = '';
        if (education.length === 0) {
            timelineList.innerHTML = `<div class="empty-state"><p>No timeline records added. Click "+ Add Node" to start.</p></div>`;
            return;
        }

        education.forEach(node => {
            const card = document.createElement('div');
            card.className = 'timeline-node-card';
            card.innerHTML = `
                <span class="timeline-node-dot type-${node.type}"></span>
                <div class="timeline-node-header">
                    <span class="timeline-node-title">${node.title}</span>
                    <div style="display:flex;align-items:center;gap:0.5rem;">
                        <span class="timeline-node-years">${node.years}</span>
                        <button type="button" class="timeline-node-delete" data-id="${node.id}">&times;</button>
                    </div>
                </div>
                <div class="timeline-node-institution">${node.institution}</div>
            `;

            card.querySelector('.timeline-node-delete').addEventListener('click', () => {
                education = education.filter(eItem => eItem.id !== node.id);
                saveEducation();
                renderEducationTimeline();
            });

            timelineList.appendChild(card);
        });
    }

    // Modal timeline bindings
    addTimelineItemBtn.addEventListener('click', () => addTimelineModal.classList.add('active'));
    closeTimelineModal.addEventListener('click', () => addTimelineModal.classList.remove('active'));
    cancelTimelineBtn.addEventListener('click', () => addTimelineModal.classList.remove('active'));

    timelineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newNode = {
            id: `edu-${Date.now()}`,
            title: document.getElementById('tlTitle').value,
            institution: document.getElementById('tlInstitution').value,
            years: document.getElementById('tlYears').value,
            type: document.getElementById('tlType').value
        };

        education.push(newNode);
        saveEducation();
        renderEducationTimeline();
        
        timelineForm.reset();
        addTimelineModal.classList.remove('active');
    });

    // --- ACADEMIC PUBLICATIONS RENDERING ---
    function renderPublications() {
        publicationsList.innerHTML = '';
        if (publications.length === 0) {
            publicationsList.innerHTML = `<div class="empty-state"><p>No academic publications added yet.</p></div>`;
            return;
        }

        publications.forEach(pub => {
            const card = document.createElement('div');
            card.className = 'publication-item';
            card.innerHTML = `
                <div class="pub-info-box">
                    <div class="pub-item-title">${pub.title}</div>
                    <div class="pub-item-journal">Published in: ${pub.journal} | Issued: ${pub.year}</div>
                </div>
                <button type="button" class="timeline-node-delete pub-delete-btn" data-id="${pub.id}">&times;</button>
            `;

            card.querySelector('.pub-delete-btn').addEventListener('click', () => {
                publications = publications.filter(pItem => pItem.id !== pub.id);
                savePublications();
                renderPublications();
            });

            publicationsList.appendChild(card);
        });
    }

    addPublicationBtn.addEventListener('click', () => addPubModal.classList.add('active'));
    closePubModal.addEventListener('click', () => addPubModal.classList.remove('active'));
    cancelPubBtn.addEventListener('click', () => addPubModal.classList.remove('active'));

    pubForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPub = {
            id: `pub-${Date.now()}`,
            title: document.getElementById('pubTitle').value,
            journal: document.getElementById('pubJournal').value,
            year: document.getElementById('pubYear').value
        };

        publications.push(newPub);
        savePublications();
        renderPublications();

        pubForm.reset();
        addPubModal.classList.remove('active');
    });


    // -----------------------------------------------------------------
    // 5. SUBJECTS MANAGEMENT ENGINE
    // -----------------------------------------------------------------
    
    function renderSubjects() {
        subjectsContainer.innerHTML = '';
        
        if (subjects.length === 0) {
            subjectsContainer.innerHTML = `<div class="empty-state card-glass" style="grid-column: 1 / -1;"><p>No academic subjects in your curriculum yet. Click "Add New Subject" to begin.</p></div>`;
            return;
        }

        subjects.forEach(sub => {
            const card = document.createElement('div');
            card.className = `subject-card card-glass accent-${sub.theme}`;
            const subAssignments = assignments.filter(a => a.subjectId === sub.id).length;

            card.innerHTML = `
                <div class="subject-card-header">
                    <span class="subj-badge">${sub.code}</span>
                    <button class="subj-delete-btn" data-id="${sub.id}">&times;</button>
                </div>
                <div>
                    <h4 class="subj-title">${sub.name}</h4>
                    <span class="subj-semester">${sub.year}</span>
                </div>
                <div class="subj-footer">
                    <div class="subj-stat">
                        <span class="subj-dot"></span>
                        <span>${sub.studentsCount} Students Enrolled</span>
                    </div>
                    <div class="subj-stat">
                        <span>${subAssignments} Exam sheets</span>
                    </div>
                </div>
            `;
            
            card.querySelector('.subj-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to remove the subject ${sub.code}?`)) {
                    subjects = subjects.filter(item => item.id !== sub.id);
                    saveSubjects();
                    renderSubjects();
                    refreshProfileInfo();
                }
            });
            subjectsContainer.appendChild(card);
        });
    }

    openAddSubjectBtn.addEventListener('click', () => addSubjectModal.classList.add('active'));
    closeAddSubjectModal.addEventListener('click', () => addSubjectModal.classList.remove('active'));
    cancelSubjectBtn.addEventListener('click', () => addSubjectModal.classList.remove('active'));

    addSubjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newSub = {
            id: `sub-${Date.now()}`,
            name: document.getElementById('subjectName').value,
            code: document.getElementById('subjectCode').value,
            year: document.getElementById('subjectYear').value,
            theme: document.querySelector('input[name="subjectTheme"]:checked').value,
            studentsCount: Math.floor(Math.random() * 40) + 20
        };
        subjects.push(newSub);
        saveSubjects();
        renderSubjects();
        refreshProfileInfo();
        
        addSubjectForm.reset();
        addSubjectModal.classList.remove('active');
    });

    // -----------------------------------------------------------------
    // 6. DYNAMIC ASSIGNMENT SCHEDULER & CREATOR (UPGRADED MULTI-FORMAT)
    // -----------------------------------------------------------------
    let questionIndexCount = 0;

    function populateSubjectsDropdown() {
        assignSubjectSelect.innerHTML = '<option value="" disabled selected>Select Subject...</option>';
        subjects.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.id;
            opt.textContent = `${sub.code} - ${sub.name}`;
            assignSubjectSelect.appendChild(opt);
        });
    }

    // Dynamic Creator Block adding specific structures
    function createQuestionBlock(type = "MCQ") {
        questionIndexCount++;
        noQuestionsState.style.display = 'none';

        const qCard = document.createElement('div');
        qCard.className = 'question-builder-card';
        qCard.id = `qCard-${questionIndexCount}`;
        qCard.setAttribute('data-qtype', type);

        let inputsHTML = '';

        if (type === "MCQ") {
            inputsHTML = `
                <div class="form-group">
                    <label>Question Statement (Single Select)</label>
                    <input type="text" class="form-control question-statement" placeholder="e.g., Which protocol runs on port 443?" required>
                </div>
                <div class="mcq-options-grid">
                    <div class="form-group"><label>Option A</label><input type="text" class="form-control opt-a" placeholder="Option A" required></div>
                    <div class="form-group"><label>Option B</label><input type="text" class="form-control opt-b" placeholder="Option B" required></div>
                    <div class="form-group"><label>Option C</label><input type="text" class="form-control opt-c" placeholder="Option C" required></div>
                    <div class="form-group"><label>Option D</label><input type="text" class="form-control opt-d" placeholder="Option D" required></div>
                </div>
                <div class="form-group" style="width: 50%;">
                    <label>Correct Answer Letter</label>
                    <select class="form-control correct-answer" required>
                        <option value="A">Option A</option><option value="B">Option B</option><option value="C">Option C</option><option value="D">Option D</option>
                    </select>
                </div>
            `;
        } else if (type === "MSQ") {
            inputsHTML = `
                <div class="form-group">
                    <label>Question Statement (Multi-Select Checkboxes)</label>
                    <input type="text" class="form-control question-statement" placeholder="e.g., Select all symmetric encryption algorithms:" required>
                </div>
                <div class="mcq-options-grid">
                    <div class="form-group"><label>Option A</label><input type="text" class="form-control opt-a" placeholder="Option A" required></div>
                    <div class="form-group"><label>Option B</label><input type="text" class="form-control opt-b" placeholder="Option B" required></div>
                    <div class="form-group"><label>Option C</label><input type="text" class="form-control opt-c" placeholder="Option C" required></div>
                    <div class="form-group"><label>Option D</label><input type="text" class="form-control opt-d" placeholder="Option D" required></div>
                </div>
                <div class="form-group">
                    <label>Correct Choice Configuration (Check all that apply)</label>
                    <div style="display:flex;gap:1.5rem;margin-top:0.35rem;">
                        <label class="msq-checkbox-group"><input type="checkbox" class="msq-correct" value="A"> <span>Option A</span></label>
                        <label class="msq-checkbox-group"><input type="checkbox" class="msq-correct" value="B"> <span>Option B</span></label>
                        <label class="msq-checkbox-group"><input type="checkbox" class="msq-correct" value="C"> <span>Option C</span></label>
                        <label class="msq-checkbox-group"><input type="checkbox" class="msq-correct" value="D"> <span>Option D</span></label>
                    </div>
                </div>
            `;
        } else if (type === "TF") {
            inputsHTML = `
                <div class="form-group">
                    <label>Question Statement (True or False)</label>
                    <input type="text" class="form-control question-statement" placeholder="e.g., AES-256 is stronger than AES-128." required>
                </div>
                <div class="form-group" style="width:50%;">
                    <label>Correct Answer</label>
                    <div class="tf-selection-pill">
                        <label class="tf-pill"><input type="radio" name="tf-correct-${questionIndexCount}" value="True" checked><span>True</span></label>
                        <label class="tf-pill"><input type="radio" name="tf-correct-${questionIndexCount}" value="False"><span>False</span></label>
                    </div>
                </div>
            `;
        } else if (type === "WRITTEN") {
            inputsHTML = `
                <div class="form-group">
                    <label>Subjective Essay Prompt</label>
                    <input type="text" class="form-control question-statement" placeholder="e.g. Discuss the social implications of blockchain decentralization." required>
                </div>
                <div class="form-group">
                    <label>Grading Criteria / Key Guideline Remarks (Optional)</label>
                    <textarea class="form-control grading-remarks" rows="2" placeholder="Keywords to look for: immutability, consensus, trustless..."></textarea>
                </div>
            `;
        }

        qCard.innerHTML = `
            <span class="q-badge">${type} Question #${questionIndexCount}</span>
            <button type="button" class="q-delete-btn">&times;</button>
            <div class="q-inputs">${inputsHTML}</div>
        `;

        qCard.querySelector('.q-delete-btn').addEventListener('click', () => {
            qCard.remove();
            reorderQuestionBadges();
        });

        questionsContainer.appendChild(qCard);
        questionsContainer.scrollTop = questionsContainer.scrollHeight;
    }

    function reorderQuestionBadges() {
        const cards = questionsContainer.querySelectorAll('.question-builder-card');
        if (cards.length === 0) {
            noQuestionsState.style.display = 'block';
            questionIndexCount = 0;
            return;
        }
        questionIndexCount = 0;
        cards.forEach(card => {
            questionIndexCount++;
            const type = card.getAttribute('data-qtype');
            card.querySelector('.q-badge').textContent = `${type} Question #${questionIndexCount}`;
        });
    }

    // Bind triggers
    document.querySelectorAll('.add-q-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            createQuestionBlock(btn.getAttribute('data-type'));
        });
    });

    // Save scheduled assignment
    submitAssignmentBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('assignTitle').value;
        const subjectId = assignSubjectSelect.value;
        const activeTime = document.getElementById('assignActiveTime').value;
        const limitSelect = document.getElementById('assignViolationLimit').value;
        
        if (!title || !subjectId || !activeTime) {
            alert("Error: Please fill in all configuration parameters.");
            return;
        }

        const questionCards = questionsContainer.querySelectorAll('.question-builder-card');
        if (questionCards.length === 0) {
            alert("Error: Add at least one question to this assignment.");
            return;
        }

        const questionsList = [];
        let validInputs = true;

        questionCards.forEach((card, idx) => {
            const type = card.getAttribute('data-qtype');
            const statement = card.querySelector('.question-statement').value;
            
            if (!statement) validInputs = false;

            let options = {};
            let correct = "";

            if (type === "MCQ") {
                const optA = card.querySelector('.opt-a').value;
                const optB = card.querySelector('.opt-b').value;
                const optC = card.querySelector('.opt-c').value;
                const optD = card.querySelector('.opt-d').value;
                correct = card.querySelector('.correct-answer').value;

                if (!optA || !optB || !optC || !optD) validInputs = false;
                options = { A: optA, B: optB, C: optC, D: optD };
            } else if (type === "MSQ") {
                const optA = card.querySelector('.opt-a').value;
                const optB = card.querySelector('.opt-b').value;
                const optC = card.querySelector('.opt-c').value;
                const optD = card.querySelector('.opt-d').value;

                if (!optA || !optB || !optC || !optD) validInputs = false;
                options = { A: optA, B: optB, C: optC, D: optD };

                const correctChecks = [];
                card.querySelectorAll('.msq-correct:checked').forEach(chk => {
                    correctChecks.push(chk.value);
                });
                correct = correctChecks; // array
            } else if (type === "TF") {
                options = { True: "True", False: "False" };
                const radioName = card.querySelector('input[type="radio"]:checked');
                correct = radioName ? radioName.value : "True";
            } else if (type === "WRITTEN") {
                options = {};
                correct = card.querySelector('.grading-remarks').value; // rubric
            }

            questionsList.push({
                id: `q-${idx + 1}`,
                type: type,
                text: statement,
                options: options,
                correct: correct
            });
        });

        if (!validInputs) {
            alert("Error: Please write content for all statements.");
            return;
        }

        const newAssignment = {
            id: `assign-${Date.now()}`,
            title: title,
            subjectId: subjectId,
            activeTime: activeTime,
            duration: 25,
            violationLimit: parseInt(limitSelect),
            questions: questionsList
        };

        assignments.push(newAssignment);
        saveAssignments();

        alert(`Exam "${title}" successfully scheduled!`);
        
        assignmentCreateForm.reset();
        questionsContainer.innerHTML = '';
        questionsContainer.appendChild(noQuestionsState);
        noQuestionsState.style.display = 'block';
        questionIndexCount = 0;

        navigateToView('simulator');
    });

    // -----------------------------------------------------------------
    // 7. EXAM SIMULATOR PORTAL (STUDENT PERSPECTIVE)
    // -----------------------------------------------------------------
    
    function renderSimulatorExams() {
        availableExamsContainer.innerHTML = '';
        if (assignments.length === 0) {
            availableExamsContainer.innerHTML = `<div class="empty-state"><p>No assignments have been scheduled yet.</p></div>`;
            return;
        }

        assignments.forEach(assign => {
            const sub = subjects.find(s => s.id === assign.subjectId) || { code: "UNKN", name: "General Subject" };
            const activeDate = new Date(assign.activeTime);
            const now = new Date();
            const isActive = now >= activeDate;

            const examCard = document.createElement('div');
            examCard.className = 'exam-run-card';
            
            let statusBadgeHTML = '';
            let actionBtnHTML = '';

            if (isActive) {
                statusBadgeHTML = `<span class="badge active" style="margin-left: 0.5rem;">ACTIVE</span>`;
                actionBtnHTML = `<button class="btn btn-sm btn-primary run-exam-btn" data-id="${assign.id}">Enter Exam Room</button>`;
            } else {
                statusBadgeHTML = `<span class="badge" style="margin-left: 0.5rem; background-color: var(--accent-indigo); color: white;">SCHEDULED</span>`;
                actionBtnHTML = `<button class="btn btn-sm btn-secondary run-exam-btn" data-id="${assign.id}">Check Gateway</button>`;
            }

            examCard.innerHTML = `
                <div class="exam-run-details">
                    <h4>${assign.title} ${statusBadgeHTML}</h4>
                    <p><strong>Subject:</strong> ${sub.code} - ${sub.name} | <strong>Starts:</strong> ${activeDate.toLocaleString()} | <strong>Duration:</strong> 25 mins</p>
                </div>
                <div class="exam-run-actions">
                    ${actionBtnHTML}
                    <button class="btn btn-sm btn-danger delete-exam-btn" data-id="${assign.id}" style="margin-left: 0.5rem; padding: 0.4rem 0.6rem;">&times;</button>
                </div>
            `;

            examCard.querySelector('.run-exam-btn').addEventListener('click', () => {
                launchStudentGateway(assign);
            });

            examCard.querySelector('.delete-exam-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Remove assignment "${assign.title}"?`)) {
                    assignments = assignments.filter(item => item.id !== assign.id);
                    saveAssignments();
                    renderSimulatorExams();
                }
            });

            availableExamsContainer.appendChild(examCard);
        });
    }

    function launchStudentGateway(assignment) {
        activeExamContext = assignment;
        const sub = subjects.find(s => s.id === assignment.subjectId) || { name: "General Science" };

        gwExamTitle.textContent = assignment.title;
        gwExamSubject.textContent = sub.name;
        studentGateway.classList.add('active');

        if (gatewayTimer) clearInterval(gatewayTimer);
        
        function checkActivationTime() {
            const now = Date.now();
            const target = new Date(assignment.activeTime).getTime();
            const diff = target - now;

            if (diff <= 0) {
                gwExamStatus.textContent = "READY";
                gwExamStatus.className = "badge active";
                gwCountdownBox.style.display = "none";
                startSecureExamBtn.disabled = false;
                startSecureExamBtn.textContent = "Launch Sandbox Exam";
                clearInterval(gatewayTimer);
            } else {
                gwExamStatus.textContent = "WAITING";
                gwExamStatus.className = "badge";
                gwCountdownBox.style.display = "flex";
                startSecureExamBtn.disabled = true;
                startSecureExamBtn.textContent = "Waiting for Active Time";
                
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);

                gwCountdownDigits.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }

        checkActivationTime();
        gatewayTimer = setInterval(checkActivationTime, 1000);
    }

    exitGatewayBtn.addEventListener('click', () => {
        studentGateway.classList.remove('active');
        if (gatewayTimer) clearInterval(gatewayTimer);
    });

    // -----------------------------------------------------------------
    // 8. SECURE EXAM RUNTIME (LOCKDOWN ENFORCEMENT & WEBCAM PROCTOR)
    // -----------------------------------------------------------------

    startSecureExamBtn.addEventListener('click', async () => {
        if (!activeExamContext) return;

        const nameInput = simStudentName.value.trim() || "Alex Mercer";
        const idInput = simStudentId.value.trim() || "ST-99402";

        examRoomTitle.textContent = activeExamContext.title;
        examRoomStudent.textContent = `${nameInput} (${idInput})`;
        
        studentGateway.classList.remove('active');
        if (gatewayTimer) clearInterval(gatewayTimer);

        secureExamRoom.classList.add('active');

        studentViolationCounter = 0;
        studentViolationsLog = [];
        currentViolationCount.textContent = "0";
        allowedViolationLimit.textContent = activeExamContext.violationLimit;

        // Render multi-format questions
        renderExamRoomQuestions(activeExamContext.questions);

        logLocalSecurityEvent("SYSTEM_START", "Student entered examination sandbox. Lockdown engaged.");

        // WEBCAM CAPTURE OR FALLBACK RADAR SIMULATION
        engageWebcamStream();

        // INITIALIZE SECURITY ENGINES (security.js)
        examGuard = new SecureExamGuard({
            maxViolations: activeExamContext.violationLimit,
            onViolation: (type, details, totalCount, eventObj) => {
                studentViolationCounter = totalCount;
                logLocalSecurityEvent(type, details);
                
                currentViolationCount.textContent = studentViolationCounter;
                securityWarningText.textContent = `A security rule violation was detected: ${details} This incident has been logged.`;
                securityWarningOverlay.classList.add('active');
            },
            onLimitExceeded: (allViolations) => {
                alert("CRITICAL SECURITY VIOLATION: Maximum window-switch thresholds exceeded. Your exam is locked and has been submitted automatically.");
                submitStudentExamPaper("SECURITY_LOCKDOWN");
            }
        });

        const secureModeLocked = await examGuard.enable();
        if (!secureModeLocked) {
            alert("Warning: Fullscreen was denied by your browser. Although this mock simulation will proceed, in live proctoring this terminates access.");
        }

        secondsRemaining = 25 * 60; // 25 Minutes
        updateExamCountdownDisplay();
        
        examCountdownTimer = setInterval(() => {
            secondsRemaining--;
            updateExamCountdownDisplay();

            if (secondsRemaining <= 0) {
                clearInterval(examCountdownTimer);
                alert("TIME IS UP! Your 25-minute answering duration has expired. Submitting exam paper...");
                submitStudentExamPaper("TIME_EXPIRED");
            }
        }, 1000);
    });

    // Setup Video devices or Radar scanner simulations
    function engageWebcamStream() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    webcamVideo.srcObject = stream;
                    webcamVideo.style.display = 'block';
                    webcamRadarCanvas.style.display = 'none';
                    webcamStatusLabel.textContent = "AI Face Proctor: SECURED (WEB CAMERA ACTIVE)";
                })
                .catch(err => {
                    console.log("Webcam denied/unavailable, loading biometric radar scan simulation.");
                    runBiometricRadarScanning();
                });
        } else {
            runBiometricRadarScanning();
        }
    }

    function runBiometricRadarScanning() {
        webcamVideo.style.display = 'none';
        webcamRadarCanvas.style.display = 'block';
        webcamStatusLabel.textContent = "AI Face Proctor: BIOMETRIC SCANNING engaged";
    }

    function releaseWebcamStream() {
        if (webcamVideo.srcObject) {
            const stream = webcamVideo.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            webcamVideo.srcObject = null;
        }
    }

    function logLocalSecurityEvent(type, message) {
        studentViolationsLog.push({
            type: type,
            message: message,
            time: new Date().toLocaleTimeString()
        });
    }

    acknowledgeWarningBtn.addEventListener('click', () => {
        securityWarningOverlay.classList.remove('active');
        if (examGuard) examGuard.requestFullscreenLock();
    });

    function updateExamCountdownDisplay() {
        const mins = Math.floor(secondsRemaining / 60);
        const secs = secondsRemaining % 60;
        examTimerValue.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        if (secondsRemaining < 120) {
            examTimerValue.style.animation = "pulse 1s infinite";
        } else {
            examTimerValue.style.animation = "none";
        }
    }

    // Render proctor sheet dynamically supporting MCQ, MSQ, TF, WRITTEN options
    function renderExamRoomQuestions(questions) {
        examQuestionsContainer.innerHTML = '';
        
        questions.forEach((q, index) => {
            const qDiv = document.createElement('div');
            qDiv.className = 'student-question-card';
            
            let answersHTML = '';

            if (q.type === "MCQ") {
                answersHTML = `
                    <div class="student-mcq-options">
                        <label class="student-option-label"><input type="radio" name="student-q-${q.id}" value="A"><span class="student-option-text"><strong>A)</strong> ${q.options.A}</span></label>
                        <label class="student-option-label"><input type="radio" name="student-q-${q.id}" value="B"><span class="student-option-text"><strong>B)</strong> ${q.options.B}</span></label>
                        <label class="student-option-label"><input type="radio" name="student-q-${q.id}" value="C"><span class="student-option-text"><strong>C)</strong> ${q.options.C}</span></label>
                        <label class="student-option-label"><input type="radio" name="student-q-${q.id}" value="D"><span class="student-option-text"><strong>D)</strong> ${q.options.D}</span></label>
                    </div>
                `;
            } else if (q.type === "MSQ") {
                answersHTML = `
                    <div class="student-mcq-options">
                        <label class="student-option-label"><input type="checkbox" name="student-q-${q.id}" value="A"><span class="student-option-text"><strong>A)</strong> ${q.options.A}</span></label>
                        <label class="student-option-label"><input type="checkbox" name="student-q-${q.id}" value="B"><span class="student-option-text"><strong>B)</strong> ${q.options.B}</span></label>
                        <label class="student-option-label"><input type="checkbox" name="student-q-${q.id}" value="C"><span class="student-option-text"><strong>C)</strong> ${q.options.C}</span></label>
                        <label class="student-option-label"><input type="checkbox" name="student-q-${q.id}" value="D"><span class="student-option-text"><strong>D)</strong> ${q.options.D}</span></label>
                    </div>
                `;
            } else if (q.type === "TF") {
                answersHTML = `
                    <div class="student-mcq-options">
                        <label class="student-option-label"><input type="radio" name="student-q-${q.id}" value="True"><span class="student-option-text">True</span></label>
                        <label class="student-option-label"><input type="radio" name="student-q-${q.id}" value="False"><span class="student-option-text">False</span></label>
                    </div>
                `;
            } else if (q.type === "WRITTEN") {
                answersHTML = `
                    <textarea class="student-essay-textarea" name="student-q-${q.id}" placeholder="Type your subjective written answer response in full here..."></textarea>
                `;
            }

            qDiv.innerHTML = `
                <div class="student-q-header">
                    <span class="student-q-num">${index + 1}</span>
                    <span>${q.text}</span>
                </div>
                ${answersHTML}
            `;
            examQuestionsContainer.appendChild(qDiv);
        });
    }

    finishExamBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to submit your exam answers?")) {
            submitStudentExamPaper("MANUAL_SUBMIT");
        }
    });

    // Complete Student Exam session
    function submitStudentExamPaper(submitType = "MANUAL_SUBMIT") {
        clearInterval(examCountdownTimer);
        releaseWebcamStream();
        if (examGuard) {
            examGuard.disable();
            examGuard = null;
        }

        securityWarningOverlay.classList.remove('active');
        secureExamRoom.classList.remove('active');

        // Evaluate questions answers
        let scoreAutoPoints = 0;
        let scoreWrittenQuestions = 0;
        let totalAutoQuestions = 0;
        let containsWritten = false;

        const essayOutputs = [];

        activeExamContext.questions.forEach(q => {
            if (q.type === "MCQ") {
                totalAutoQuestions++;
                const selectedRadio = document.querySelector(`input[name="student-q-${q.id}"]:checked`);
                if (selectedRadio && selectedRadio.value === q.correct) {
                    scoreAutoPoints++;
                }
            } else if (q.type === "MSQ") {
                totalAutoQuestions++;
                const checkedBoxes = Array.from(document.querySelectorAll(`input[name="student-q-${q.id}"]:checked`)).map(c => c.value);
                // compare arrays
                const correctKeys = q.correct;
                const match = checkedBoxes.length === correctKeys.length && checkedBoxes.every(val => correctKeys.includes(val));
                if (match) {
                    scoreAutoPoints++;
                }
            } else if (q.type === "TF") {
                totalAutoQuestions++;
                const selectedRadio = document.querySelector(`input[name="student-q-${q.id}"]:checked`);
                if (selectedRadio && selectedRadio.value === q.correct) {
                    scoreAutoPoints++;
                }
            } else if (q.type === "WRITTEN") {
                containsWritten = true;
                scoreWrittenQuestions++;
                const essayText = document.querySelector(`textarea[name="student-q-${q.id}"]`).value;
                essayOutputs.push({
                    questionId: q.id,
                    questionText: q.text,
                    rubric: q.correct, // rubric keywords
                    studentResponse: essayText || "[No response recorded]",
                    score: 0, // initially 0
                    comments: ""
                });
            }
        });

        // Set grade state flags
        const maxAuto = totalAutoQuestions;
        let scoreText = "";
        let isGraded = true;
        let percentage = 0;

        if (containsWritten) {
            isGraded = false;
            scoreText = `${scoreAutoPoints} / ${maxAuto} + Written Pending`;
            percentage = Math.round((scoreAutoPoints / (maxAuto + scoreWrittenQuestions)) * 100);
        } else {
            scoreText = `${scoreAutoPoints} / ${maxAuto}`;
            percentage = maxAuto > 0 ? Math.round((scoreAutoPoints / maxAuto) * 100) : 0;
        }

        const studentNameVal = simStudentName.value.trim() || "Alex Mercer";
        const studentIdVal = simStudentId.value.trim() || "ST-99402";
        const sub = subjects.find(s => s.id === activeExamContext.subjectId) || { code: "GENR", name: "General Course" };

        logLocalSecurityEvent("SYSTEM_FINISH", `Exam submissions packaged via ${submitType}. System released.`);

        const newSubmission = {
            id: `subm-${Date.now()}`,
            studentName: studentNameVal,
            studentId: studentIdVal,
            assignmentTitle: activeExamContext.title,
            subjectCode: sub.code,
            subjectName: sub.name,
            score: scoreText,
            percentage: percentage,
            autoPoints: scoreAutoPoints,
            maxAutoPoints: maxAuto,
            containsWritten: containsWritten,
            isGraded: isGraded,
            essayAnswers: essayOutputs,
            violationsCount: studentViolationCounter,
            violationLog: [...studentViolationsLog],
            submitType: submitType,
            date: new Date().toLocaleString()
        };

        submissions.push(newSubmission);
        saveSubmissions();

        refreshDashboard();
        activeExamContext = null;

        navigateToView('reports');
        openAuditLogModal(newSubmission);
    }

    // -----------------------------------------------------------------
    // 9. AUDIT & SUBMISSIONS REPORTS ENGINE (UPGRADED MANUAL GRADING DESK)
    // -----------------------------------------------------------------
    
    function renderReports() {
        reportsTableBody.innerHTML = '';
        if (submissions.length === 0) {
            reportsTableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        No student submissions have been recorded yet. Set up an assignment and use the Simulator to generate reports.
                    </td>
                </tr>`;
            return;
        }

        [...submissions].reverse().forEach(sub => {
            const row = document.createElement('tr');
            
            let statusBadge = '';
            if (sub.submitType === "SECURITY_LOCKDOWN") {
                statusBadge = `<span class="report-badge failed">LOCKDOWN</span>`;
            } else if (!sub.isGraded) {
                statusBadge = `<span class="report-badge flagged" style="background-color:var(--accent-purple);color:white">UNGRADED</span>`;
            } else if (sub.violationsCount > 0) {
                statusBadge = `<span class="report-badge flagged">FLAGGED</span>`;
            } else {
                statusBadge = `<span class="report-badge passed">SECURED</span>`;
            }

            row.innerHTML = `
                <td><strong>${sub.studentName}</strong> <br><small style="color:var(--text-muted)">${sub.studentId}</small></td>
                <td>${sub.assignmentTitle}</td>
                <td><span class="subj-badge">${sub.subjectCode}</span></td>
                <td><strong>${sub.score}</strong> <br><small style="color:var(--text-muted)">${sub.percentage}%</small></td>
                <td><span class="${sub.violationsCount > 0 ? 'text-danger' : ''}" style="font-weight:700">${sub.violationsCount}</span></td>
                <td>${statusBadge}</td>
                <td><small>${sub.date}</small></td>
                <td><button class="btn btn-sm btn-secondary view-audit-btn" data-id="${sub.id}">Audit Log</button></td>
            `;

            row.querySelector('.view-audit-btn').addEventListener('click', () => {
                openAuditLogModal(sub);
            });

            reportsTableBody.appendChild(row);
        });
    }

    function openAuditLogModal(submission) {
        activeAuditSubmission = submission;
        
        violationModalHeader.textContent = `Security Audit: ${submission.assignmentTitle}`;
        auditStudentName.textContent = `${submission.studentName} (${submission.studentId})`;
        auditScore.textContent = `${submission.score} (${submission.percentage}%)`;
        auditViolationsCount.textContent = submission.violationsCount;
        
        let typeText = 'Manual Submission';
        if (submission.submitType === 'SECURITY_LOCKDOWN') typeText = 'Force Lockdown Submission';
        if (submission.submitType === 'TIME_EXPIRED') typeText = 'Timer Auto-Submission';
        auditSubmitType.textContent = typeText;

        // Render violations timeline
        auditTimeline.innerHTML = '';
        submission.violationLog.forEach(log => {
            const tItem = document.createElement('div');
            let extraClass = 'system';
            if (log.type !== 'SYSTEM_START' && log.type !== 'SYSTEM_FINISH') {
                extraClass = 'violation';
            }
            tItem.className = `timeline-item ${extraClass}`;
            tItem.innerHTML = `
                <div class="timeline-time">${log.time}</div>
                <div class="timeline-text"><strong>[${log.type}]</strong> ${log.message}</div>
            `;
            auditTimeline.appendChild(tItem);
        });

        // ACTIVATE DYNAMIC TEACHER GRADING DESK
        if (submission.containsWritten && !submission.isGraded) {
            gradingWorkspace.style.display = 'block';
            renderGradingDeskWrittenList(submission.essayAnswers);
        } else {
            gradingWorkspace.style.display = 'none';
        }

        violationDetailModal.classList.add('active');
    }

    // Generate subjective essay review questions list
    function renderGradingDeskWrittenList(essayAnswers) {
        writtenQuestionsGradingList.innerHTML = '';
        
        essayAnswers.forEach((ans, idx) => {
            const block = document.createElement('div');
            block.className = 'written-question-grading-card';
            block.innerHTML = `
                <div class="wq-statement">Q${idx + 1}: ${ans.questionText}</div>
                ${ans.rubric ? `<div class="wq-answer-label" style="color:var(--accent-cyan);margin-bottom:0.25rem;"><strong>Teacher Rubric Guideline:</strong> ${ans.rubric}</div>` : ''}
                <div class="wq-answer-label">Student Answering Response:</div>
                <div class="wq-student-answer">${ans.studentResponse.replace(/\n/g, '<br>')}</div>
                
                <div class="form-row" style="margin-top:0.75rem;">
                    <div class="form-group" style="width:30%;">
                        <label>Award Points (Max 10)</label>
                        <input type="number" class="form-control award-points-input" data-idx="${idx}" min="0" max="10" value="0" required>
                    </div>
                    <div class="form-group" style="flex:1;">
                        <label>Remarks Feedback Comments</label>
                        <input type="text" class="form-control award-feedback-input" data-idx="${idx}" placeholder="e.g. Well discussed differences. Missed vertex metrics.">
                    </div>
                </div>
            `;
            writtenQuestionsGradingList.appendChild(block);
        });
    }

    // Grade submissions forms
    gradingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!activeAuditSubmission) return;

        const cardsPoints = writtenQuestionsGradingList.querySelectorAll('.award-points-input');
        const cardsComments = writtenQuestionsGradingList.querySelectorAll('.award-feedback-input');

        let subjectiveTotalAwarded = 0;
        const maxSubjective = activeAuditSubmission.essayAnswers.length * 10;

        cardsPoints.forEach((input, idx) => {
            const pts = parseInt(input.value) || 0;
            const comment = cardsComments[idx].value;

            activeAuditSubmission.essayAnswers[idx].score = pts;
            activeAuditSubmission.essayAnswers[idx].comments = comment;
            subjectiveTotalAwarded += pts;
        });

        // Update scores math
        const autoScore = activeAuditSubmission.autoPoints;
        const maxAuto = activeAuditSubmission.maxAutoPoints;
        
        // Let's assume each auto question is worth 10 points for balance, or keep it standard:
        // Total points earned = autoScore + subjectiveScore (where auto questions are 10 points each too for equal grading weights)
        // Let's make auto points worth 10 points each for consistency:
        const earnedPointsSum = (autoScore * 10) + subjectiveTotalAwarded;
        const maxPointsSum = (maxAuto * 10) + maxSubjective;

        const newPercentage = maxPointsSum > 0 ? Math.round((earnedPointsSum / maxPointsSum) * 100) : 0;
        
        // Update submission
        activeAuditSubmission.isGraded = true;
        activeAuditSubmission.score = `${earnedPointsSum} / ${maxPointsSum}`;
        activeAuditSubmission.percentage = newPercentage;
        activeAuditSubmission.violationLog.push({
            type: "TEACHER_GRADING",
            message: `Teacher finalized grades: Awarded ${earnedPointsSum}/${maxPointsSum} points.`,
            time: new Date().toLocaleTimeString()
        });

        // Sync with base database array
        submissions = submissions.map(s => s.id === activeAuditSubmission.id ? activeAuditSubmission : s);
        saveSubmissions();

        // Refresh layouts
        refreshDashboard();
        renderReports();

        alert("Grades successfully calculated and saved!");
        
        // Hide desk and close modal
        gradingWorkspace.style.display = 'none';
        violationDetailModal.classList.remove('active');
        activeAuditSubmission = null;
    });

    closeViolationModal.addEventListener('click', () => violationDetailModal.classList.remove('active'));
    closeViolationModalBtn.addEventListener('click', () => violationDetailModal.classList.remove('active'));

    clearReportsBtn.addEventListener('click', () => {
        if (confirm("Reset and clear all student submission records?")) {
            submissions = [];
            saveSubmissions();
            renderReports();
            refreshDashboard();
        }
    });

    // -----------------------------------------------------------------
    // 10. SYSTEM METRICS SYNCHRONIZER (DASHBOARD REFRESH)
    // -----------------------------------------------------------------
    
    function refreshDashboard() {
        statSubjects.textContent = subjects.length;
        statAssignments.textContent = assignments.length;
        statSubmissions.textContent = submissions.length;
        
        const warningSum = submissions.reduce((sum, item) => sum + item.violationsCount, 0);
        statWarnings.textContent = warningSum;

        dashboardAssignmentsList.innerHTML = '';
        if (assignments.length === 0) {
            dashboardAssignmentsList.innerHTML = `<div class="empty-state"><p>No assignments created yet.</p></div>`;
            return;
        }

        assignments.slice(0, 3).forEach(assign => {
            const sub = subjects.find(s => s.id === assign.subjectId) || { code: "UNKN" };
            const activeDate = new Date(assign.activeTime);
            const now = new Date();
            const isActive = now >= activeDate;

            const div = document.createElement('div');
            div.className = 'dashboard-assign-item';
            div.innerHTML = `
                <div class="dash-assign-info">
                    <h5>${assign.title}</h5>
                    <p>Subject: ${sub.code} | Starts: ${activeDate.toLocaleString()}</p>
                </div>
                <div class="dash-assign-status">
                    ${isActive ? '<span class="badge active">ACTIVE</span>' : '<span class="badge">PENDING</span>'}
                </div>
            `;
            dashboardAssignmentsList.appendChild(div);
        });
    }

    // -----------------------------------------------------------------
    // 11. BOOTSTRAP INITIALIZATION
    // -----------------------------------------------------------------
    
    refreshProfileInfo();
    refreshDashboard();
    navigateToView('dashboard');
});
