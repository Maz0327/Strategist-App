# Chrome Extension Test Setup Guide

## Quick Start Testing

### 1. Install Extension in Chrome
1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `chrome-extension` folder from this project
6. Extension should appear in your toolbar

### 2. Create Test Icons (Temporary)
Since we need icon files for testing, create simple placeholder icons:

**Option A: Download Simple Icons**
- Download any 16x16, 48x48, and 128x128 PNG icons
- Rename them to `icon16.png`, `icon48.png`, `icon128.png`
- Place in `chrome-extension/images/` folder

**Option B: Use Online Icon Generator**
- Visit https://favicon.io/favicon-generator/
- Create simple icons with "SC" text
- Download and place in `chrome-extension/images/` folder

### 3. Update Configuration
Edit `chrome-extension/config.js` and `chrome-extension/popup.js`:

**For Local Testing:**
```javascript
// In config.js and popup.js, ensure development config points to:
backendUrl: 'http://localhost:5000'
```

**For Production Testing:**
```javascript
// Update with your deployed app URL:
backendUrl: 'https://your-app-name.replit.app'
```

### 4. Test Extension Features

**Test 1: Basic Popup**
1. Click extension icon in toolbar
2. Verify popup opens with clean interface
3. Check that page title and URL are displayed

**Test 2: Text Selection**
1. Navigate to any webpage (e.g., news article)
2. Highlight some text
3. Click extension icon
4. Verify selected text appears in popup

**Test 3: Content Capture**
1. With text selected, add notes in the text area
2. Click "Save to Drafts"
3. Verify success message appears
4. Check main platform for draft content

**Test 4: Authentication**
1. Test with logged-out state (should show auth error)
2. Login to main platform
3. Test capture again (should work)

### 5. Debugging

**Check Extension Errors:**
1. Go to `chrome://extensions/`
2. Find your extension
3. Click "Errors" button if present
4. View console logs

**Check Background Console:**
1. Right-click extension icon
2. Select "Inspect popup"
3. Check console for errors

**Check Network Requests:**
1. Open popup inspector
2. Go to Network tab
3. Test capture functionality
4. Verify API calls are working

### 6. Common Issues

**Extension Won't Load:**
- Check manifest.json syntax
- Verify all required files exist
- Check for file path errors

**Popup Won't Open:**
- Verify popup.html exists
- Check for JavaScript errors
- Ensure icons are present

**API Calls Fail:**
- Check CORS configuration
- Verify authentication status
- Check network connectivity

**Content Not Saving:**
- Verify user is logged in
- Check backend endpoint exists
- Verify database schema is updated

### 7. Production Testing

**Before Chrome Web Store Submission:**
1. Test with production backend URL
2. Verify all features work over HTTPS
3. Test on multiple websites
4. Check privacy policy compliance
5. Verify minimal permissions work correctly

**Final Checklist:**
- [ ] Icons created and properly sized
- [ ] Production URL configured
- [ ] All features tested and working
- [ ] Privacy policy reviewed
- [ ] Extension description written
- [ ] Screenshots taken for store listing

### 8. Extension Packaging

**For Chrome Web Store:**
```bash
cd chrome-extension
zip -r strategic-content-capture-v1.0.0.zip .
```

**For Private Distribution:**
- Share entire `chrome-extension` folder
- Include installation instructions
- Provide support for developer mode setup

This test setup ensures the extension works correctly before submission to Chrome Web Store.