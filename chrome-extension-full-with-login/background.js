// Strategic Content Capture Extension - Background Service Worker
console.log('Strategic Content Capture Extension loaded');

// Installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed/updated:', details.reason);
    
    // Create context menus
    createContextMenus();
    
    // Set up periodic cleanup
    chrome.alarms.create('cleanupStorage', { delayInMinutes: 1, periodInMinutes: 1440 }); // Daily cleanup
});

// Create context menus
function createContextMenus() {
    chrome.contextMenus.removeAll(() => {
        // Capture selected text
        chrome.contextMenus.create({
            id: 'captureSelection',
            title: 'Capture Selected Text',
            contexts: ['selection']
        });
        
        // Capture entire page
        chrome.contextMenus.create({
            id: 'capturePage',
            title: 'Capture Full Page',
            contexts: ['page']
        });
        
        // Screen capture
        chrome.contextMenus.create({
            id: 'captureScreen',
            title: 'Capture Screen Selection',
            contexts: ['page']
        });
    });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('Context menu clicked:', info.menuItemId);
    
    switch (info.menuItemId) {
        case 'captureSelection':
            handleTextCapture(info, tab);
            break;
        case 'capturePage':
            handlePageCapture(tab);
            break;
        case 'captureScreen':
            handleScreenCapture(tab);
            break;
    }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    console.log('Keyboard shortcut:', command);
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        
        switch (command) {
            case 'quick-capture':
                chrome.action.openPopup();
                break;
            case 'screen-capture':
                handleScreenCapture(tab);
                break;
        }
    });
});

// Handle text capture from context menu
async function handleTextCapture(info, tab) {
    try {
        const captureData = {
            type: 'text',
            selectedText: info.selectionText,
            url: tab.url,
            title: tab.title,
            timestamp: new Date().toISOString()
        };
        
        // Store temporarily and open popup
        await chrome.storage.local.set({ pendingCapture: captureData });
        chrome.action.openPopup();
        
        // Show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'Text Selected',
            message: 'Click the extension icon to complete capture'
        });
    } catch (error) {
        console.error('Text capture error:', error);
        showErrorNotification('Text capture failed');
    }
}

// Handle full page capture
async function handlePageCapture(tab) {
    try {
        const captureData = {
            type: 'fullPage',
            url: tab.url,
            title: tab.title,
            timestamp: new Date().toISOString()
        };
        
        await chrome.storage.local.set({ pendingCapture: captureData });
        chrome.action.openPopup();
        
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'Page Ready',
            message: 'Click the extension icon to complete capture'
        });
    } catch (error) {
        console.error('Page capture error:', error);
        showErrorNotification('Page capture failed');
    }
}

// Handle screen capture
async function handleScreenCapture(tab) {
    try {
        // Request desktop capture permission
        chrome.desktopCapture.chooseDesktopMedia(['screen', 'window', 'tab'], (streamId) => {
            if (streamId) {
                const captureData = {
                    type: 'screen',
                    streamId: streamId,
                    url: tab.url,
                    title: tab.title,
                    timestamp: new Date().toISOString()
                };
                
                chrome.storage.local.set({ pendingCapture: captureData });
                chrome.action.openPopup();
            } else {
                showErrorNotification('Screen capture cancelled');
            }
        });
    } catch (error) {
        console.error('Screen capture error:', error);
        showErrorNotification('Screen capture failed');
    }
}

// Badge management
function updateBadge(count) {
    const text = count > 0 ? count.toString() : '';
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
}

// Notification helpers
function showSuccessNotification(message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Capture Success',
        message: message
    });
}

function showErrorNotification(message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Capture Error',
        message: message
    });
}

// Storage cleanup
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanupStorage') {
        cleanupOldData();
    }
});

async function cleanupOldData() {
    try {
        const result = await chrome.storage.local.get();
        const now = new Date().getTime();
        const weekOld = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        
        for (const [key, value] of Object.entries(result)) {
            if (value.timestamp) {
                const itemTime = new Date(value.timestamp).getTime();
                if (now - itemTime > weekOld) {
                    await chrome.storage.local.remove(key);
                    console.log('Cleaned up old data:', key);
                }
            }
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

// Message handling from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    switch (message.type) {
        case 'captureSuccess':
            showSuccessNotification(message.message || 'Content captured successfully!');
            updateBadge(0);
            break;
        case 'captureError':
            showErrorNotification(message.message || 'Capture failed');
            break;
        case 'updateBadge':
            updateBadge(message.count || 0);
            break;
    }
    
    sendResponse({ success: true });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // This will be handled by the popup
    console.log('Extension icon clicked for tab:', tab.url);
});

// Startup initialization
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension startup');
    updateBadge(0);
});

// Error handling
chrome.runtime.onSuspend.addListener(() => {
    console.log('Extension suspended');
});

// Tab updates for auto-suggestions
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Auto-detect content type for suggestions
        autoDetectContentType(tab);
    }
});

async function autoDetectContentType(tab) {
    try {
        const url = tab.url.toLowerCase();
        const title = tab.title ? tab.title.toLowerCase() : '';
        
        let contentType = 'general';
        let suggestions = [];
        
        // Platform detection
        if (url.includes('tiktok.com')) {
            contentType = 'tiktok';
            suggestions = ['Viral potential analysis', 'Gen Z behavior insight', 'Trend adaptation opportunity'];
        } else if (url.includes('instagram.com')) {
            contentType = 'instagram';
            suggestions = ['Visual storytelling technique', 'Brand engagement strategy', 'Aesthetic trend'];
        } else if (url.includes('linkedin.com')) {
            contentType = 'linkedin';
            suggestions = ['Professional insight', 'Industry trend signal', 'Thought leadership content'];
        } else if (url.includes('youtube.com')) {
            contentType = 'youtube';
            suggestions = ['Content format innovation', 'Creator strategy insight', 'Audience engagement pattern'];
        } else if (url.includes('reddit.com')) {
            contentType = 'reddit';
            suggestions = ['Community sentiment', 'Discussion trend', 'User behavior pattern'];
        }
        
        // Store content analysis
        await chrome.storage.local.set({
            [`contentAnalysis_${tab.id}`]: {
                contentType,
                suggestions,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Content analysis error:', error);
    }
}

console.log('Background script initialized');