/**
 * Screenshot and Screen Recording Module for Strategic Content Capture
 * Adds visual capture capabilities to the existing content analysis system
 */

class ScreenshotRecorder {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordingStartTime = null;
  }

  /**
   * Capture screenshot of current active tab
   * @returns {Promise<string>} Base64 encoded image data
   */
  async captureScreenshot() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png',
        quality: 90
      });
      
      return {
        success: true,
        dataUrl,
        timestamp: new Date().toISOString(),
        tabInfo: {
          url: tab.url,
          title: tab.title,
          tabId: tab.id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start screen recording of current tab
   * @returns {Promise<object>} Recording status
   */
  async startTabRecording() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const streamId = await chrome.tabCapture.capture({
        audio: true,
        video: true
      });
      
      if (!streamId) {
        throw new Error('Failed to start tab capture');
      }
      
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.recordedChunks = [];
      
      return {
        success: true,
        streamId,
        message: 'Tab recording started',
        tabInfo: {
          url: tab.url,
          title: tab.title,
          tabId: tab.id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start desktop screen recording
   * @returns {Promise<object>} Recording status
   */
  async startDesktopRecording() {
    try {
      const streamId = await chrome.desktopCapture.chooseDesktopMedia(
        ['screen', 'window', 'tab'],
        undefined
      );
      
      if (!streamId) {
        throw new Error('User cancelled desktop capture');
      }
      
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.recordedChunks = [];
      
      return {
        success: true,
        streamId,
        message: 'Desktop recording started'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop current recording
   * @returns {Promise<object>} Recording data
   */
  async stopRecording() {
    if (!this.isRecording) {
      return {
        success: false,
        error: 'No recording in progress'
      };
    }
    
    try {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
      
      this.isRecording = false;
      const duration = Date.now() - this.recordingStartTime;
      
      return {
        success: true,
        duration,
        chunks: this.recordedChunks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get recording status
   * @returns {object} Current recording status
   */
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      duration: this.isRecording ? Date.now() - this.recordingStartTime : 0,
      startTime: this.recordingStartTime
    };
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScreenshotRecorder;
} else {
  window.ScreenshotRecorder = ScreenshotRecorder;
}