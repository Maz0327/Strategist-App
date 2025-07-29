# Strategic Content Capture Extension - Full Featured

## 🎯 Features

### Core Capture Modes
- **📝 Text Capture**: Capture selected text with context
- **📸 Screen Selection**: Click and drag to select any screen area
- **📄 Full Page**: Capture entire webpage content

### Project Management
- **Project Dropdown**: Select from existing projects
- **Create New Project**: Add projects directly from extension
- **🚀 Workspace Integration**: One-click access to project workspace

### Strategic Intelligence
- **Auto-Tagging**: 6 core strategic tags (cultural-moment, human-behavior, etc.)
- **Smart Suggestions**: Context-aware note suggestions
- **Template Sections**: Organize content by brief sections
- **Platform Detection**: Auto-detects TikTok, Instagram, LinkedIn, etc.

### Advanced Features
- **Context Menus**: Right-click capture options
- **Keyboard Shortcuts**: Ctrl+Shift+C (quick), Ctrl+Shift+S (screen)
- **Smart Analysis**: Automatic metadata extraction
- **Real-time Sync**: Instant sync with main platform

## 🚀 Installation

### Option 1: Developer Mode (Recommended)
1. Download and extract `chrome-extension-full.zip`
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the extracted folder
6. Extension icon appears in toolbar

### Option 2: Direct Folder
1. Copy the `/chrome-extension-full` folder to your desktop
2. Follow steps 2-6 above

## 🔧 Setup Requirements

### Authentication
1. **Log into main app** first at `http://localhost:5000`
2. **Create at least one project** in the main app
3. Extension uses your existing session

### Permissions
The extension will request:
- **Active Tab**: Read current page content
- **Storage**: Save capture data locally
- **Desktop Capture**: Screen selection functionality
- **Tabs**: Navigate to workspace

## 📱 How to Use

### 1. Basic Capture
- Click extension icon
- Select a project
- Choose capture mode (Text/Screen/Full Page)
- Add strategic notes
- Select relevant tags
- Click "Capture Content"

### 2. Screen Selection
- Click "📸 Screen" mode
- Click "Select & Capture Screen"
- Click and drag to select area
- Press ESC to cancel

### 3. Project Creation
- Click "+" button next to project dropdown
- Enter project name and description
- Click "Create"
- Project is immediately available

### 4. Workspace Access
- Select a project
- Click "🚀 Open Workspace" button
- Opens workspace in new tab
- View all captures for that project

## 🏷️ Strategic Tags

### Core Strategic Framework
- **Cultural Moment**: Viral trends, zeitgeist content
- **Human Behavior**: Psychology insights, user patterns  
- **Rival Content**: Competitor analysis, benchmark content
- **Visual Hook**: Design trends, creative techniques
- **Insight Cue**: Strategic opportunities, actionable intelligence
- **Trend Signal**: Emerging patterns, market shifts

### Auto-Detection
Extension automatically suggests tags based on:
- **Platform**: TikTok → cultural-moment, LinkedIn → human-behavior
- **Content**: Keywords, headlines, context
- **URL patterns**: Social media, news sites, competitor domains

## ⚡ Advanced Features

### Context Menu Integration
- **Right-click selected text** → "Capture Selected Text"
- **Right-click on page** → "Capture Full Page"
- **Right-click anywhere** → "Capture Screen Selection"

### Keyboard Shortcuts
- **Ctrl+Shift+C**: Quick capture (opens popup)
- **Ctrl+Shift+S**: Screen selection mode

### Smart Suggestions
Extension provides contextual note suggestions:
- **TikTok**: "Viral potential analysis", "Gen Z behavior insight"
- **LinkedIn**: "Professional insight", "Industry trend signal"
- **Instagram**: "Visual storytelling technique", "Brand engagement strategy"
- **YouTube**: "Content format innovation", "Creator strategy insight"

## 🔄 Workflow Integration

### Complete Capture Flow
1. **Browse & Discover**: Find strategic content while browsing
2. **Smart Capture**: Use extension to capture with context
3. **Project Organization**: Content automatically organized by project
4. **Workspace Processing**: Access project workspace for batch analysis
5. **Strategic Briefs**: Convert insights into Define→Shift→Deliver framework

### Data Flow
```
Browser Content → Extension Capture → Project Organization → Workspace Analysis → Strategic Briefs
```

## 🛠️ Troubleshooting

### Common Issues

**"Denied" Permission Error:**
- Enable "Developer mode" in Chrome extensions
- Check that all permissions are granted
- Try reloading the extension

**"Connection Error":**
- Ensure main app is running at `http://localhost:5000`
- Log into main app first
- Check browser console for errors (F12)

**Projects Not Loading:**
- Verify you're logged into main app
- Create at least one project in main app
- Check that `/api/projects` endpoint is accessible

**Screen Capture Not Working:**
- Allow desktop capture permission when prompted
- Try using Chrome's built-in screenshot (Ctrl+Shift+S on some systems)
- Check browser console for capture errors

### Debug Mode
1. Right-click extension icon
2. Select "Inspect popup"
3. Check console for error messages
4. Look for network request failures

## 🔗 API Integration

### Backend Endpoints
- **GET** `/api/projects` - Load user projects
- **POST** `/api/projects` - Create new project  
- **POST** `/api/signals/draft` - Save captured content
- **GET** `/projects/{id}/workspace` - Open workspace

### Data Structure
```javascript
{
  projectId: number,
  title: string,
  url: string,
  userNotes: string,
  templateSection: string,
  tags: string[],
  screenshot?: string,
  selectedText?: string,
  isDraft: true,
  status: 'capture'
}
```

## 🚀 Next Steps

After successful installation and testing:
1. **Test all capture modes** (text, screen, full page)
2. **Create a test project** and verify workspace navigation
3. **Try context menus** and keyboard shortcuts
4. **Capture strategic content** and analyze in workspace
5. **Build strategic briefs** using captured insights

## 📊 Success Metrics

Extension is working correctly when:
- ✅ Projects load in dropdown
- ✅ Captures save successfully 
- ✅ Workspace button navigates correctly
- ✅ Tags and notes are preserved
- ✅ Content appears in workspace dashboard
- ✅ Screen selection functions smoothly

Ready to capture strategic intelligence from across the web! 🎯