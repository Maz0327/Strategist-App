// Strategic Content Capture Extension - Full Featured
document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = 'http://localhost:5000';
    
    // DOM elements
    const pageTitle = document.getElementById('pageTitle');
    const pageUrl = document.getElementById('pageUrl');
    const selectedText = document.getElementById('selectedText');
    const projectSelect = document.getElementById('projectSelect');
    const createProjectBtn = document.getElementById('createProjectBtn');
    const workspaceBtn = document.getElementById('workspaceBtn');
    const templateSection = document.getElementById('templateSection');
    const templateSectionGroup = document.getElementById('templateSectionGroup');
    const tagsGrid = document.getElementById('tagsGrid');
    const notesInput = document.getElementById('notesInput');
    const captureBtn = document.getElementById('captureBtn');
    const captureBtnText = document.getElementById('captureBtnText');
    const status = document.getElementById('status');
    const suggestions = document.getElementById('suggestions');
    
    // Modal elements
    const projectModal = document.getElementById('projectModal');
    const newProjectName = document.getElementById('newProjectName');
    const newProjectDesc = document.getElementById('newProjectDesc');
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    const cancelProjectBtn = document.getElementById('cancelProjectBtn');

    // State
    let currentTab = null;
    let captureMode = 'text';
    let selectedTags = [];
    let currentProjects = [];
    let selectedProject = null;
    let capturedScreenshot = null;

    // Core strategic tags
    const CORE_TAGS = [
        'cultural-moment', 'human-behavior', 'rival-content', 
        'visual-hook', 'insight-cue', 'trend-signal'
    ];

    // Initialize
    await initializeExtension();

    // Event Listeners
    setupEventListeners();

    async function initializeExtension() {
        try {
            // Get current tab info
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            currentTab = tab;
            
            pageTitle.textContent = tab.title || 'Untitled Page';
            pageUrl.textContent = tab.url || '';

            // Get selected text if any
            await getSelectedText();
            
            // Load projects
            await loadProjects();
            
            // Auto-detect tags based on content
            await autoDetectTags();
            
            // Generate suggestions
            generateSuggestions();
            
        } catch (error) {
            console.error('Extension initialization error:', error);
            showStatus('Extension initialization failed', 'error');
        }
    }

    function setupEventListeners() {
        // Capture mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                captureMode = btn.dataset.mode;
                updateCaptureButton();
            });
        });

        // Project selection
        projectSelect.addEventListener('change', (e) => {
            selectedProject = e.target.value;
            updateWorkspaceButton();
            updateTemplateSection();
        });

        // Create project
        createProjectBtn.addEventListener('click', () => {
            projectModal.style.display = 'block';
            newProjectName.focus();
        });

        // Project modal
        saveProjectBtn.addEventListener('click', createNewProject);
        cancelProjectBtn.addEventListener('click', () => {
            projectModal.style.display = 'none';
            newProjectName.value = '';
            newProjectDesc.value = '';
        });

        // Workspace button
        workspaceBtn.addEventListener('click', openWorkspace);

        // Tag selection
        tagsGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-chip')) {
                const tag = e.target.dataset.tag;
                toggleTag(tag, e.target);
            }
        });

        // Capture button
        captureBtn.addEventListener('click', handleCapture);

        // Suggestions
        suggestions.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-chip')) {
                notesInput.value += (notesInput.value ? ' ' : '') + e.target.textContent;
            }
        });
    }

    async function getSelectedText() {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                function: () => window.getSelection().toString()
            });
            
            const text = results[0]?.result;
            if (text && text.trim()) {
                selectedText.textContent = text.substring(0, 200) + (text.length > 200 ? '...' : '');
                selectedText.style.display = 'block';
            }
        } catch (error) {
            console.log('Could not get selected text:', error);
        }
    }

    async function loadProjects() {
        try {
            const response = await fetch(`${API_BASE}/api/projects`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    currentProjects = data.data;
                    populateProjectDropdown();
                }
            } else {
                showStatus('Please log into the main app first', 'error');
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            showStatus('Connection error - check if app is running', 'error');
        }
    }

    function populateProjectDropdown() {
        // Clear existing options except first
        projectSelect.innerHTML = '<option value="">Select a project...</option>';
        
        currentProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    }

    async function createNewProject() {
        const name = newProjectName.value.trim();
        const description = newProjectDesc.value.trim();
        
        if (!name) {
            alert('Project name is required');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/projects`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    name,
                    description,
                    briefTemplateId: 'jimmy-johns-pac' // Default template
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Add to projects list
                    currentProjects.push(data.data);
                    populateProjectDropdown();
                    
                    // Select the new project
                    projectSelect.value = data.data.id;
                    selectedProject = data.data.id;
                    updateWorkspaceButton();
                    updateTemplateSection();
                    
                    // Close modal
                    projectModal.style.display = 'none';
                    newProjectName.value = '';
                    newProjectDesc.value = '';
                    
                    showStatus('Project created successfully!', 'success');
                }
            } else {
                showStatus('Failed to create project', 'error');
            }
        } catch (error) {
            console.error('Error creating project:', error);
            showStatus('Connection error', 'error');
        }
    }

    function updateWorkspaceButton() {
        if (selectedProject) {
            workspaceBtn.classList.add('visible');
        } else {
            workspaceBtn.classList.remove('visible');
        }
    }

    function updateTemplateSection() {
        if (selectedProject) {
            templateSectionGroup.style.display = 'block';
        } else {
            templateSectionGroup.style.display = 'none';
        }
    }

    function openWorkspace() {
        if (selectedProject) {
            chrome.tabs.create({
                url: `${API_BASE}/projects/${selectedProject}/workspace`
            });
        }
    }

    async function autoDetectTags() {
        try {
            const url = currentTab.url.toLowerCase();
            const title = currentTab.title.toLowerCase();
            
            // Auto-select tags based on content
            if (url.includes('tiktok') || url.includes('instagram') || title.includes('viral')) {
                selectTag('cultural-moment');
            }
            if (url.includes('linkedin') || title.includes('professional') || title.includes('business')) {
                selectTag('human-behavior');
            }
            if (url.includes('competitor') || title.includes('vs ') || title.includes('comparison')) {
                selectTag('rival-content');
            }
            if (url.includes('design') || url.includes('visual') || title.includes('creative')) {
                selectTag('visual-hook');
            }
        } catch (error) {
            console.log('Auto-tag detection error:', error);
        }
    }

    function selectTag(tagName) {
        const tagElement = document.querySelector(`[data-tag="${tagName}"]`);
        if (tagElement && !selectedTags.includes(tagName)) {
            toggleTag(tagName, tagElement);
        }
    }

    function toggleTag(tag, element) {
        if (selectedTags.includes(tag)) {
            selectedTags = selectedTags.filter(t => t !== tag);
            element.classList.remove('selected');
        } else {
            selectedTags.push(tag);
            element.classList.add('selected');
        }
    }

    function generateSuggestions() {
        const url = currentTab.url;
        const title = currentTab.title;
        const suggestionList = [];

        // Domain-based suggestions
        if (url.includes('tiktok.com')) {
            suggestionList.push('Viral potential analysis', 'Gen Z behavior insight', 'Trend adaptation opportunity');
        } else if (url.includes('linkedin.com')) {
            suggestionList.push('Professional insight', 'Industry trend signal', 'Thought leadership content');
        } else if (url.includes('instagram.com')) {
            suggestionList.push('Visual storytelling technique', 'Brand engagement strategy', 'Aesthetic trend');
        } else if (url.includes('youtube.com')) {
            suggestionList.push('Content format innovation', 'Creator strategy insight', 'Audience engagement pattern');
        } else {
            suggestionList.push('Strategic insight', 'Market signal', 'Consumer behavior pattern');
        }

        // Display suggestions
        suggestions.innerHTML = '';
        suggestionList.forEach(suggestion => {
            const chip = document.createElement('button');
            chip.className = 'suggestion-chip';
            chip.textContent = suggestion;
            suggestions.appendChild(chip);
        });
    }

    function updateCaptureButton() {
        switch (captureMode) {
            case 'text':
                captureBtnText.textContent = 'Capture Content';
                break;
            case 'screen':
                captureBtnText.textContent = 'Select & Capture Screen';
                break;
            case 'full':
                captureBtnText.textContent = 'Capture Full Page';
                break;
        }
    }

    async function handleCapture() {
        if (!selectedProject) {
            showStatus('Please select a project first', 'error');
            return;
        }

        captureBtn.disabled = true;
        captureBtnText.textContent = 'Capturing...';

        try {
            let captureData = {
                projectId: parseInt(selectedProject),
                title: currentTab.title || 'Untitled Capture',
                url: currentTab.url || '',
                userNotes: notesInput.value,
                templateSection: templateSection.value,
                tags: selectedTags,
                isDraft: true,
                status: 'capture',
                captureMode: captureMode,
                browserContext: {
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    domain: new URL(currentTab.url).hostname
                }
            };

            // Handle different capture modes
            switch (captureMode) {
                case 'screen':
                    await handleScreenCapture(captureData);
                    break;
                case 'full':
                    captureData.extractText = true;
                    break;
                case 'text':
                default:
                    // Get selected text if any
                    try {
                        const results = await chrome.scripting.executeScript({
                            target: { tabId: currentTab.id },
                            function: () => window.getSelection().toString()
                        });
                        captureData.selectedText = results[0]?.result || '';
                    } catch (error) {
                        console.log('Could not get selected text:', error);
                    }
                    break;
            }

            // Send to backend
            await saveCaptureData(captureData);

        } catch (error) {
            console.error('Capture error:', error);
            showStatus('Capture failed: ' + error.message, 'error');
        } finally {
            captureBtn.disabled = false;
            updateCaptureButton();
        }
    }

    async function handleScreenCapture(captureData) {
        try {
            // Request screen capture
            const streamId = await new Promise((resolve, reject) => {
                chrome.desktopCapture.chooseDesktopMedia(['screen', 'window', 'tab'], resolve);
            });

            if (!streamId) {
                throw new Error('Screen capture cancelled');
            }

            // Execute screen capture script
            const results = await chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                function: captureScreen,
                args: [streamId]
            });

            captureData.screenshot = results[0]?.result;
            captureData.extractText = true; // Extract text from screenshot

        } catch (error) {
            throw new Error('Screen capture failed: ' + error.message);
        }
    }

    // Function injected into page for screen capture
    function captureScreen(streamId) {
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: streamId
                    }
                }
            }).then(stream => {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                
                video.onloadedmetadata = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0);
                    
                    const dataURL = canvas.toDataURL('image/png');
                    
                    // Stop stream
                    stream.getTracks().forEach(track => track.stop());
                    
                    resolve(dataURL);
                };
            }).catch(reject);
        });
    }

    async function saveCaptureData(captureData) {
        const response = await fetch(`${API_BASE}/api/signals/draft`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(captureData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showStatus('Content captured successfully!', 'success');
            
            // Clear form
            notesInput.value = '';
            selectedTags = [];
            document.querySelectorAll('.tag-chip').forEach(chip => {
                chip.classList.remove('selected');
            });
            
            // Close popup after success
            setTimeout(() => {
                window.close();
            }, 1500);
        } else {
            throw new Error(result.error || 'Capture failed');
        }
    }

    function showStatus(message, type = 'success') {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
});