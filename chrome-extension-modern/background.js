// Modern Background Service Worker for Strategic Content Capture
let connectionStatus = 'disconnected';
let captureCount = 0;

// Installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Strategic Content Capture Extension installed/updated');
    
    if (details.reason === 'install') {
        // Set up initial configuration
        chrome.storage.local.set({
            extensionVersion: '3.0.0',
            installDate: new Date().toISOString(),
            captureCount: 0,
            settings: {
                notifications: true,
                autoTag: true,
                quickCapture: true
            }
        });
        
        // Show welcome notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Strategic Content Capture Ready!',
            message: 'Click the extension icon to start capturing strategic content.'
        });
    }
    
    // Create context menus
    createContextMenus();
});

// Context menu creation
function createContextMenus() {
    // Clear existing menus
    chrome.contextMenus.removeAll(() => {
        // Main capture menu
        chrome.contextMenus.create({
            id: 'strategic-capture',
            title: 'Strategic Capture',
            contexts: ['page', 'selection', 'link', 'image']
        });
        
        // Submenu items
        chrome.contextMenus.create({
            id: 'capture-selection',
            parentId: 'strategic-capture',
            title: 'Capture Selected Text',
            contexts: ['selection']
        });
        
        chrome.contextMenus.create({
            id: 'capture-page',
            parentId: 'strategic-capture',
            title: 'Capture Full Page',
            contexts: ['page']
        });
        
        chrome.contextMenus.create({
            id: 'screen-capture',
            parentId: 'strategic-capture',
            title: 'Screen Selection Capture',
            contexts: ['page']
        });
        
        chrome.contextMenus.create({
            id: 'quick-analyze',
            parentId: 'strategic-capture',
            title: 'Quick Analysis',
            contexts: ['selection']
        });
    });
}

// Context menu click handling
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log('Context menu clicked:', info.menuItemId);
    
    try {
        switch (info.menuItemId) {
            case 'capture-selection':
                await handleSelectionCapture(tab, info);
                break;
                
            case 'capture-page':
                await handlePageCapture(tab);
                break;
                
            case 'screen-capture':
                await handleScreenCapture(tab);
                break;
                
            case 'quick-analyze':
                await handleQuickAnalysis(tab, info);
                break;
        }
    } catch (error) {
        console.error('Context menu action failed:', error);
        showNotification('error', 'Action failed', 'Please try again or use the extension popup.');
    }
});

// Keyboard shortcuts handling
chrome.commands.onCommand.addListener(async (command) => {
    console.log('Keyboard shortcut triggered:', command);
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    switch (command) {
        case 'quick-capture':
            await handleQuickCapture(tab);
            break;
            
        case 'screen-capture':
            await handleScreenCapture(tab);
            break;
    }
});

// Message handling from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message.type);
    
    switch (message.type) {
        case 'CAPTURE_CONTENT':
            handleContentCapture(message.data, sender.tab)
                .then(result => sendResponse({ success: true, result }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true; // Keep message channel open for async response
            
        case 'SCREEN_SELECTION_COMPLETE':
            handleScreenSelectionComplete(message.data, sender.tab);
            break;
            
        case 'SCREEN_SELECTION_CANCELLED':
            showNotification('info', 'Selection Cancelled', 'Screen capture was cancelled.');
            break;
            
        case 'TEST_CONNECTION':
            testPlatformConnection()
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ connected: false, error: error.message }));
            return true;
            
        case 'GET_CAPTURE_COUNT':
            chrome.storage.local.get(['captureCount'], (result) => {
                sendResponse({ count: result.captureCount || 0 });
            });
            return true;
            
        case 'UPDATE_BADGE':
            updateBadge(message.count);
            break;
    }
});

