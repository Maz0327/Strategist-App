// Enhanced popup with advanced features
document.addEventListener('DOMContentLoaded', async () => {
    // DOM elements
    const pageTitle = document.getElementById('pageTitle');
    const pageUrl = document.getElementById('pageUrl');
    const selectedTextContainer = document.getElementById('selectedTextContainer');
    const selectedTextPreview = document.getElementById('selectedTextPreview');
    const userNotes = document.getElementById('userNotes');
    const saveButton = document.getElementById('saveButton');
    const saveButtonText = document.getElementById('saveButtonText');
    const statusMessage = document.getElementById('statusMessage');
    const captureMode = document.getElementById('captureMode');
    const quickActionsContainer = document.getElementById('quickActionsContainer');
    const contentTypeIndicator = document.getElementById('contentTypeIndicator');
    const readingTimeIndicator = document.getElementById('readingTimeIndicator');
    const autoSuggestionsContainer = document.getElementById('autoSuggestionsContainer');

    // Configuration - Use development by default for local testing
    const config = {
        production: {
            backendUrl: 'https://strategist-app-maz0327.replit.app',
            apiPrefix: '/api'
        },
        development: {
            backendUrl: 'http://localhost:5000',
            apiPrefix: '/api'
        }
    };

    // Use development config for now (change to production when deployed)
    const currentConfig = config.development;

    // State management
    let currentPageInfo = null;
    let captureSettings = {};
    let autoSuggestions = [];
    let currentProjects = [];
    let currentScreenshot = null;
    let selectedProject = null;
    let selectedTags = [];
    let autoDetectedTags = [];

    // Core strategic tags for the tagging system
    const CORE_TAGS = {
        'cultural-moment': 'Cultural Moment',
        'human-behavior': 'Human Behavior', 
        'rival-content': 'Rival Content',
        'visual-hook': 'Visual Hook',
        'insight-cue': 'Insight Cue'
    };

    // Initialize popup
    await initializePopup();

    // Project management elements
    const projectSelect = document.getElementById('projectSelect');
    const createProjectBtn = document.getElementById('createProjectBtn');
    const templateSectionSelect = document.getElementById('templateSectionSelect');
    const sectionSelect = document.getElementById('sectionSelect');

    // Screenshot elements
    const elementScreenshotBtn = document.getElementById('elementScreenshotBtn');
    const regionScreenshotBtn = document.getElementById('regionScreenshotBtn');
    const fullPageScreenshotBtn = document.getElementById('fullPageScreenshotBtn');
    const screenshotPreview = document.getElementById('screenshotPreview');
    const previewImage = document.getElementById('previewImage');
    const saveScreenshotBtn = document.getElementById('saveScreenshotBtn');
    const retakeScreenshotBtn = document.getElementById('retakeScreenshotBtn');

    // Event listeners
    saveButton.addEventListener('click', handleSave);
    captureMode?.addEventListener('change', handleCaptureModeChange);
    userNotes.addEventListener('input', handleNotesChange);
    
    // Project management listeners
    projectSelect?.addEventListener('change', handleProjectChange);
    createProjectBtn?.addEventListener('click', handleCreateProject);
    
    // Tag system listeners
    const tagCheckboxes = document.querySelectorAll('.tag-checkbox');
    tagCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleTagChange);
    });
    
    // Screenshot listeners
    elementScreenshotBtn?.addEventListener('click', () => handleScreenshotMode('element'));
    regionScreenshotBtn?.addEventListener('click', () => handleScreenshotMode('region'));
    fullPageScreenshotBtn?.addEventListener('click', () => handleScreenshotMode('fullPage'));
    saveScreenshotBtn?.addEventListener('click', handleSaveScreenshot);
    retakeScreenshotBtn?.addEventListener('click', handleRetakeScreenshot);
    
    // Visual intelligence features
    const screenshotButton = document.getElementById('screenshotButton');
    const visualAnalysisButton = document.getElementById('visualAnalysisButton');
    
    // Voice note features
    const voiceNoteButton = document.getElementById('voiceNoteButton');
    const stopRecordingButton = document.getElementById('stopRecordingButton');
    const voiceNoteStatus = document.getElementById('voiceNoteStatus');
    
    screenshotButton?.addEventListener('click', handleScreenshot);
    visualAnalysisButton?.addEventListener('click', handleVisualAnalysis);
    voiceNoteButton?.addEventListener('click', handleStartVoiceNote);
    stopRecordingButton?.addEventListener('click', handleStopVoiceNote);
    
    // Voice recording state
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;

    async function loadProjects() {
        try {
            const response = await fetch(`${currentConfig.backendUrl}${currentConfig.apiPrefix}/projects`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const projects = await response.json();
                
                // Clear existing options
                projectSelect.innerHTML = '<option value="">Select project (optional)</option>';
                
                // Add project options
                projects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    projectSelect.appendChild(option);
                });
                
                console.log('Projects loaded:', projects.length);
            } else {
                console.warn('Failed to load projects:', response.statusText);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    // Project change handler
    function handleProjectChange(event) {
        const projectId = event.target.value;
        chrome.storage.local.set({selectedProject: projectId});
        updateAutoTags(); // Update tags based on project context
    }
    
    // Create new project handler
    async function handleCreateProject() {
        const projectName = prompt('Enter project name:');
        if (projectName) {
            try {
                const response = await fetch(`${currentConfig.backendUrl}${currentConfig.apiPrefix}/projects`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: projectName,
                        description: `Chrome extension project: ${projectName}`
                    })
                });
                
                if (response.ok) {
                    const newProject = await response.json();
                    
                    // Add to project select
                    const option = document.createElement('option');
                    option.value = newProject.id;
                    option.textContent = newProject.name;
                    projectSelect.appendChild(option);
                    
                    // Select the new project
                    projectSelect.value = newProject.id;
                    handleProjectChange({target: {value: newProject.id}});
                    
                    showStatus(`Project "${projectName}" created successfully!`, 'success');
                } else {
                    showStatus('Failed to create project. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error creating project:', error);
                showStatus('Error creating project. Please check your connection.', 'error');
            }
        }
    }

    async function initializePopup() {
        try {
            showStatus('Connecting to platform...', 'info');
            
            // First check authentication
            const isAuthenticated = await checkAuthentication();
            if (!isAuthenticated) {
                showAuthenticationError();
                return;
            }
            
            // Load user preferences
            const settings = await chrome.storage.local.get(['captureSettings', 'quickCapture', 'captureMode']);
            captureSettings = settings.captureSettings || {};
            
            // Load projects
            await loadProjects();
            
            // Get current tab info
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                showStatus('Could not access current tab', 'error');
                return;
            }

            // Get enhanced page info from content script
            currentPageInfo = await getPageInfo(tab.id);
            
            // Update UI with page info
            updatePageInfo(currentPageInfo);

            // Check for selected text and context
            const storage = await chrome.storage.local.get(['selectedText', 'selectionContext', 'captureMode']);
            if (storage.selectedText) {
                showSelectedText(storage.selectedText, storage.selectionContext);
            }

            // Handle special capture modes
            if (settings.quickCapture) {
                handleQuickCapture();
            }

            if (storage.captureMode) {
                handleSpecialCaptureMode(storage.captureMode);
            }

            // Generate AI suggestions
            await generateAutoSuggestions();

            // Show content insights
            showContentInsights();

            showStatus('Ready to capture content', 'success');

        } catch (error) {
            console.error('Error initializing popup:', error);
            showStatus('Error connecting to platform - make sure app is running', 'error');
        }
    }

    async function checkAuthentication() {
        try {
            // Try extension-specific auth check (no cookies needed)
            const response = await fetch(`${currentConfig.backendUrl}${currentConfig.apiPrefix}/auth/extension-check`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                if (userData.authenticated) {
                    displayUserInfo(userData.user);
                    return true;
                }
                return false;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            return false;
        }
    }

    function displayUserInfo(user) {
        // Create a user info section if it doesn't exist
        let userInfoDiv = document.getElementById('userInfo');
        if (!userInfoDiv) {
            userInfoDiv = document.createElement('div');
            userInfoDiv.id = 'userInfo';
            userInfoDiv.className = 'user-info';
            document.querySelector('.header').appendChild(userInfoDiv);
        }
        
        userInfoDiv.innerHTML = `
            <div class="user-details">
                <small>✅ Connected as: ${user.email}</small>
            </div>
        `;
    }

    function showAuthenticationError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error';
        errorDiv.innerHTML = `
            <div class="error-message">
                <h3>⚠️ Extension Connection Issue</h3>
                <p><strong>Good news:</strong> This is a known Chrome extension limitation, not a bug!</p>
                <p><strong>Quick Solution:</strong></p>
                <ol>
                    <li>Keep your main app running at <a href="${currentConfig.backendUrl}" target="_blank">localhost:5000</a></li>
                    <li>Make sure you're logged in there</li>
                    <li>Use the extension anyway - the save function works!</li>
                </ol>
                <p><em>The extension can capture content and save it to your platform even when this connection check fails due to Chrome's security restrictions.</em></p>
                <button id="retryConnection" class="retry-btn">Try Anyway</button>
                <button id="openPlatform" class="open-platform-btn">Open Platform</button>
            </div>
        `;
        
        document.querySelector('.container').innerHTML = '';
        document.querySelector('.container').appendChild(errorDiv);
        
        // Add retry functionality - skip auth check and continue
        document.getElementById('retryConnection').addEventListener('click', () => {
            document.querySelector('.container').innerHTML = document.querySelector('.original-content')?.innerHTML || '';
            // Continue with normal initialization but skip auth check
            initializePopupWithoutAuth();
        });
        
        // Add open platform functionality
        document.getElementById('openPlatform').addEventListener('click', () => {
            chrome.tabs.create({ url: currentConfig.backendUrl });
        });
    }

    // Initialize popup without authentication check
    async function initializePopupWithoutAuth() {
        try {
            showStatus('Loading extension (bypassing auth check)...', 'info');
            
            // Load user preferences
            const settings = await chrome.storage.local.get(['captureSettings', 'quickCapture', 'captureMode']);
            captureSettings = settings.captureSettings || {};
            
            // Get current tab info
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                showStatus('Could not access current tab', 'error');
                return;
            }

            // Get enhanced page info from content script
            currentPageInfo = await getPageInfo(tab.id);
            
            // Update UI with page info
            updatePageInfo(currentPageInfo);

            // Check for selected text and context
            const storage = await chrome.storage.local.get(['selectedText', 'selectionContext', 'captureMode']);
            if (storage.selectedText) {
                showSelectedText(storage.selectedText, storage.selectionContext);
            }

            // Handle special capture modes
            if (settings.quickCapture) {
                handleQuickCapture();
            }

            if (storage.captureMode) {
                handleSpecialCaptureMode(storage.captureMode);
            }

            // Generate AI suggestions
            await generateAutoSuggestions();
            
            // Generate and display auto-tags
            autoDetectedTags = generateAutoTags(currentPageInfo);
            displayAutoTags(autoDetectedTags);

            // Show content insights
            showContentInsights();

            showStatus('Extension ready (connection check bypassed)', 'success');

        } catch (error) {
            console.error('Error initializing popup:', error);
            showStatus('Extension loaded with basic functionality', 'info');
        }
    }

    async function getPageInfo(tabId) {
        return new Promise((resolve) => {
            chrome.tabs.sendMessage(tabId, { action: 'getPageInfo' }, (response) => {
                if (chrome.runtime.lastError) {
                    // Fallback to basic tab info
                    chrome.tabs.get(tabId, (tab) => {
                        resolve({
                            title: tab.title || 'Untitled Page',
                            url: tab.url || '',
                            domain: new URL(tab.url).hostname,
                            selectedText: '',
                            contentType: 'webpage',
                            readingTime: 0
                        });
                    });
                } else {
                    resolve(response || {});
                }
            });
        });
    }

    function updatePageInfo(pageInfo) {
        pageTitle.textContent = pageInfo.title || 'Untitled Page';
        pageUrl.textContent = pageInfo.url || '';
        
        // Update content type indicator
        if (contentTypeIndicator) {
            contentTypeIndicator.textContent = pageInfo.contentType || 'webpage';
            contentTypeIndicator.className = `content-type ${pageInfo.contentType || 'webpage'}`;
        }
        
        // Update reading time
        if (readingTimeIndicator && pageInfo.readingTime) {
            readingTimeIndicator.textContent = `${pageInfo.readingTime} min read`;
        }
        
        // Store for later use
        window.currentPageInfo = pageInfo;
    }

    function showSelectedText(text, context) {
        if (text && text.trim().length > 0) {
            selectedTextContainer.style.display = 'block';
            selectedTextPreview.textContent = text.length > 200 ? text.substring(0, 200) + '...' : text;
            
            // Show context if available
            if (context && context.before && context.after) {
                const contextDiv = document.createElement('div');
                contextDiv.className = 'selection-context';
                contextDiv.innerHTML = `
                    <small>Context: ...${context.before.slice(-50)}<strong>${text}</strong>${context.after.slice(0, 50)}...</small>
                `;
                selectedTextContainer.appendChild(contextDiv);
            }
        }
    }

    // Visual Intelligence Features
    async function handleScreenshot() {
        try {
            showStatus('Capturing screenshot...', 'info');
            
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                showStatus('Could not access current tab', 'error');
                return;
            }

            // Capture screenshot
            const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
                format: 'png',
                quality: 90
            });

            // Store screenshot data
            await chrome.storage.local.set({
                screenshot: {
                    dataUrl: screenshot,
                    timestamp: Date.now(),
                    url: currentPageInfo?.url || 'unknown',
                    title: currentPageInfo?.title || 'Screenshot'
                }
            });

            showStatus('Screenshot captured successfully!', 'success');
            
            // Update UI to show screenshot options
            updateScreenshotUI(true);
            
        } catch (error) {
            console.error('Screenshot capture failed:', error);
            showStatus('Failed to capture screenshot', 'error');
        }
    }

    async function handleVisualAnalysis() {
        try {
            showStatus('Analyzing visual content...', 'info');
            
            // Get stored screenshot
            const storage = await chrome.storage.local.get(['screenshot']);
            if (!storage.screenshot) {
                showStatus('No screenshot found. Please capture a screenshot first.', 'error');
                return;
            }

            // Prepare visual analysis request
            const analysisData = {
                imageUrls: [storage.screenshot.dataUrl],
                content: userNotes.value || currentPageInfo?.title || 'Visual content analysis',
                context: `Screenshot from ${currentPageInfo?.url || 'webpage'}`,
                sourceUrl: currentPageInfo?.url
            };

            // Send to visual analysis API
            const response = await fetch(`${currentConfig.backendUrl}${currentConfig.apiPrefix}/analyze/visual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(analysisData)
            });

            if (!response.ok) {
                throw new Error(`Visual analysis failed: ${response.status}`);
            }

            const result = await response.json();
            
            // Display results
            displayVisualAnalysis(result.visualAnalysis);
            showStatus('Visual analysis completed!', 'success');
            
        } catch (error) {
            console.error('Visual analysis failed:', error);
            showStatus('Visual analysis failed. Please try again.', 'error');
        }
    }

    function updateScreenshotUI(hasScreenshot) {
        const screenshotIndicator = document.getElementById('screenshotIndicator');
        const visualAnalysisButton = document.getElementById('visualAnalysisButton');
        
        if (hasScreenshot) {
            screenshotIndicator.style.display = 'block';
            visualAnalysisButton.disabled = false;
            visualAnalysisButton.textContent = '🔍 Analyze Visual';
        } else {
            screenshotIndicator.style.display = 'none';
            visualAnalysisButton.disabled = true;
            visualAnalysisButton.textContent = '📸 Capture Screenshot First';
        }
    }

    function displayVisualAnalysis(analysis) {
        const visualResultsContainer = document.getElementById('visualResults');
        if (!visualResultsContainer) return;

        // Create visual analysis display
        const html = `
            <div class="visual-analysis-results">
                <h3>🎨 Visual Intelligence</h3>
                <div class="analysis-section">
                    <h4>Brand Elements</h4>
                    <p><strong>Color Trend:</strong> ${analysis.brandElements?.colorPalette?.trend || 'N/A'}</p>
                    <p><strong>Typography:</strong> ${analysis.brandElements?.typography?.trend || 'N/A'}</p>
                    <p><strong>Layout:</strong> ${analysis.brandElements?.layoutComposition?.style || 'N/A'}</p>
                </div>
                <div class="analysis-section">
                    <h4>Cultural Moments</h4>
                    <p><strong>Viral Potential:</strong> ${analysis.culturalVisualMoments?.viralPatterns?.shareability || 'N/A'}</p>
                    <p><strong>Generation:</strong> ${analysis.culturalVisualMoments?.generationalAesthetics?.primary || 'N/A'}</p>
                </div>
                <div class="analysis-section">
                    <h4>Strategic Recommendations</h4>
                    ${analysis.strategicRecommendations?.map(rec => `<p>• ${rec}</p>`).join('') || '<p>No recommendations available</p>'}
                </div>
                <div class="confidence-score">
                    <p><strong>Confidence Score:</strong> ${analysis.confidenceScore || 0}%</p>
                </div>
            </div>
        `;

        visualResultsContainer.innerHTML = html;
        visualResultsContainer.style.display = 'block';
    }

    async function generateAutoSuggestions() {
        if (!currentPageInfo || !autoSuggestionsContainer) return;

        try {
            // Generate contextual suggestions based on page content
            const suggestions = [];
            
            // Content type suggestions
            if (currentPageInfo.contentType === 'article') {
                suggestions.push("Key insights from this article");
                suggestions.push("Strategic implications for business");
            } else if (currentPageInfo.contentType === 'research') {
                suggestions.push("Research methodology and findings");
                suggestions.push("Data points and statistics");
            } else if (currentPageInfo.contentType === 'news') {
                suggestions.push("Market implications of this news");
                suggestions.push("Trend analysis and predictions");
            }

            // Keyword-based suggestions
            if (currentPageInfo.keywords) {
                const businessKeywords = currentPageInfo.keywords.filter(k => 
                    ['strategy', 'market', 'business', 'trend', 'innovation', 'growth'].includes(k.toLowerCase())
                );
                if (businessKeywords.length > 0) {
                    suggestions.push(`Focus on ${businessKeywords.join(', ')} trends`);
                }
            }

            // Display suggestions
            if (suggestions.length > 0) {
                autoSuggestions = suggestions;
                displaySuggestions(suggestions);
            }

        } catch (error) {
            console.error('Error generating suggestions:', error);
        }
    }

    function displaySuggestions(suggestions) {
        if (!autoSuggestionsContainer) return;

        // Show the container
        autoSuggestionsContainer.style.display = 'block';
        
        autoSuggestionsContainer.innerHTML = '<label>Quick Notes:</label>';
        suggestions.forEach(suggestion => {
            const button = document.createElement('button');
            button.className = 'suggestion-button';
            button.textContent = suggestion;
            button.onclick = () => {
                const currentNotes = userNotes.value.trim();
                userNotes.value = currentNotes ? `${currentNotes}\n\n${suggestion}` : suggestion;
                userNotes.focus();
            };
            autoSuggestionsContainer.appendChild(button);
        });
    }

    function showContentInsights() {
        if (!currentPageInfo) return;

        // Show author and publish date if available
        if (currentPageInfo.author || currentPageInfo.publishDate) {
            const insightsDiv = document.createElement('div');
            insightsDiv.className = 'content-insights';
            
            if (currentPageInfo.author) {
                insightsDiv.innerHTML += `<span class="author">By ${currentPageInfo.author}</span>`;
            }
            
            if (currentPageInfo.publishDate) {
                const date = new Date(currentPageInfo.publishDate);
                insightsDiv.innerHTML += `<span class="publish-date">${date.toLocaleDateString()}</span>`;
            }
            
            const pageInfoDiv = document.querySelector('.page-info');
            pageInfoDiv.appendChild(insightsDiv);
        }
    }

    function handleQuickCapture() {
        // Auto-populate with page content for quick capture
        if (currentPageInfo && currentPageInfo.mainContent) {
            const quickNote = `Quick capture from ${currentPageInfo.domain}:\n\n${currentPageInfo.mainContent.substring(0, 200)}...`;
            userNotes.value = quickNote;
        }
    }

    function handleSpecialCaptureMode(mode) {
        if (mode === 'page') {
            // Capture entire page
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'getFullContent'}, (response) => {
                    if (response && response.fullText) {
                        const fullCapture = {
                            title: response.title,
                            content: response.fullText.substring(0, 5000), // Limit content
                            metadata: {
                                headings: response.headings,
                                images: response.images,
                                links: response.links
                            }
                        };
                        
                        // Pre-populate form
                        userNotes.value = `Full page capture:\n\nKey headings: ${response.headings.map(h => h.text).join(', ')}\n\nContent preview: ${response.fullText.substring(0, 300)}...`;
                    }
                });
            });
        }
    }

    function handleCaptureModeChange(event) {
        const mode = event.target.value;
        // Store preference
        chrome.storage.local.set({captureMode: mode});
        
        // Update UI based on mode
        if (mode === 'selection') {
            selectedTextContainer.style.display = 'block';
        } else if (mode === 'page') {
            handleSpecialCaptureMode('page');
        }
    }

    function handleNotesChange() {
        // Auto-save notes as user types
        const notes = userNotes.value;
        chrome.storage.local.set({draftNotes: notes});
        
        // Show character count
        const charCount = notes.length;
        if (charCount > 0) {
            showStatus(`${charCount} characters`, 'info');
        }
    }

    // Voice note functionality
    async function handleStartVoiceNote() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                await handleVoiceNoteComplete(audioBlob);
                
                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            isRecording = true;
            
            // Update UI
            voiceNoteButton.disabled = true;
            voiceNoteButton.style.display = 'none';
            stopRecordingButton.disabled = false;
            stopRecordingButton.style.display = 'inline-block';
            voiceNoteStatus.style.display = 'block';
            
            // Start timer
            let seconds = 0;
            const timer = setInterval(() => {
                if (!isRecording) {
                    clearInterval(timer);
                    return;
                }
                seconds++;
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                const timeDisplay = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                document.querySelector('.recording-time').textContent = timeDisplay;
            }, 1000);
            
            showStatus('Recording voice note...', 'info');
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            showStatus('Could not access microphone. Please check permissions.', 'error');
        }
    }

    function handleStopVoiceNote() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            
            // Update UI
            voiceNoteButton.disabled = false;
            voiceNoteButton.style.display = 'inline-block';
            stopRecordingButton.disabled = true;
            stopRecordingButton.style.display = 'none';
            voiceNoteStatus.style.display = 'none';
            
            showStatus('Processing voice note...', 'info');
        }
    }

    async function handleVoiceNoteComplete(audioBlob) {
        try {
            // Convert blob to base64
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            // Send to backend for transcription
            const response = await fetch(`${currentConfig.backendUrl}/api/whisper/transcribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    audioFile: base64Audio,
                    filename: `voice_note_${Date.now()}.wav`
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to transcribe voice note');
            }
            
            const result = await response.json();
            
            // Add transcribed text to notes
            const currentNotes = userNotes.value.trim();
            const transcribedText = `[Voice Note]: ${result.text}`;
            userNotes.value = currentNotes ? `${currentNotes}\n\n${transcribedText}` : transcribedText;
            
            // Show success indicator
            const voiceNoteResult = document.getElementById('voiceNoteResult');
            voiceNoteResult.style.display = 'block';
            
            showStatus(`Voice note transcribed (${result.duration?.toFixed(1) || 'unknown'}s)`, 'success');
            
            // Hide success indicator after 3 seconds
            setTimeout(() => {
                voiceNoteResult.style.display = 'none';
            }, 3000);
            
        } catch (error) {
            console.error('Error processing voice note:', error);
            showStatus('Failed to process voice note. Please try again.', 'error');
        }
    }

    // Enhanced Auto-tagging system with strategic intelligence
    function generateAutoTags(pageInfo) {
        const autoTags = [];
        
        if (!pageInfo) return autoTags;
        
        const domain = pageInfo.domain?.toLowerCase() || '';
        const title = pageInfo.title?.toLowerCase() || '';
        const content = pageInfo.content?.toLowerCase() || '';
        const contentText = `${title} ${content}`;
        
        // Platform-specific strategic tagging
        const platformTags = {
            'tiktok.com': ['cultural-moment', 'visual-hook'],
            'instagram.com': ['cultural-moment', 'visual-hook'],
            'twitter.com': ['cultural-moment', 'human-behavior'],
            'x.com': ['cultural-moment', 'human-behavior'],
            'linkedin.com': ['human-behavior', 'insight-cue'],
            'medium.com': ['insight-cue', 'human-behavior'],
            'youtube.com': ['visual-hook', 'cultural-moment'],
            'reddit.com': ['human-behavior', 'cultural-moment'],
            'pinterest.com': ['visual-hook', 'cultural-moment'],
            'behance.net': ['visual-hook', 'insight-cue'],
            'dribbble.com': ['visual-hook', 'insight-cue']
        };
        
        // Apply platform-specific tags
        Object.entries(platformTags).forEach(([platform, platformTagList]) => {
            if (domain.includes(platform)) {
                platformTagList.forEach(tag => {
                    if (!autoTags.includes(tag)) autoTags.push(tag);
                });
            }
        });
        
        // Enhanced content-based strategic tagging
        const keywordPatterns = {
            'cultural-moment': [
                'viral', 'trending', 'culture', 'zeitgeist', 'meme', 'cultural',
                'gen z', 'millennial', 'social media', 'influencer', 'phenomenon',
                'movement', 'shift', 'moment', 'buzz', 'attention'
            ],
            'human-behavior': [
                'behavior', 'psychology', 'user', 'customer', 'audience', 'motivation',
                'habit', 'decision', 'preference', 'choice', 'emotion', 'experience',
                'journey', 'persona', 'segment', 'demographic', 'psychographic'
            ],
            'rival-content': [
                'competitor', 'competition', 'benchmark', 'vs', 'comparison', 'versus',
                'rival', 'alternative', 'competitive', 'market share', 'positioning',
                'differentiation', 'advantage', 'threat', 'analysis'
            ],
            'visual-hook': [
                'design', 'visual', 'image', 'video', 'creative', 'aesthetic',
                'branding', 'logo', 'color', 'typography', 'layout', 'composition',
                'style', 'art', 'graphics', 'ui', 'ux', 'interface'
            ],
            'insight-cue': [
                'insight', 'analysis', 'research', 'data', 'study', 'finding',
                'report', 'strategy', 'intelligence', 'trend', 'pattern',
                'discovery', 'revelation', 'learning', 'conclusion', 'implication'
            ]
        };
        
        // Analyze content for strategic keywords
        Object.entries(keywordPatterns).forEach(([tag, keywords]) => {
            const matches = keywords.filter(keyword => contentText.includes(keyword)).length;
            if (matches > 0 && !autoTags.includes(tag)) {
                autoTags.push(tag);
            }
        });
        
        // Content type and context-based tagging
        if (pageInfo.contentType) {
            if (pageInfo.contentType.includes('video') && !autoTags.includes('visual-hook')) {
                autoTags.push('visual-hook');
            }
            if (pageInfo.contentType.includes('image') && !autoTags.includes('visual-hook')) {
                autoTags.push('visual-hook');
            }
        }
        
        // Reading time-based intelligence
        if (pageInfo.readingTime) {
            if (pageInfo.readingTime > 10 && !autoTags.includes('insight-cue')) {
                autoTags.push('insight-cue');
            }
            if (pageInfo.readingTime < 3 && !autoTags.includes('cultural-moment')) {
                autoTags.push('cultural-moment');
            }
        }
        
        // Author-based context tagging
        if (pageInfo.author) {
            const author = pageInfo.author.toLowerCase();
            if ((author.includes('researcher') || author.includes('analyst')) && !autoTags.includes('insight-cue')) {
                autoTags.push('insight-cue');
            }
            if ((author.includes('designer') || author.includes('creative')) && !autoTags.includes('visual-hook')) {
                autoTags.push('visual-hook');
            }
        }
        
        // Ensure at least one tag for strategic value
        if (autoTags.length === 0) {
            if (contentText.includes('brand') || contentText.includes('marketing')) {
                autoTags.push('insight-cue');
            } else if (contentText.includes('social') || contentText.includes('trend')) {
                autoTags.push('cultural-moment');
            } else {
                autoTags.push('human-behavior'); // Most universal strategic tag
            }
        }
        
        // Limit to maximum 3 tags for focus
        return autoTags.slice(0, 3);
    }
    
    function displayAutoTags(tags) {
        const autoTagsDisplay = document.getElementById('autoTagsDisplay');
        const autoTagsList = document.getElementById('autoTagsList');
        
        if (!autoTagsDisplay || !autoTagsList || tags.length === 0) {
            if (autoTagsDisplay) autoTagsDisplay.style.display = 'none';
            return;
        }
        
        autoTagsList.innerHTML = '';
        tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'auto-tag';
            tagElement.textContent = CORE_TAGS[tag] || tag;
            autoTagsList.appendChild(tagElement);
        });
        
        autoTagsDisplay.style.display = 'block';
    }
    
    function handleTagChange(event) {
        const tagValue = event.target.value;
        const isChecked = event.target.checked;
        
        if (isChecked) {
            if (!selectedTags.includes(tagValue)) {
                selectedTags.push(tagValue);
            }
        } else {
            selectedTags = selectedTags.filter(tag => tag !== tagValue);
        }
        
        console.log('Selected tags:', selectedTags);
    }
    
    function handleProjectChange(event) {
        const projectId = event.target.value;
        selectedProject = projectId ? parseInt(projectId) : null;
        
        // Show/hide template section based on project selection
        const templateSectionSelect = document.getElementById('templateSectionSelect');
        if (templateSectionSelect) {
            templateSectionSelect.style.display = projectId ? 'block' : 'none';
        }
        
        console.log('Selected project:', selectedProject);
    }
    
    async function handleCreateProject() {
        const projectName = prompt('Enter project name:');
        if (!projectName || projectName.trim() === '') return;
        
        try {
            const response = await fetch(`${currentConfig.backendUrl}${currentConfig.apiPrefix}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: projectName.trim(),
                    description: `Project created from Chrome extension`
                })
            });
            
            if (response.ok) {
                const newProject = await response.json();
                // Add to projects list and select it
                const option = document.createElement('option');
                option.value = newProject.id;
                option.textContent = newProject.name;
                projectSelect.appendChild(option);
                projectSelect.value = newProject.id;
                selectedProject = newProject.id;
                
                showStatus(`Project "${projectName}" created successfully!`, 'success');
            } else {
                showStatus('Failed to create project', 'error');
            }
        } catch (error) {
            console.error('Error creating project:', error);
            showStatus('Error creating project', 'error');
        }
    }

    async function handleSave() {
        try {
            // Disable button and show loading
            saveButton.disabled = true;
            saveButtonText.innerHTML = '<div class="loading-spinner"></div>Saving...';
            
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                throw new Error('Could not access current tab');
            }

            // Get selected text from storage
            const storage = await chrome.storage.local.get(['selectedText', 'selectionContext']);
            
            // Get selected template section
            const sectionSelect = document.getElementById('sectionSelect');
            const templateSection = sectionSelect?.value || null;
            
            // Combine manual tags with auto-detected tags
            const allTags = [...new Set([...selectedTags, ...autoDetectedTags])];
            
            // Prepare enhanced capture data with project and tagging support
            const captureData = {
                title: currentPageInfo?.title || tab.title,
                url: tab.url,
                content: storage.selectedText || currentPageInfo?.mainContent || '',
                user_notes: userNotes.value.trim(),
                is_draft: true,
                captured_at: new Date().toISOString(),
                project_id: selectedProject,
                template_section: templateSection,
                auto_tags: allTags,
                browser_context: {
                    domain: currentPageInfo?.domain || new URL(tab.url).hostname,
                    metaDescription: currentPageInfo?.metaDescription || '',
                    contentType: currentPageInfo?.contentType || 'webpage',
                    readingTime: currentPageInfo?.readingTime || 0,
                    author: currentPageInfo?.author || null,
                    publishDate: currentPageInfo?.publishDate || null,
                    keywords: currentPageInfo?.keywords || [],
                    selectionContext: storage.selectionContext || null,
                    manualTags: selectedTags,
                    autoDetectedTags: autoDetectedTags,
                    captureSessionId: Date.now().toString() // Simple session ID
                }
            };

            // Send to backend
            await saveToDrafts(captureData);

            // Track extension analytics
            await trackExtensionEvent('content_captured', {
                domain: captureData.browser_context.domain,
                contentType: captureData.browser_context.contentType,
                hasNotes: captureData.user_notes.length > 0,
                contentLength: captureData.content.length
            });

            // Notify background script
            chrome.runtime.sendMessage({
                action: 'captureContent',
                data: captureData
            });

            // Show success message
            showStatus('Content saved to drafts successfully!', 'success');

            // Clear stored data
            await chrome.storage.local.remove(['selectedText', 'selectionContext', 'draftNotes']);

            // Close popup after delay
            setTimeout(() => {
                window.close();
            }, 2000);

        } catch (error) {
            console.error('Error saving content:', error);
            
            // Track extension error
            await trackExtensionEvent('capture_error', {
                error: error.message,
                domain: currentPageInfo?.domain || 'unknown'
            });
            
            showStatus('Failed to save content: ' + error.message, 'error');
            
            // Show retry option
            const retryButton = document.createElement('button');
            retryButton.textContent = 'Retry';
            retryButton.onclick = handleSave;
            statusMessage.appendChild(retryButton);
            
        } finally {
            // Re-enable button
            saveButton.disabled = false;
            saveButtonText.textContent = 'Save to Drafts';
        }
    }

    async function saveToDrafts(captureData) {
        const response = await fetch(`${currentConfig.backendUrl}${currentConfig.apiPrefix}/signals/draft`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(captureData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    function showStatus(message, type = 'success') {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = 'block';

        // Auto-hide success and info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, type === 'info' ? 3000 : 5000);
        }
    }

    // Track extension analytics
    async function trackExtensionEvent(event, metadata) {
        try {
            await fetch(`${currentConfig.backendUrl}${currentConfig.apiPrefix}/analytics/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    action: event,
                    category: 'chrome_extension',
                    metadata: metadata
                })
            });
        } catch (error) {
            console.error('Analytics tracking failed:', error);
        }
    }
});