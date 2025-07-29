document.addEventListener('DOMContentLoaded', function() {
    const apiUrlInput = document.getElementById('apiUrl');
    const testBtn = document.getElementById('testBtn');
    const captureBtn = document.getElementById('captureBtn');
    const workspaceBtn = document.getElementById('workspaceBtn');
    const openAppBtn = document.getElementById('openAppBtn');
    const notesTextarea = document.getElementById('notes');
    const projectSelect = document.getElementById('projectSelect');
    const newProjectName = document.getElementById('newProjectName');
    const status = document.getElementById('status');
    const currentUrl = document.getElementById('currentUrl');
    const setupSection = document.getElementById('setupSection');
    const captureSection = document.getElementById('captureSection');
    const pageInfo = document.getElementById('pageInfo');
    
    let currentApiUrl = '';
    let currentTabInfo = null;
    let projects = [];

    // Check if connection is verified, otherwise redirect to login
    chrome.storage.local.get(['apiBase', 'connectionVerified', 'lastConnectionTest'], function(result) {
        const now = Date.now();
        const testExpired = !result.lastConnectionTest || (now - result.lastConnectionTest > 24 * 60 * 60 * 1000); // 24 hours
        
        if (!result.apiBase || !result.connectionVerified || testExpired) {
            // Redirect to login screen
            window.location.href = 'login.html';
            return;
        }
        
        // Connection verified, proceed with main popup
        currentUrl.textContent = result.apiBase;
        if (apiUrlInput) apiUrlInput.value = result.apiBase;
        currentApiUrl = result.apiBase;
        
        // Quick auth check
        quickAuthCheck(result.apiBase);
    });

    // Get current tab info
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        currentTabInfo = tabs[0];
    });

    testBtn.addEventListener('click', function() {
        const url = apiUrlInput.value.trim();
        if (!url) {
            showStatus('Please enter your app URL', 'error');
            return;
        }
        testConnection(url);
    });

    captureBtn.addEventListener('click', function() {
        if (!currentTabInfo || !currentApiUrl) {
            showStatus('Please configure URL and test connection first', 'error');
            return;
        }

        const notes = notesTextarea.value.trim();
        if (!notes) {
            showStatus('Please add some notes about this content', 'error');
            return;
        }

        captureContent();
    });

    openAppBtn.addEventListener('click', function() {
        if (currentApiUrl) {
            chrome.tabs.create({url: currentApiUrl});
        }
    });

    function testConnection(url) {
        const cleanUrl = url.replace(/\/$/, '');
        showStatus('Testing connection...', 'info');

        fetch(cleanUrl + '/api/auth/me', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            if (response.status === 200) {
                showStatus('Connected and logged in!', 'success');
                setupSection.classList.add('hidden');
                captureSection.classList.remove('hidden');
                currentApiUrl = cleanUrl;
                saveConfiguration(cleanUrl);
            } else if (response.status === 401) {
                showStatus('Server reachable, but you need to log in first', 'error');
                openAppBtn.classList.remove('hidden');
                currentApiUrl = cleanUrl;
                saveConfiguration(cleanUrl);
            } else {
                showStatus('Server responded but something is wrong', 'error');
            }
        })
        .catch(function(error) {
            showStatus('Cannot connect. Check if your app is running.', 'error');
            console.error('Connection test failed:', error);
        });
    }

    function captureContent() {
        const selectedProject = projectSelect.value;
        const projectName = selectedProject === 'new' ? newProjectName.value.trim() : selectedProject;
        
        if (!projectName) {
            showStatus('Please select or create a project', 'error');
            return;
        }

        showStatus('Capturing content...', 'info');
        
        // Get selected tags
        const selectedTags = Array.from(document.querySelectorAll('.tag-option input:checked')).map(checkbox => checkbox.value);
        selectedTags.push('chrome-extension');
        
        // Get capture mode
        const captureMode = document.querySelector('input[name="captureMode"]:checked').value;
        
        const captureData = {
            title: currentTabInfo.title,
            url: currentTabInfo.url,
            content: currentTabInfo.title + (currentTabInfo.description ? '\n\n' + currentTabInfo.description : ''),
            user_notes: notesTextarea.value.trim(),
            tags: selectedTags,
            project_id: selectedProject !== 'new' ? selectedProject : null,
            project_name: selectedProject === 'new' ? projectName : null,
            capture_mode: captureMode,
            browser_context: {
                domain: getDomain(currentTabInfo.url),
                timestamp: new Date().toISOString(),
                capture_mode: captureMode,
                user_agent: navigator.userAgent
            }
        };

        fetch(currentApiUrl + '/api/signals/draft', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(captureData)
        })
        .then(function(response) {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(function(errorData) {
                    throw new Error(errorData.error || 'Capture failed');
                });
            }
        })
        .then(function(data) {
            showStatus('Content captured successfully!', 'success');
            
            // Show workspace button if project was created/selected
            if (data.project_id) {
                workspaceBtn.style.display = 'block';
                workspaceBtn.onclick = function() {
                    chrome.tabs.create({url: currentApiUrl + '/projects/' + data.project_id + '/workspace'});
                };
            }
            
            // Clear form
            notesTextarea.value = '';
            document.querySelectorAll('.tag-option input:checked').forEach(checkbox => checkbox.checked = false);
            
            setTimeout(function() {
                window.close();
            }, 3000);
        })
        .catch(function(error) {
            showStatus('Capture failed: ' + error.message, 'error');
            console.error('Capture error:', error);
        });
    }

    function saveConfiguration(url) {
        chrome.storage.local.set({apiBase: url}, function() {
            currentUrl.textContent = url;
        });
    }

    function getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return 'unknown';
        }
    }

    function quickAuthCheck(url) {
        fetch(url + '/api/auth/me', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            if (response.status === 200) {
                setupSection.classList.add('hidden');
                captureSection.classList.remove('hidden');
                loadCurrentPageInfo();
                loadProjects();
            } else {
                showStatus('Please log in to your main app first', 'error');
                openAppBtn.classList.remove('hidden');
            }
        })
        .catch(function() {
            showStatus('Connection issue - please reconfigure', 'error');
            // Clear verification and redirect to login
            chrome.storage.local.remove(['connectionVerified'], function() {
                setTimeout(function() {
                    window.location.href = 'login.html';
                }, 2000);
            });
        });
    }

    function loadCurrentPageInfo() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            currentTabInfo = tabs[0];
            const domain = getDomain(currentTabInfo.url);
            pageInfo.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 4px;">${currentTabInfo.title}</div>
                <div style="font-size: 11px; opacity: 0.7;">${domain}</div>
            `;
            
            // Auto-suggest tags based on domain
            autoSuggestTags(domain);
        });
    }

    function autoSuggestTags(domain) {
        const suggestions = {
            'tiktok.com': ['cultural-moment', 'visual-hook'],
            'instagram.com': ['visual-hook', 'cultural-moment'],
            'linkedin.com': ['human-behavior', 'insight-cue'],
            'youtube.com': ['cultural-moment', 'visual-hook'],
            'twitter.com': ['cultural-moment', 'human-behavior'],
            'reddit.com': ['human-behavior', 'insight-cue']
        };
        
        const domainSuggestions = suggestions[domain] || [];
        domainSuggestions.forEach(tag => {
            const checkbox = document.getElementById('tag-' + tag.split('-')[0]);
            if (checkbox) checkbox.checked = true;
        });
    }

    function loadProjects() {
        fetch(currentApiUrl + '/api/projects', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            if (response.ok) {
                return response.json();
            }
            return [];
        })
        .then(function(data) {
            projects = data.data || [];
            updateProjectSelect();
        })
        .catch(function(error) {
            console.error('Failed to load projects:', error);
        });
    }

    function updateProjectSelect() {
        // Clear existing options except first two
        while (projectSelect.children.length > 2) {
            projectSelect.removeChild(projectSelect.lastChild);
        }
        
        // Add projects
        projects.forEach(function(project) {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    }

    // Project select change handler
    if (projectSelect) {
        projectSelect.addEventListener('change', function() {
            if (this.value === 'new') {
                newProjectName.style.display = 'block';
                newProjectName.focus();
            } else {
                newProjectName.style.display = 'none';
            }
        });
    }

    function showStatus(message, type) {
        status.textContent = message;
        status.className = 'status ' + type;
        status.style.display = 'block';
        
        if (type !== 'success' && type !== 'info') {
            setTimeout(function() {
                status.style.display = 'none';
            }, 5000);
        }
    }
});