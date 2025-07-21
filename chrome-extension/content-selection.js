// Content selection functionality for enhanced Chrome extension
class SelectionTool {
  constructor() {
    this.isSelecting = false;
    this.selectedElement = null;
    this.overlay = null;
    this.mode = 'element'; // 'element' or 'region'
    this.selectionBox = null;
    this.startPos = null;
  }

  // Initialize element selection mode
  initElementSelection() {
    this.mode = 'element';
    this.createOverlay();
    this.addElementListeners();
    document.body.style.cursor = 'crosshair';
  }

  // Initialize region selection mode
  initRegionSelection() {
    this.mode = 'region';
    this.createOverlay();
    this.addRegionListeners();
    document.body.style.cursor = 'crosshair';
  }

  // Create overlay for selection
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'strategist-selection-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.1);
      z-index: 10000;
      pointer-events: auto;
    `;
    document.body.appendChild(this.overlay);
  }

  // Add element selection listeners
  addElementListeners() {
    this.overlay.addEventListener('mouseover', this.handleElementHover.bind(this));
    this.overlay.addEventListener('click', this.handleElementClick.bind(this));
    this.overlay.addEventListener('keydown', this.handleKeyPress.bind(this));
  }

  // Add region selection listeners
  addRegionListeners() {
    this.overlay.addEventListener('mousedown', this.handleRegionStart.bind(this));
    this.overlay.addEventListener('mousemove', this.handleRegionMove.bind(this));
    this.overlay.addEventListener('mouseup', this.handleRegionEnd.bind(this));
    this.overlay.addEventListener('keydown', this.handleKeyPress.bind(this));
  }

  // Handle element hover
  handleElementHover(e) {
    if (this.mode !== 'element') return;
    
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target === this.overlay) return;

    // Remove previous highlight
    this.removeHighlight();

    // Add highlight to current element
    this.highlightElement(target);
  }

  // Handle element click
  handleElementClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target === this.overlay) return;

    this.selectedElement = target;
    this.captureElement(target);
  }

  // Handle region selection start
  handleRegionStart(e) {
    if (this.mode !== 'region') return;
    
    this.isSelecting = true;
    this.startPos = { x: e.clientX, y: e.clientY };
    
    this.selectionBox = document.createElement('div');
    this.selectionBox.style.cssText = `
      position: fixed;
      border: 2px dashed #007cba;
      background: rgba(0, 124, 186, 0.1);
      z-index: 10001;
      pointer-events: none;
    `;
    document.body.appendChild(this.selectionBox);
  }

  // Handle region selection move
  handleRegionMove(e) {
    if (!this.isSelecting || this.mode !== 'region') return;

    const rect = {
      left: Math.min(this.startPos.x, e.clientX),
      top: Math.min(this.startPos.y, e.clientY),
      width: Math.abs(e.clientX - this.startPos.x),
      height: Math.abs(e.clientY - this.startPos.y)
    };

    this.selectionBox.style.left = rect.left + 'px';
    this.selectionBox.style.top = rect.top + 'px';
    this.selectionBox.style.width = rect.width + 'px';
    this.selectionBox.style.height = rect.height + 'px';
  }

  // Handle region selection end
  handleRegionEnd(e) {
    if (!this.isSelecting || this.mode !== 'region') return;

    this.isSelecting = false;
    const rect = this.selectionBox.getBoundingClientRect();
    this.captureRegion(rect);
  }

  // Handle key press (Escape to cancel)
  handleKeyPress(e) {
    if (e.key === 'Escape') {
      this.cleanup();
    }
  }

  // Highlight element
  highlightElement(element) {
    element.style.outline = '2px solid #007cba';
    element.style.outlineOffset = '1px';
    element.style.backgroundColor = 'rgba(0, 124, 186, 0.1)';
  }

  // Remove highlight
  removeHighlight() {
    const highlighted = document.querySelectorAll('[style*="outline"]');
    highlighted.forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.backgroundColor = '';
    });
  }

  // Capture element screenshot
  async captureElement(element) {
    const rect = element.getBoundingClientRect();
    const screenshot = await this.captureScreenshot();
    
    // Crop to element bounds
    const croppedImage = await this.cropImage(screenshot, rect);
    
    this.sendToPopup({
      type: 'screenshot_captured',
      data: croppedImage,
      elementInfo: {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        text: element.textContent?.substring(0, 100)
      }
    });
    
    this.cleanup();
  }

  // Capture region screenshot
  async captureRegion(rect) {
    const screenshot = await this.captureScreenshot();
    const croppedImage = await this.cropImage(screenshot, rect);
    
    this.sendToPopup({
      type: 'screenshot_captured',
      data: croppedImage,
      regionInfo: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      }
    });
    
    this.cleanup();
  }

  // Capture full page screenshot
  async captureFullPage() {
    try {
      const screenshot = await this.captureScreenshot();
      this.sendToPopup({
        type: 'screenshot_captured',
        data: screenshot,
        fullPage: true
      });
    } catch (error) {
      console.error('Failed to capture full page:', error);
    }
  }

  // Capture screenshot using Chrome API
  async captureScreenshot() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'captureTab' }, (response) => {
        resolve(response.screenshot);
      });
    });
  }

  // Crop image to specified bounds
  async cropImage(dataUrl, rect) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        
        ctx.drawImage(
          img,
          rect.left * devicePixelRatio,
          rect.top * devicePixelRatio,
          rect.width * devicePixelRatio,
          rect.height * devicePixelRatio,
          0,
          0,
          canvas.width,
          canvas.height
        );
        
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.src = dataUrl;
    });
  }

  // Send message to popup
  sendToPopup(message) {
    chrome.runtime.sendMessage(message);
  }

  // Cleanup selection
  cleanup() {
    this.removeHighlight();
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.selectionBox) {
      this.selectionBox.remove();
      this.selectionBox = null;
    }
    document.body.style.cursor = '';
    this.isSelecting = false;
    this.selectedElement = null;
  }
}

// Initialize selection tool
window.selectionTool = new SelectionTool();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'startElementSelection':
      window.selectionTool.initElementSelection();
      break;
    case 'startRegionSelection':
      window.selectionTool.initRegionSelection();
      break;
    case 'captureFullPage':
      window.selectionTool.captureFullPage();
      break;
    case 'cancelSelection':
      window.selectionTool.cleanup();
      break;
  }
});

// Smart content boundary detection
class SmartBoundaryDetector {
  static detectSemanticContainer(element) {
    const containers = ['article', 'section', 'div', 'main', 'aside'];
    let current = element;
    
    while (current && current !== document.body) {
      if (containers.includes(current.tagName.toLowerCase())) {
        // Check if this is a meaningful container
        if (this.isSemanticContainer(current)) {
          return current;
        }
      }
      current = current.parentElement;
    }
    
    return element;
  }
  
  static isSemanticContainer(element) {
    const classList = element.className.toLowerCase();
    const semanticClasses = [
      'article', 'post', 'content', 'main', 'card', 
      'item', 'entry', 'section', 'widget', 'block'
    ];
    
    return semanticClasses.some(cls => classList.includes(cls)) ||
           element.children.length > 3 ||
           element.textContent.length > 200;
  }
}

// Export for use in popup
window.SmartBoundaryDetector = SmartBoundaryDetector;