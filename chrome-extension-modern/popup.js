// Modern Strategic Content Capture Extension
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Strategic Content Capture Extension loaded');
    
    // State management
    const state = {
        currentTab: null,
        captureMode: 'text',
        analysisDepth: 'quick',
        priority: 'medium',
        selectedTags: [],
        selectedProject: null,
        projects: [],
        isConnected: false,
        selectedContent: null,
        isCapturing: false
    };
    
    // DOM elements
    const elements = {
        connectionStatus: document.getElementById('connectionStatus'),
        pageTitle: document.getElementById('pageTitle'),
        pageUrl: document.getElementById('pageUrl'),
        pageFavicon: document.getElementById('pageFavicon'),
        modeIndicator: document.getElementById('modeIndicator'),
        tagsGrid: document.getElementById('tagsGrid'),
        projectSelect: document.getElementById('projectSelect'),
        workspaceBtn: document.getElementById('workspaceBtn'),
        templateSection: document.getElementById('templateSection'),
        templateSectionSelect: document.getElementById('templateSectionSelect'),
        notesInput: document.getElementById('notesInput'),
        notesSuggestions: document.getElementById('notesSuggestions'),
        contentPreview: document.getElementById('contentPreview'),
        previewContent: document.getElementById('previewContent'),
        captureBtn: document.getElementById('captureBtn'),
        captureBtnText: document.getElementById('captureBtnText'),
        btnLoader: document.getElementById('btnLoader'),
        statusMessage: document.getElementById('statusMessage'),
        autoTagBtn: document.getElementById('autoTagBtn'),
        createProjectBtn: document.getElementById('createProjectBtn'),
        clearSelectionBtn: document.getElementById('clearSelectionBtn')
    };
    
    // Initialize extension
    await initializeExtension();
    
    async function initializeExtension() {
        try {
            // Test connection
            await testConnection();
            
            // Get current tab info
            await getCurrentTabInfo();
            
            // Load projects
            await loadProjects();
            
            // Setup event listeners
            setupEventListeners();
            
            // Initialize tags
            initializeTags();
            
            // Auto-tag based on current page
            autoTagCurrentPage();
            
            console.log('Extension initialized successfully');
        } catch (error) {
            console.error('Extension initialization failed:', error);
            showConnectionSetup();
        }
    }
    
    async function testConnection() {
        updateConnectionStatus('testing', 'Testing connection...');
        
        try {
            const isConnected = await CONFIG.testConnection();
            
            if (isConnected) {
                state.isConnected = true;
                updateConnectionStatus('connected', 'Connected');
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            state.isConnected = false;
            updateConnectionStatus('error', 'Connection failed');
            throw error;
        }
    }
    
    function updateConnectionStatus(status, message) {
        const statusDot = elements.connectionStatus.querySelector('.status-dot');
        const statusText = elements.connectionStatus.querySelector('span');
        
        statusDot.className = `status-dot ${status}`;
        statusText.textContent = message;
    }
    
    async function getCurrentTabInfo() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            state.currentTab = tab;
            
            // Update UI with tab info
            elements.pageTitle.textContent = tab.title || 'Untitled Page';
            elements.pageUrl.textContent = new URL(tab.url).hostname;
            
            // Set favicon
            if (tab.favIconUrl) {
                elements.pageFavicon.innerHTML = `<img src="${tab.favIconUrl}" alt="Favicon" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
            } else {
                elements.pageFavicon.textContent = '🌐';
            }
            
            // Get selected text if any
            await getSelectedText();
            
        } catch (error) {
            console.error('Failed to get tab info:', error);
            elements.pageTitle.textContent = 'Error loading page';
            elements.pageUrl.textContent = 'Unknown';
        }
    }
    
    async function getSelectedText() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => window.getSelection().toString().trim()
            });
            
            const selectedText = results[0]?.result;
            if (selectedText) {
                state.selectedContent = selectedText;
                showContentPreview(selectedText);
            }
        } catch (error) {
            console.log('Could not get selected text:', error);
        }
    }
    
    function showContentPreview(content) {
        elements.contentPreview.classList.remove('hidden');
        elements.previewContent.textContent = content.substring(0, 300) + (content.length > 300 ? '...' : '');
    }
    
    function hideContentPreview() {
        elements.contentPreview.classList.add('hidden');
        state.selectedContent = null;
    }
    
    async function loadProjects() {
        if (!state.isConnected) return;
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/projects`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                state.projects = await response.json();
                populateProjectSelect();
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
        }
    }
    
    function populateProjectSelect() {
        elements.projectSelect.innerHTML = '<option value="">Select project...</option>';
        
        state.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            elements.projectSelect.appendChild(option);
        });
    }
    
    function initializeTags() {
        elements.tagsGrid.innerHTML = '';
        
        CONFIG.STRATEGIC_TAGS.forEach(tag => {
            const tagElement = createTagElement(tag);
            elements.tagsGrid.appendChild(tagElement);
        });
    }
    
    function createTagElement(tag) {
        const tagDiv = document.createElement('div');
        tagDiv.className = 'tag-item';
        tagDiv.dataset.tagId = tag.id;
        
        tagDiv.innerHTML = `
            <div class="tag-emoji">${tag.emoji}</div>
            <div class="tag-content">
                <div class="tag-name">${tag.name}</div>
                <div class="tag-desc">${tag.description}</div>
            </div>
        `;
        
        tagDiv.addEventListener('click', () => toggleTag(tag.id));
        
        return tagDiv;
    }
    
    function toggleTag(tagId) {
        const tagElement = document.querySelector(`[data-tag-id="${tagId}"]`);
        const isSelected = state.selectedTags.includes(tagId);
        
        if (isSelected) {
            state.selectedTags = state.selectedTags.filter(id => id !== tagId);
            tagElement.classList.remove('selected');
        } else {
            state.selectedTags.push(tagId);
            tagElement.classList.add('selected');
        }
    }
    
    function autoTagCurrentPage() {
        if (!state.currentTab) return;
        
        const suggestedTags = CONFIG.getAutoTags(state.currentTab.url, state.currentTab.title);
        
        // Auto-select suggested tags
        suggestedTags.forEach(tagId => {
            if (!state.selectedTags.includes(tagId)) {
                state.selectedTags.push(tagId);
                const tagElement = document.querySelector(`[data-tag-id="${tagId}"]`);
                if (tagElement) {
                    tagElement.classList.add('selected');
                }
            }
        });
        
        // Show smart suggestions
        showSmartSuggestions();
    }
    
    function showSmartSuggestions() {
        if (!state.currentTab) return;
        
        const domain = new URL(state.currentTab.url).hostname;
        const contentType = CONFIG.detectContentType(state.currentTab.url, state.currentTab.title);
        const suggestions = CONFIG.getSmartSuggestions(contentType, domain);
        
        elements.notesSuggestions.innerHTML = '';
        suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-tag';
            suggestionElement.textContent = suggestion;
            suggestionElement.addEventListener('click', () => {
                const currentNotes = elements.notesInput.value;
                elements.notesInput.value = currentNotes + (currentNotes ? ' ' : '') + suggestion;
                elements.notesInput.focus();
            });
            elements.notesSuggestions.appendChild(suggestionElement);
        });
    }
    
    function setupEventListeners() {
        // Capture mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.mode-btn.active').classList.remove('active');
                btn.classList.add('active');
                state.captureMode = btn.dataset.mode;
                elements.modeIndicator.textContent = btn.textContent.trim();
                
                // Handle screen selection mode
                if (state.captureMode === 'selection') {
                    initiateScreenSelection();
                }
            });
        });
        
        // Analysis depth buttons
        document.querySelectorAll('.depth-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.depth-btn.active').classList.remove('active');
                btn.classList.add('active');
                state.analysisDepth = btn.dataset.depth;
            });
        });
        
        // Priority buttons
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.priority-btn.active').classList.remove('active');
                btn.classList.add('active');
                state.priority = btn.dataset.priority;
            });
        });
        
        // Auto-tag button
        elements.autoTagBtn.addEventListener('click', () => {
            // Clear current tags
            state.selectedTags = [];
            document.querySelectorAll('.tag-item.selected').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Apply auto-tags
            autoTagCurrentPage();
            
            showStatus('success', '✨ Auto-tags applied based on content analysis');
        });
        
        // Project selection
        elements.projectSelect.addEventListener('change', (e) => {
            state.selectedProject = e.target.value;
            
            if (state.selectedProject) {
                elements.workspaceBtn.classList.remove('hidden');
                elements.templateSection.classList.remove('hidden');
            } else {
                elements.workspaceBtn.classList.add('hidden');
                elements.templateSection.classList.add('hidden');
            }
        });
        
        // Create project button
        elements.createProjectBtn.addEventListener('click', showCreateProjectModal);
        
        // Workspace button
        elements.workspaceBtn.addEventListener('click', openWorkspace);
        
        // Clear selection button
        elements.clearSelectionBtn.addEventListener('click', hideContentPreview);
        
        // Capture button
        elements.captureBtn.addEventListener('click', captureContent);
        
        // Modal event listeners
        setupModalListeners();
    }
    
    async function initiateScreenSelection() {
        try {
            showStatus('warning', '🖼️ Click and drag to select screen area...');
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Inject screen selection script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content-selection.js']
            });
            
            // Listen for selection result
            const handleMessage = (message) => {
                if (message.type === 'SCREEN_SELECTION_COMPLETE') {
                    state.selectedContent = message.data;
                    showContentPreview(`Screenshot area selected: ${message.data.width}x${message.data.height}px`);
                    showStatus('success', '✅ Screen area selected successfully');
                    chrome.runtime.onMessage.removeListener(handleMessage);
                } else if (message.type === 'SCREEN_SELECTION_CANCELLED') {
                    showStatus('error', '❌ Screen selection cancelled');
                    chrome.runtime.onMessage.removeListener(handleMessage);
                }
            };
            
            chrome.runtime.onMessage.addListener(handleMessage);
            
        } catch (error) {
            console.error('Screen selection failed:', error);
            showStatus('error', '❌ Screen selection failed');
        }
    }
    
    function showCreateProjectModal() {
        document.getElementById('projectModalOverlay').classList.remove('hidden');
    }
    
    function hideCreateProjectModal() {
        document.getElementById('projectModalOverlay').classList.add('hidden');
        document.getElementById('newProjectName').value = '';
        document.getElementById('newProjectDesc').value = '';
    }
    
    async function createProject() {
        const name = document.getElementById('newProjectName').value.trim();
        const description = document.getElementById('newProjectDesc').value.trim();
        
        if (!name) {
            showStatus('error', '❌ Project name is required');
            return;
        }
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/projects`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description })
            });
            
            if (response.ok) {
                const newProject = await response.json();
                state.projects.push(newProject);
                populateProjectSelect();
                
                // Auto-select the new project
                elements.projectSelect.value = newProject.id;
                state.selectedProject = newProject.id;
                elements.workspaceBtn.classList.remove('hidden');
                elements.templateSection.classList.remove('hidden');
                
                hideCreateProjectModal();
                showStatus('success', `✅ Project "${name}" created successfully`);
            } else {
                throw new Error('Failed to create project');
            }
        } catch (error) {
            console.error('Project creation failed:', error);
            showStatus('error', '❌ Failed to create project');
        }
    }
    
    function openWorkspace() {
        if (state.selectedProject) {
            const workspaceUrl = `${CONFIG.API_BASE_URL}/projects/${state.selectedProject}/workspace`;
            chrome.tabs.create({ url: workspaceUrl });
        }
    }
    
    async function captureContent() {
        if (state.isCapturing) return;
        
        state.isCapturing = true;
        elements.captureBtn.disabled = true;
        elements.btnLoader.classList.remove('hidden');
        elements.captureBtnText.textContent = 'Capturing...';
        
        try {
            const captureData = await buildCaptureData();
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/signals/draft`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(captureData)
            });
            
            if (response.ok) {
                const result = await response.json();
                showStatus('success', '✅ Content captured successfully! Check your platform dashboard.');
                
                // Reset form after successful capture
                setTimeout(() => {
                    resetForm();
                }, 2000);
            } else {
                throw new Error('Capture failed');
            }
        } catch (error) {
            console.error('Capture failed:', error);
            showStatus('error', '❌ Failed to capture content. Please try again.');
        } finally {
            state.isCapturing = false;
            elements.captureBtn.disabled = false;
            elements.btnLoader.classList.add('hidden');
            elements.captureBtnText.textContent = 'Capture Content';
        }
    }
    
    async function buildCaptureData() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        let content = '';
        
        // Get content based on capture mode
        if (state.captureMode === 'text' || state.captureMode === 'full') {
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => {
                        // Extract meaningful content
                        const main = document.querySelector('main, article, .content, #content');
                        const content = main || document.body;
                        return content.innerText.trim();
                    }
                });
                content = results[0]?.result || '';
            } catch (error) {
                content = state.selectedContent || '';
            }
        } else if (state.captureMode === 'selection') {
            content = state.selectedContent || '';
        }
        
        return {
            title: tab.title,
            url: tab.url,
            content: content,
            user_notes: elements.notesInput.value.trim(),
            tags: state.selectedTags,
            project_id: state.selectedProject || null,
            template_section: elements.templateSectionSelect.value || null,
            analysis_mode: state.analysisDepth,
            priority: state.priority,
            capture_mode: state.captureMode,
            browser_context: {
                domain: new URL(tab.url).hostname,
                capture_method: 'extension_v3',
                extension_version: CONFIG.EXTENSION_VERSION,
                timestamp: new Date().toISOString()
            }
        };
    }
    
    function resetForm() {
        // Clear notes
        elements.notesInput.value = '';
        
        // Reset to default modes
        state.analysisDepth = 'quick';
        state.priority = 'medium';
        state.captureMode = 'text';
        
        // Update UI
        document.querySelector('.depth-btn.active').classList.remove('active');
        document.querySelector('[data-depth="quick"]').classList.add('active');
        
        document.querySelector('.priority-btn.active').classList.remove('active');
        document.querySelector('[data-priority="medium"]').classList.add('active');
        
        document.querySelector('.mode-btn.active').classList.remove('active');
        document.querySelector('[data-mode="text"]').classList.add('active');
        elements.modeIndicator.textContent = 'Text';
        
        // Clear selected content
        hideContentPreview();
        
        // Keep tags and project selection (user might want to capture more from same context)
    }
    
    function showStatus(type, message) {
        elements.statusMessage.className = `status-message ${type}`;
        elements.statusMessage.querySelector('.status-text').textContent = message;
        
        const icon = elements.statusMessage.querySelector('.status-icon');
        switch (type) {
            case 'success':
                icon.textContent = '✅';
                break;
            case 'error':
                icon.textContent = '❌';
                break;
            case 'warning':
                icon.textContent = '⚠️';
                break;
            default:
                icon.textContent = 'ℹ️';
        }
        
        elements.statusMessage.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            elements.statusMessage.classList.add('hidden');
        }, 5000);
    }
    
    function showConnectionSetup() {
        document.getElementById('setupModalOverlay').classList.remove('hidden');
    }
    
    function setupModalListeners() {
        // Project modal
        document.getElementById('closeProjectModal').addEventListener('click', hideCreateProjectModal);
        document.getElementById('cancelProjectBtn').addEventListener('click', hideCreateProjectModal);
        document.getElementById('saveProjectBtn').addEventListener('click', createProject);
        
        // Connection setup modal
        document.getElementById('openPlatformBtn').addEventListener('click', () => {
            chrome.tabs.create({ url: CONFIG.API_BASE_URL });
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey) {
            if (e.key === 'C') {
                e.preventDefault();
                captureContent();
            } else if (e.key === 'S') {
                e.preventDefault();
                // Switch to screen selection mode
                document.querySelector('[data-mode="selection"]').click();
            }
        }
    });
    
    console.log('Strategic Content Capture Extension ready');
});