// Background service worker for Chrome extension with enhanced screenshot capabilities

// Handle tab capture for selective screenshots
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureTab') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ screenshot: dataUrl });
    });
    return true; // Keep message channel open for async response
  }
});
// Handles extension lifecycle and provides enhanced functionality

// Installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First installation
    console.log('Strategic Content Capture extension installed');
    
    // Set default configuration
    chrome.storage.local.set({
      autoCapture: false,
      quickNotes: true,
      lastUsed: Date.now()
    });
    
    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon48.png',
      title: 'Strategic Content Capture',
      message: 'Extension installed! Click the icon to start capturing content.'
    });
  } else if (details.reason === 'update') {
    console.log('Strategic Content Capture extension updated');
  }
});

// Context menu integration
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'captureSelection',
    title: 'Capture Selected Text',
    contexts: ['selection'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  });
  
  chrome.contextMenus.create({
    id: 'capturePage',
    title: 'Capture Page',
    contexts: ['page'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'captureSelection') {
    // Store selected text and open popup
    chrome.storage.local.set({
      selectedText: info.selectionText,
      captureMode: 'selection'
    });
    chrome.action.openPopup();
  } else if (info.menuItemId === 'capturePage') {
    // Capture entire page
    chrome.storage.local.set({
      captureMode: 'page'
    });
    chrome.action.openPopup();
  }
});

// Keyboard shortcut handling
chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick-capture') {
    // Quick capture shortcut (Ctrl+Shift+C)
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.storage.local.set({
          quickCapture: true,
          tabId: tabs[0].id
        });
        chrome.action.openPopup();
      }
    });
  }
});

// Message handling from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureContent') {
    handleContentCapture(request.data, sender.tab);
    sendResponse({success: true});
  } else if (request.action === 'getTabInfo') {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      sendResponse({tab: tabs[0]});
    });
    return true; // Keep message channel open
  }
});

// Enhanced content capture handling
async function handleContentCapture(data, tab) {
  try {
    // Add enhanced metadata
    const enhancedData = {
      ...data,
      timestamp: Date.now(),
      tabId: tab.id,
      favicon: tab.favIconUrl,
      metadata: {
        userAgent: navigator.userAgent,
        captureMethod: data.captureMethod || 'popup',
        domain: new URL(tab.url).hostname
      }
    };
    
    // Store locally for sync
    const stored = await chrome.storage.local.get(['pendingCaptures']) || {};
    const pending = stored.pendingCaptures || [];
    pending.push(enhancedData);
    
    await chrome.storage.local.set({
      pendingCaptures: pending.slice(-50) // Keep last 50 captures
    });
    
    // Show success notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon48.png',
      title: 'Content Captured',
      message: `"${data.title}" saved to drafts`
    });
    
  } catch (error) {
    console.error('Content capture failed:', error);
    
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon48.png',
      title: 'Capture Failed',
      message: 'Please try again or check your connection'
    });
  }
}

// Periodic cleanup of old data
chrome.alarms.create('cleanup', {
  delayInMinutes: 60,
  periodInMinutes: 60
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    chrome.storage.local.get(['pendingCaptures'], (result) => {
      const captures = result.pendingCaptures || [];
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      // Remove captures older than a week
      const filtered = captures.filter(capture => capture.timestamp > oneWeekAgo);
      
      if (filtered.length !== captures.length) {
        chrome.storage.local.set({pendingCaptures: filtered});
      }
    });
  }
});

// Badge management
chrome.storage.onChanged.addListener((changes) => {
  if (changes.pendingCaptures) {
    const count = changes.pendingCaptures.newValue?.length || 0;
    if (count > 0) {
      chrome.action.setBadgeText({text: count.toString()});
      chrome.action.setBadgeBackgroundColor({color: '#3b82f6'});
    } else {
      chrome.action.setBadgeText({text: ''});
    }
  }
});