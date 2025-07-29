document.addEventListener('DOMContentLoaded', function() {
    const apiUrlInput = document.getElementById('apiUrl');
    const testBtn = document.getElementById('testBtn');
    const captureBtn = document.getElementById('captureBtn');
    const openAppBtn = document.getElementById('openAppBtn');
    const notesTextarea = document.getElementById('notes');
    const status = document.getElementById('status');
    const currentUrl = document.getElementById('currentUrl');
    const setupSection = document.getElementById('setupSection');
    const captureSection = document.getElementById('captureSection');
    
    let currentApiUrl = '';
    let currentTabInfo = null;

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
        showStatus('Capturing content...', 'info');
        
        const captureData = {
            title: currentTabInfo.title,
            url: currentTabInfo.url,
            content: currentTabInfo.title,
            user_notes: notesTextarea.value.trim(),
            tags: ['chrome-extension'],
            browser_context: {
                domain: getDomain(currentTabInfo.url),
                timestamp: new Date().toISOString()
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
                showStatus('Content captured successfully!', 'success');
                notesTextarea.value = '';
                setTimeout(function() {
                    window.close();
                }, 2000);
            } else {
                return response.json().then(function(errorData) {
                    showStatus('Capture failed: ' + (errorData.error || 'Please log in to main app first'), 'error');
                });
            }
        })
        .catch(function(error) {
            showStatus('Connection failed. Please check your setup.', 'error');
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