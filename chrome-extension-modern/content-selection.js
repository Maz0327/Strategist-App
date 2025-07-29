// Modern Screen Selection Tool
(function() {
    'use strict';
    
    // Prevent multiple injections
    if (window.screenSelectionInjected) return;
    window.screenSelectionInjected = true;
    
    let isSelecting = false;
    let overlay = null;
    let selectionBox = null;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    
    // Create overlay for selection
    function createOverlay() {
        overlay = document.createElement('div');
        overlay.id = 'strategic-screen-selector';
        overlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.3) !important;
            z-index: 2147483647 !important;
            cursor: crosshair !important;
            user-select: none !important;
        `;
        
        // Create selection box
        selectionBox = document.createElement('div');
        selectionBox.style.cssText = `
            position: absolute !important;
            border: 3px solid #3b82f6 !important;
            background: rgba(59, 130, 246, 0.1) !important;
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3) !important;
            pointer-events: none !important;
            border-radius: 8px !important;
            display: none !important;
        `;
        
        overlay.appendChild(selectionBox);
        document.body.appendChild(overlay);
        
        // Add instructions
        showInstructions();
    }
    
    function showInstructions() {
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
            color: white !important;
            padding: 12px 24px !important;
            border-radius: 12px !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4) !important;
            z-index: 2147483648 !important;
            animation: slideDown 0.3s ease !important;
        `;
        instructions.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>🖼️</span>
                <span>Click and drag to select screen area • Press ESC to cancel</span>
            </div>
        `;
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        overlay.appendChild(instructions);
        
        // Remove instructions after 3 seconds
        setTimeout(() => {
            if (instructions.parentNode) {
                instructions.style.animation = 'slideUp 0.3s ease';
                setTimeout(() => instructions.remove(), 300);
            }
        }, 3000);
    }
    
    // Start selection process
    function startSelection() {
        if (isSelecting) return;
        
        isSelecting = true;
        createOverlay();
        
        // Event listeners
        overlay.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('keydown', handleKeyDown);
        
        // Disable page scrolling during selection
        document.body.style.overflow = 'hidden';
    }
    
    function handleMouseDown(e) {
        if (e.target !== overlay) return;
        
        startX = e.clientX;
        startY = e.clientY;
        currentX = startX;
        currentY = startY;
        
        selectionBox.style.display = 'block';
        updateSelectionBox();
        
        e.preventDefault();
    }
    
    function handleMouseMove(e) {
        if (selectionBox.style.display === 'none') return;
        
        currentX = e.clientX;
        currentY = e.clientY;
        updateSelectionBox();
        
        e.preventDefault();
    }
    
    function handleMouseUp(e) {
        if (selectionBox.style.display === 'none') return;
        
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
        // Minimum size check
        if (width < 10 || height < 10) {
            cancelSelection();
            return;
        }
        
        // Calculate final selection area
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        
        completeSelection({
            x: left,
            y: top,
            width: width,
            height: height,
            timestamp: new Date().toISOString()
        });
    }
    
    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            cancelSelection();
        }
    }
    
    function updateSelectionBox() {
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
    }
    
    function completeSelection(selectionData) {
        // Show success animation
        showSuccessAnimation();
        
        // Send selection data to extension
        chrome.runtime.sendMessage({
            type: 'SCREEN_SELECTION_COMPLETE',
            data: selectionData
        });
        
        // Clean up after animation
        setTimeout(() => {
            cleanup();
        }, 800);
    }
    
    function showSuccessAnimation() {
        // Create success indicator
        const success = document.createElement('div');
        success.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: linear-gradient(135deg, #10b981, #059669) !important;
            color: white !important;
            padding: 20px 30px !important;
            border-radius: 16px !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4) !important;
            z-index: 2147483649 !important;
            animation: successPulse 0.8s ease !important;
        `;
        success.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 24px;">✅</span>
                <span>Screen area captured successfully!</span>
            </div>
        `;
        
        // Add success animation
        const successStyle = document.createElement('style');
        successStyle.textContent = `
            @keyframes successPulse {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
                100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(successStyle);
        
        document.body.appendChild(success);
        
        // Remove success indicator
        setTimeout(() => {
            success.remove();
            successStyle.remove();
        }, 800);
    }
    
    function cancelSelection() {
        chrome.runtime.sendMessage({
            type: 'SCREEN_SELECTION_CANCELLED'
        });
        
        cleanup();
    }
    
    function cleanup() {
        isSelecting = false;
        
        // Remove event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
        
        // Remove overlay
        if (overlay) {
            overlay.remove();
            overlay = null;
        }
        
        // Restore page scrolling
        document.body.style.overflow = '';
        
        // Reset variables
        selectionBox = null;
        startX = startY = currentX = currentY = 0;
    }
    
    // Start the selection process
    startSelection();
    
})();