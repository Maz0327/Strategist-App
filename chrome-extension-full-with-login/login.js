document.addEventListener('DOMContentLoaded', function() {
    const apiUrlInput = document.getElementById('apiUrl');
    const testBtn = document.getElementById('testBtn');
    const openAppBtn = document.getElementById('openAppBtn');
    const continueBtn = document.getElementById('continueBtn');
    const status = document.getElementById('status');
    const connectionDot = document.getElementById('connectionDot');
    
    let isConnected = false;
    let isAuthenticated = false;
    let apiUrl = '';

    // Load existing configuration if available
    chrome.storage.local.get(['apiBase', 'connectionVerified'], function(result) {
        if (result.apiBase) {
            apiUrlInput.value = result.apiBase;
            if (result.connectionVerified) {
                // Auto-test existing connection
                testConnection(result.apiBase);
            }
        }
    });

    testBtn.addEventListener('click', function() {
        const url = apiUrlInput.value.trim();
        if (!url) {
            showStatus('Please enter your Replit app URL', 'error');
            return;
        }
        
        if (!url.includes('replit.dev') && !url.includes('replit.app') && !url.includes('localhost')) {
            showStatus('Please enter a valid Replit workspace URL', 'error');
            return;
        }

        testConnection(url);
    });

    openAppBtn.addEventListener('click', function() {
        if (apiUrl) {
            chrome.tabs.create({url: apiUrl}, function() {
                showStatus('Please log in to your app, then come back and test connection again', 'info');
                openAppBtn.disabled = true;
                setTimeout(function() {
                    openAppBtn.disabled = false;
                }, 3000);
            });
        }
    });

    continueBtn.addEventListener('click', function() {
        // Save verified connection and switch to main popup
        chrome.storage.local.set({
            apiBase: apiUrl,
            connectionVerified: true,
            lastConnectionTest: Date.now()
        }, function() {
            // Close current popup and open main extension
            window.location.href = 'simple-popup.html';
        });
    });

    function testConnection(url) {
        const cleanUrl = url.replace(/\/$/, '');
        apiUrl = cleanUrl;
        
        showStatus('Testing connection...', 'info');
        testBtn.disabled = true;
        updateConnectionIndicator(false, false);

        // Test basic connectivity first
        fetch(cleanUrl + '/api/debug/performance', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            if (response.ok) {
                isConnected = true;
                updateConnectionIndicator(true, false);
                showStatus('Server reachable, checking authentication...', 'info');
                
                // Now test authentication
                return fetch(cleanUrl + '/api/auth/me', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                throw new Error('Server not reachable');
            }
        })
        .then(function(authResponse) {
            if (authResponse && authResponse.status === 200) {
                isAuthenticated = true;
                updateConnectionIndicator(true, true);
                showStatus('Perfect! Connected and authenticated', 'success');
                continueBtn.classList.remove('hidden');
                openAppBtn.classList.add('hidden');
            } else if (authResponse && authResponse.status === 401) {
                updateConnectionIndicator(true, false);
                showStatus('Server connected but you need to log in first', 'error');
                openAppBtn.classList.remove('hidden');
                openAppBtn.disabled = false;
            } else {
                throw new Error('Authentication check failed');
            }
        })
        .catch(function(error) {
            console.error('Connection test failed:', error);
            isConnected = false;
            isAuthenticated = false;
            updateConnectionIndicator(false, false);
            
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                showStatus('Cannot reach server. Check if your app is running and the URL is correct.', 'error');
            } else {
                showStatus('Connection failed: ' + error.message, 'error');
            }
        })
        .finally(function() {
            testBtn.disabled = false;
        });
    }

    function updateConnectionIndicator(connected, authenticated) {
        connectionDot.classList.remove('connected', 'testing');
        if (connected && authenticated) {
            connectionDot.classList.add('connected');
        } else if (connected) {
            connectionDot.classList.add('testing');
        }
    }

    function showStatus(message, type) {
        status.textContent = message;
        status.className = 'status ' + type;
        status.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(function() {
                status.style.display = 'none';
            }, 3000);
        } else if (type === 'info') {
            setTimeout(function() {
                status.style.display = 'none';
            }, 5000);
        }
    }

    // Auto-focus URL input
    apiUrlInput.focus();
});