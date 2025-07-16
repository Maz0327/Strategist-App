// Background service worker for Chrome extension
// Handles extension lifecycle and provides enhanced functionality

// Import visual capture modules
importScripts('screenshot-recorder.js', 'ocr-processor.js');

// Global instances
let screenshotRecorder = null;
let ocrProcessor = null;
let isRecording = false;
let currentRecordingTab = null;

// Installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First installation
    console.log('Strategic Content Capture extension installed');
    
    // Initialize visual capture modules
    screenshotRecorder = new ScreenshotRecorder();
    ocrProcessor = new OCRProcessor();
    
    // Set default configuration
    chrome.storage.local.set({
      autoCapture: false,
      quickNotes: true,
      visualCapture: true,
      ocrEnabled: true,
      recordingQuality: 'medium',
      lastUsed: Date.now()
    });
    
    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon48.png',
      title: 'Strategic Content Capture',
      message: 'Extension installed! Click the icon to start capturing content and screenshots.'
    });
  } else if (details.reason === 'update') {
    console.log('Strategic Content Capture extension updated');
    // Re-initialize modules on update
    screenshotRecorder = new ScreenshotRecorder();
    ocrProcessor = new OCRProcessor();
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
  
  chrome.contextMenus.create({
    id: 'captureScreenshot',
    title: 'Capture Screenshot',
    contexts: ['page'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  });
  
  chrome.contextMenus.create({
    id: 'startRecording',
    title: 'Start Screen Recording',
    contexts: ['page'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
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
  } else if (info.menuItemId === 'captureScreenshot') {
    // Capture screenshot immediately
    await handleScreenshotCapture(tab);
  } else if (info.menuItemId === 'startRecording') {
    // Toggle recording
    await handleRecordingToggle(tab);
  }
});

// Keyboard shortcut handling
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  
  if (command === 'quick-capture') {
    // Quick capture shortcut (Ctrl+Shift+C)
    chrome.storage.local.set({
      quickCapture: true,
      tabId: tab.id
    });
    chrome.action.openPopup();
  } else if (command === 'screenshot-capture') {
    // Screenshot shortcut (Ctrl+Shift+S)
    await handleScreenshotCapture(tab);
  } else if (command === 'start-recording') {
    // Recording shortcut (Ctrl+Shift+R)
    await handleRecordingToggle(tab);
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

// Visual capture handler functions
async function handleScreenshotCapture(tab) {
  try {
    if (!screenshotRecorder) {
      screenshotRecorder = new ScreenshotRecorder();
    }
    
    const result = await screenshotRecorder.captureScreenshot();
    
    if (result.success) {
      // Extract text from screenshot using OCR
      if (!ocrProcessor) {
        ocrProcessor = new OCRProcessor();
      }
      
      const ocrResult = await ocrProcessor.extractText(result.dataUrl);
      
      // Store screenshot and OCR data
      const captureData = {
        type: 'screenshot',
        screenshot: result.dataUrl,
        extractedText: ocrResult.success ? ocrResult.text : '',
        ocrData: ocrResult,
        tabInfo: result.tabInfo,
        timestamp: result.timestamp,
        id: Date.now().toString()
      };
      
      // Save to storage
      const stored = await chrome.storage.local.get(['captures']) || { captures: [] };
      stored.captures = stored.captures || [];
      stored.captures.unshift(captureData);
      
      // Keep only last 50 captures
      if (stored.captures.length > 50) {
        stored.captures = stored.captures.slice(0, 50);
      }
      
      await chrome.storage.local.set({ captures: stored.captures });
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon48.png',
        title: 'Screenshot Captured',
        message: `Screenshot saved${ocrResult.success ? ' with extracted text' : ''}`
      });
      
      // Send to main application if possible
      await sendToMainApp(captureData);
      
    } else {
      console.error('Screenshot capture failed:', result.error);
    }
  } catch (error) {
    console.error('Error capturing screenshot:', error);
  }
}

async function handleRecordingToggle(tab) {
  try {
    if (!screenshotRecorder) {
      screenshotRecorder = new ScreenshotRecorder();
    }
    
    if (isRecording) {
      // Stop recording
      const result = await screenshotRecorder.stopRecording();
      
      if (result.success) {
        isRecording = false;
        currentRecordingTab = null;
        
        // Store recording data
        const recordingData = {
          type: 'recording',
          duration: result.duration,
          timestamp: result.timestamp,
          tabInfo: tab,
          id: Date.now().toString()
        };
        
        // Save to storage
        const stored = await chrome.storage.local.get(['recordings']) || { recordings: [] };
        stored.recordings = stored.recordings || [];
        stored.recordings.unshift(recordingData);
        
        // Keep only last 20 recordings
        if (stored.recordings.length > 20) {
          stored.recordings = stored.recordings.slice(0, 20);
        }
        
        await chrome.storage.local.set({ recordings: stored.recordings });
        
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'images/icon48.png',
          title: 'Recording Stopped',
          message: `Recording saved (${Math.round(result.duration / 1000)}s)`
        });
        
        // Send to main application
        await sendToMainApp(recordingData);
      }
    } else {
      // Start recording
      const result = await screenshotRecorder.startTabRecording();
      
      if (result.success) {
        isRecording = true;
        currentRecordingTab = tab.id;
        
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'images/icon48.png',
          title: 'Recording Started',
          message: 'Screen recording in progress...'
        });
      }
    }
  } catch (error) {
    console.error('Error toggling recording:', error);
  }
}

async function sendToMainApp(captureData) {
  try {
    const config = await chrome.storage.local.get(['serverUrl', 'apiKey']);
    const serverUrl = config.serverUrl || 'http://localhost:5000';
    
    const response = await fetch(`${serverUrl}/api/visual-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(captureData)
    });
    
    if (response.ok) {
      console.log('Visual capture sent to main app successfully');
    } else {
      console.log('Failed to send to main app, stored locally');
    }
  } catch (error) {
    console.log('Main app not available, stored locally');
  }
}

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