# Strategic Content Capture - Chrome Extension

A Chrome extension that enables frictionless content capture directly from your browser into the strategic content analysis platform.

## Features

- **One-Click Capture**: Save interesting content while browsing
- **Text Selection**: Capture specific text selections from any webpage
- **Personal Notes**: Add context and insights alongside captured content
- **Draft Storage**: Content saved as drafts for later batch processing
- **Secure Authentication**: Uses your existing platform session

## Installation

### For Development/Testing:

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `chrome-extension` folder
4. The extension will appear in your toolbar

### For Production:

The extension will be available on the Chrome Web Store after review approval.

## Usage

1. **Browse Content**: Navigate to any webpage with interesting content
2. **Select Text** (Optional): Highlight specific text you want to capture
3. **Click Extension**: Click the extension icon in your toolbar
4. **Add Notes**: Add your thoughts and insights in the notes field
5. **Save Draft**: Click "Save to Drafts" to store for later analysis
6. **Process Later**: Return to the main platform to analyze and convert drafts to signals

## Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension standard
- **Minimal Permissions**: Only requests `activeTab` and `storage` permissions
- **Session Authentication**: Uses existing platform session for security
- **CORS Support**: Configured for both development and production environments

### Files Structure
- `manifest.json`: Extension configuration and permissions
- `popup.html/js/css`: Main extension interface
- `content.js`: Webpage interaction and text selection
- `config.js`: Environment configuration for dev/prod

### Security
- No broad website permissions required
- Uses secure session-based authentication
- All data transmitted over HTTPS in production
- Local storage only for temporary text selection

## Development

### Configuration
Update `config.js` with your production backend URL:
```javascript
production: {
  backendUrl: 'https://your-app-name.replit.app',
  apiPrefix: '/api'
}
```

### Testing
1. Load extension in developer mode
2. Navigate to any webpage
3. Test text selection and content capture
4. Verify drafts appear in main platform

## Google Chrome Web Store Requirements

This extension follows all Google guidelines:
- **Manifest V3**: Latest extension standard
- **Minimal Permissions**: Only necessary permissions requested
- **Clear Purpose**: Focused on content capture functionality
- **Professional Design**: Clean, intuitive interface
- **Privacy Compliant**: No unnecessary data collection
- **Secure Communication**: HTTPS and session-based auth

## Support

For issues or questions, contact support through the main platform or development team.