// Content capture handling
async function handleContentCapture(data, tab) {
    try {
        // Test connection first
        const connectionTest = await testPlatformConnection();
        if (!connectionTest.connected) {
            throw new Error('Platform connection failed');
        }
        
        // Send to platform
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/signals/draft`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...data,
                browser_context: {
                    ...data.browser_context,
                    tab_id: tab.id,
                    tab_url: tab.url,
                    timestamp: new Date().toISOString()
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Capture failed: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Update capture count
        await incrementCaptureCount();
        
        // Show success notification
        showNotification('success', 'Content Captured!', 'Successfully saved to your strategic dashboard.');
        
        return result;
        
    } catch (error) {
        console.error('Content capture failed:', error);
        showNotification('error', 'Capture Failed', error.message || 'Please try again.');
        throw error;
    }
}

// Screen selection capture handling
async function handleSelectionCapture(tab, info) {
    const captureData = {
        title: tab.title,
        url: tab.url,
        content: info.selectionText || '',
        capture_mode: 'selection',
        browser_context: {
            domain: new URL(tab.url).hostname,
            capture_method: 'context_menu',
            selection_text: info.selectionText || ''
        }
    };
    
    await handleContentCapture(captureData, tab);
}

// Page capture handling
async function handlePageCapture(tab) {
    try {
        // Get page content via content script
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                // Extract page content
                const main = document.querySelector('main, article, .content, #content') || document.body;
                return {
                    fullText: main.innerText.trim(),
                    title: document.title,
                    description: document.querySelector('meta[name="description"]')?.content || ''
                };
            }
        });
        
        const pageData = results[0]?.result || {};
        
        const captureData = {
            title: pageData.title || tab.title,
            url: tab.url,
            content: pageData.fullText || '',
            capture_mode: 'full_page',
            browser_context: {
                domain: new URL(tab.url).hostname,
                capture_method: 'context_menu',
                description: pageData.description
            }
        };
        
        await handleContentCapture(captureData, tab);
        
    } catch (error) {
        console.error('Page capture failed:', error);
        showNotification('error', 'Page Capture Failed', 'Could not access page content.');
    }
}

// Screen capture handling
async function handleScreenCapture(tab) {
    try {
        // Inject screen selection script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content-selection.js']
        });
        
        showNotification('info', 'Screen Selection Active', 'Click and drag to select an area.');
        
    } catch (error) {
        console.error('Screen capture initialization failed:', error);
        showNotification('error', 'Screen Capture Failed', 'Could not initialize screen selection.');
    }
}

// Quick capture handling
async function handleQuickCapture(tab) {
    try {
        // Get any selected text first
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString().trim()
        });
        
        const selectedText = results[0]?.result;
        
        if (selectedText) {
            // Capture selected text
            await handleSelectionCapture(tab, { selectionText: selectedText });
        } else {
            // Capture page title and URL as quick bookmark
            const captureData = {
                title: tab.title,
                url: tab.url,
                content: `Quick capture from: ${tab.title}`,
                capture_mode: 'quick',
                browser_context: {
                    domain: new URL(tab.url).hostname,
                    capture_method: 'keyboard_shortcut'
                }
            };
            
            await handleContentCapture(captureData, tab);
        }
        
    } catch (error) {
        console.error('Quick capture failed:', error);
        showNotification('error', 'Quick Capture Failed', 'Please try again.');
    }
}

// Quick analysis handling
async function handleQuickAnalysis(tab, info) {
    if (!info.selectionText) return;
    
    try {
        showNotification('info', 'Analyzing...', 'Processing selected content.');
        
        // Send for quick analysis
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/analyze/quick`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: info.selectionText,
                url: tab.url,
                title: tab.title
            })
        });
        
        if (response.ok) {
            const analysis = await response.json();
            showNotification('success', 'Analysis Complete', 'Results saved to your dashboard.');
        } else {
            throw new Error('Analysis failed');
        }
        
    } catch (error) {
        console.error('Quick analysis failed:', error);
        showNotification('error', 'Analysis Failed', 'Could not analyze content.');
    }
}

// Screen selection completion handling
function handleScreenSelectionComplete(selectionData, tab) {
    console.log('Screen selection completed:', selectionData);
    
    const captureData = {
        title: tab.title,
        url: tab.url,
        content: `Screenshot area: ${selectionData.width}×${selectionData.height}px at (${selectionData.x}, ${selectionData.y})`,
        capture_mode: 'screen_selection',
        browser_context: {
            domain: new URL(tab.url).hostname,
            capture_method: 'screen_selection',
            selection_data: selectionData
        }
    };
    
    handleContentCapture(captureData, tab);
}

// Platform connection testing
async function testPlatformConnection() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const connected = response.ok || response.status === 401; // 401 means server reachable but not logged in
        connectionStatus = connected ? 'connected' : 'disconnected';
        
        return {
            connected,
            status: response.status,
            authenticated: response.ok
        };
        
    } catch (error) {
        console.error('Connection test failed:', error);
        connectionStatus = 'error';
        return {
            connected: false,
            error: error.message
        };
    }
}

// Capture count management
async function incrementCaptureCount() {
    const result = await chrome.storage.local.get(['captureCount']);
    const newCount = (result.captureCount || 0) + 1;
    
    await chrome.storage.local.set({ captureCount: newCount });
    captureCount = newCount;
    
    updateBadge(newCount);
}

// Badge management
function updateBadge(count) {
    if (count > 0) {
        chrome.action.setBadgeText({ text: count.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

// Notification helper
function showNotification(type, title, message) {
    const iconMap = {
        success: 'icons/icon48.png',
        error: 'icons/icon48.png',
        warning: 'icons/icon48.png',
        info: 'icons/icon48.png'
    };
    
    chrome.notifications.create({
        type: 'basic',
        iconUrl: iconMap[type],
        title: title,
        message: message
    });
}

// Periodic connection check
chrome.alarms.create('connectionCheck', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'connectionCheck') {
        testPlatformConnection();
    }
});

// Tab update handling for favicon extraction
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        // Store favicon for later use
        if (tab.favIconUrl) {
            chrome.storage.local.set({
                [`favicon_${new URL(tab.url).hostname}`]: tab.favIconUrl
            });
        }
    }
});

// Extension icon click badge clear
chrome.action.onClicked.addListener(() => {
    // Reset badge when extension is opened
    updateBadge(0);
});

console.log('Strategic Content Capture background service worker loaded');