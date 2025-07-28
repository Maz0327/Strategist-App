// Simple popup script for testing
document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = 'http://localhost:5000';
    
    // DOM elements
    const pageTitle = document.getElementById('pageTitle');
    const pageUrl = document.getElementById('pageUrl');
    const projectSelect = document.getElementById('projectSelect');
    const notesInput = document.getElementById('notesInput');
    const captureBtn = document.getElementById('captureBtn');
    const captureForm = document.getElementById('captureForm');
    const status = document.getElementById('status');

    // Get current tab info
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        pageTitle.textContent = tab.title || 'Untitled Page';
        pageUrl.textContent = tab.url || '';
        
        console.log('Current tab:', tab);
    } catch (error) {
        console.error('Error getting tab info:', error);
        pageTitle.textContent = 'Error loading page info';
    }

    // Load projects
    async function loadProjects() {
        try {
            console.log('Loading projects from:', `${API_BASE}/api/projects`);
            
            const response = await fetch(`${API_BASE}/api/projects`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });

            console.log('Projects response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Projects data:', data);
                
                if (data.success && data.data) {
                    data.data.forEach(project => {
                        const option = document.createElement('option');
                        option.value = project.id;
                        option.textContent = project.name;
                        projectSelect.appendChild(option);
                    });
                }
            } else {
                console.log('Projects response not OK:', response.status);
                showStatus('Please log into the main app first', 'error');
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            showStatus('Connection error - is the app running?', 'error');
        }
    }

    // Show status message
    function showStatus(message, type = 'success') {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }

    // Handle form submission
    captureForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const projectId = projectSelect.value;
        const notes = notesInput.value;
        
        if (!projectId) {
            showStatus('Please select a project', 'error');
            return;
        }

        captureBtn.disabled = true;
        captureBtn.textContent = 'Capturing...';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const captureData = {
                projectId: parseInt(projectId),
                title: tab.title || 'Untitled Page',
                url: tab.url || '',
                userNotes: notes,
                isDraft: true,
                status: 'capture',
                extractText: false
            };

            console.log('Sending capture data:', captureData);

            const response = await fetch(`${API_BASE}/api/signals/draft`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(captureData)
            });

            console.log('Capture response status:', response.status);
            const result = await response.json();
            console.log('Capture result:', result);

            if (response.ok && result.success) {
                showStatus('Content captured successfully!', 'success');
                notesInput.value = '';
                
                // Close popup after successful capture
                setTimeout(() => {
                    window.close();
                }, 1500);
            } else {
                showStatus(result.error || 'Capture failed', 'error');
            }
        } catch (error) {
            console.error('Capture error:', error);
            showStatus('Connection error', 'error');
        } finally {
            captureBtn.disabled = false;
            captureBtn.textContent = 'Capture Content';
        }
    });

    // Initialize
    loadProjects();
});