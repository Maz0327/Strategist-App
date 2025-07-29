// Simple popup JavaScript - moved to external file to avoid CSP issues
document.addEventListener('DOMContentLoaded', () => {
    const apiUrlInput = document.getElementById('apiUrl');
    const testBtn = document.getElementById('testBtn');
    const saveBtn = document.getElementById('saveBtn');
    const openMainApp = document.getElementById('openMainApp');
    const captureBtn = document.getElementById('captureBtn');
    const notesTextarea = document.getElementById('notes');
    const status = document.getElementById('status');
    const currentUrl = document.getElementById('currentUrl');
    
    let currentApiUrl = '';
    let currentTabInfo = null;

    // Load stored configuration
    const stored = localStorage.getItem('apiBase');
    if (stored) {
        currentUrl.textContent = stored;
        apiUrlInput.value = stored;
        currentApiUrl = stored;
        testConnection(stored);
    }

    // Get current tab info
    getCurrentTab();

    testBtn.addEventListener('click', () => {
        const url = apiUrlInput.value.trim();
        if (!url) {
            showStatus('Please enter your app URL', 'error');
            return;
        }
        testConnection(url);
    });

    saveBtn.addEventListener('click', () => {
        const url = apiUrlInput.value.trim();
        if (url) {
            localStorage.setItem('apiBase', url);
            currentUrl.textContent = url;
            currentApiUrl = url;
            showStatus('Configuration saved!', 'success');
        }
    });

    openMainApp.addEventListener('click', () => {
        if (currentApiUrl) {
            chrome.tabs.create({ url: currentApiUrl });
        }
    });

    captureBtn.addEventListener('click', async () => {
        if (!currentTabInfo || !currentApiUrl) {
            showStatus('Please configure URL and test connection first', 'error');
            return;
        }

        const notes = notesTextarea.value.trim();
        if (!notes) {
            showStatus('Please add some notes about this content', 'error');
            return;
        }

        try {
            showStatus('Capturing content...', 'info');
            
            const response = await fetch(`${currentApiUrl}/api/signals/draft`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: currentTabInfo.title,
                    url: currentTabInfo.url,
                    content: currentTabInfo.title,
                    user_notes: notes,
                    tags: ['chrome-extension'],
                    browser_context: {
                        domain: new URL(currentTabInfo.url).hostname,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (response.ok) {
                showStatus('Content captured successfully!', 'success');
                notesTextarea.value = '';
                setTimeout(() => {
                    window.close();
                }, 2000);
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                showStatus(`Capture failed: ${errorData.error || 'Please log in to main app first'}`, 'error');
            }
        } catch (error) {
            showStatus('Connection failed. Please check your setup.', 'error');
            console.error('Capture error:', error);
        }
    });

    async function getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            currentTabInfo = tab;
        } catch (error) {
            console.error('Error getting current tab:', error);
        }
    }

    async function testConnection(url) {
        const cleanUrl = url.replace(/\/$/, '');
        showStatus('Testing connection...', 'info');

        try {
            const response = await fetch(`${cleanUrl}/api/auth/me`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                showStatus('Connected and logged in!', 'success');
                saveBtn.style.display = 'block';
                captureBtn.style.display = 'block';
                currentApiUrl = cleanUrl;
            } else if (response.status === 401) {
                showStatus('Server reachable, but you need to log in first', 'error');
                openMainApp.style.display = 'block';
                saveBtn.style.display = 'block';
                currentApiUrl = cleanUrl;
            } else {
                showStatus('Server responded but something is wrong', 'error');
            }
        } catch (error) {
            showStatus('Cannot connect. Check if your app is running.', 'error');
            console.error('Connection test failed:', error);
        }
    }

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        if (type !== 'success' && type !== 'info') {
            setTimeout(() => {
                status.style.display = 'none';
            }, 5000);
        }
    }
});