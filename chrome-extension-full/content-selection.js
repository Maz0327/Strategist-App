// Screen Selection Tool for Strategic Content Capture
console.log('Screen Selection Tool loaded');

class ScreenSelectionTool {
    constructor() {
        this.isSelecting = false;
        this.startX = 0;
        this.startY = 0;
        this.selectionBox = null;
        this.overlay = null;
        this.boundHandlers = {
            mousedown: this.onMouseDown.bind(this),
            mousemove: this.onMouseMove.bind(this),
            mouseup: this.onMouseUp.bind(this),
            keydown: this.onKeyDown.bind(this)
        };
    }

    // Start selection mode
    startSelection() {
        if (this.isSelecting) return;
        
        this.isSelecting = true;
        this.createOverlay();
        this.attachEventListeners();
        document.body.style.cursor = 'crosshair';
        
        // Show instructions
        this.showInstructions();
    }

    // Stop selection mode
    stopSelection() {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        this.removeOverlay();
        this.detachEventListeners();
        document.body.style.cursor = '';
        this.hideInstructions();
    }

    // Create overlay for selection
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.3);
            z-index: 999999;
            cursor: crosshair;
        `;
        
        this.selectionBox = document.createElement('div');
        this.selectionBox.style.cssText = `
            position: absolute;
            border: 2px solid #4CAF50;
            background: rgba(76, 175, 80, 0.1);
            display: none;
            z-index: 1000000;
        `;
        
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.selectionBox);
    }

    // Remove overlay
    removeOverlay() {
        if (this.overlay) {
            document.body.removeChild(this.overlay);
            this.overlay = null;
        }
        if (this.selectionBox) {
            document.body.removeChild(this.selectionBox);
            this.selectionBox = null;
        }
    }

    // Attach event listeners
    attachEventListeners() {
        document.addEventListener('mousedown', this.boundHandlers.mousedown);
        document.addEventListener('mousemove', this.boundHandlers.mousemove);
        document.addEventListener('mouseup', this.boundHandlers.mouseup);
        document.addEventListener('keydown', this.boundHandlers.keydown);
    }

    // Detach event listeners
    detachEventListeners() {
        document.removeEventListener('mousedown', this.boundHandlers.mousedown);
        document.removeEventListener('mousemove', this.boundHandlers.mousemove);
        document.removeEventListener('mouseup', this.boundHandlers.mouseup);
        document.removeEventListener('keydown', this.boundHandlers.keydown);
    }

    // Mouse down handler
    onMouseDown(e) {
        if (!this.isSelecting) return;
        
        e.preventDefault();
        this.startX = e.clientX;
        this.startY = e.clientY;
        
        this.selectionBox.style.left = this.startX + 'px';
        this.selectionBox.style.top = this.startY + 'px';
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';
        this.selectionBox.style.display = 'block';
    }

    // Mouse move handler
    onMouseMove(e) {
        if (!this.isSelecting || !this.selectionBox.style.display) return;
        
        e.preventDefault();
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        const left = Math.min(currentX, this.startX);
        const top = Math.min(currentY, this.startY);
        
        this.selectionBox.style.left = left + 'px';
        this.selectionBox.style.top = top + 'px';
        this.selectionBox.style.width = width + 'px';
        this.selectionBox.style.height = height + 'px';
    }

    // Mouse up handler
    onMouseUp(e) {
        if (!this.isSelecting || !this.selectionBox.style.display) return;
        
        e.preventDefault();
        
        const rect = this.selectionBox.getBoundingClientRect();
        
        // Minimum selection size
        if (rect.width < 10 || rect.height < 10) {
            this.selectionBox.style.display = 'none';
            return;
        }
        
        this.captureSelection(rect);
        this.stopSelection();
    }

    // Keyboard handler (ESC to cancel)
    onKeyDown(e) {
        if (e.key === 'Escape') {
            this.stopSelection();
        }
    }

    // Capture the selected area
    async captureSelection(rect) {
        try {
            // Use html2canvas or similar approach to capture the selected area
            const canvas = await this.captureArea(rect);
            const dataURL = canvas.toDataURL('image/png');
            
            // Send to popup for processing
            chrome.runtime.sendMessage({
                type: 'screenSelectionCaptured',
                data: {
                    screenshot: dataURL,
                    dimensions: {
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        height: rect.height
                    },
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Screen capture error:', error);
            chrome.runtime.sendMessage({
                type: 'screenCaptureError',
                error: error.message
            });
        }
    }

    // Capture specific area using Canvas API
    async captureArea(rect) {
        return new Promise((resolve, reject) => {
            try {
                // Create canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = rect.width;
                canvas.height = rect.height;
                
                // Use html2canvas approach or browser screenshot API
                // For now, we'll use a simplified approach
                html2canvas(document.body, {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    useCORS: true,
                    scrollX: 0,
                    scrollY: 0
                }).then(canvas => {
                    resolve(canvas);
                }).catch(reject);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    // Show selection instructions
    showInstructions() {
        const instructions = document.createElement('div');
        instructions.id = 'screen-selection-instructions';
        instructions.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            z-index: 1000001;
            backdrop-filter: blur(10px);
        `;
        instructions.textContent = 'Click and drag to select area • Press ESC to cancel';
        document.body.appendChild(instructions);
    }

    // Hide selection instructions
    hideInstructions() {
        const instructions = document.getElementById('screen-selection-instructions');
        if (instructions) {
            document.body.removeChild(instructions);
        }
    }
}

// Create global instance
window.screenSelectionTool = new ScreenSelectionTool();

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'startScreenSelection':
            window.screenSelectionTool.startSelection();
            sendResponse({ success: true });
            break;
        case 'stopScreenSelection':
            window.screenSelectionTool.stopSelection();
            sendResponse({ success: true });
            break;
    }
});

// Simplified html2canvas alternative using native browser APIs
function html2canvas(element, options = {}) {
    return new Promise((resolve, reject) => {
        try {
            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = options.width || element.offsetWidth;
            canvas.height = options.height || element.offsetHeight;
            
            // Use experimental browser screenshot API if available
            if ('getDisplayMedia' in navigator.mediaDevices) {
                navigator.mediaDevices.getDisplayMedia({
                    video: {
                        mediaSource: 'screen',
                        width: { ideal: canvas.width },
                        height: { ideal: canvas.height }
                    }
                }).then(stream => {
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.play();
                    
                    video.onloadedmetadata = () => {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        stream.getTracks().forEach(track => track.stop());
                        resolve(canvas);
                    };
                }).catch(reject);
            } else {
                // Fallback: create a simple placeholder
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#333';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Screen capture placeholder', canvas.width / 2, canvas.height / 2);
                resolve(canvas);
            }
        } catch (error) {
            reject(error);
        }
    });
}

console.log('Screen Selection Tool initialized');