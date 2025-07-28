# Where to Find the Workspace - Extension Integration Guide

## 🎯 Exact Location of Workspace in Your System

When you capture content with the Chrome extension, here's exactly where it appears:

### 1. Main Navigation Path
```
Main App → Projects → [Select a Project] → Workspace Button → Project Workspace
```

### 2. Direct URL Access
```
http://localhost:5000/projects/{PROJECT_ID}/workspace
```

### 3. Step-by-Step Navigation

#### Method 1: Through Projects Gallery
1. **Go to Projects Section**
   - In your main app, click "Projects" in the left sidebar
   - You'll see a Pinterest-style gallery of your projects

2. **Find Your Project**
   - Look for the project you assigned content to via the extension
   - Each project card shows project name, description, and capture count

3. **Click Workspace Button**
   - Each project card has a "Workspace" button
   - Click it to open that project's workspace

#### Method 2: Through Extension Direct Link
1. **Use Extension**
   - Click the Chrome extension icon on any webpage
   - Select a project from the dropdown

2. **Click Workspace Button**
   - The blue "🚀 Open Workspace" button appears
   - Click it to open the workspace in a new tab

3. **Direct Navigation**
   - This opens `/projects/{id}/workspace` directly
   - No need to navigate through the main app

## 🖥️ What You'll See in the Workspace

### Workspace Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Projects / Project Name / Workspace                         │
├─────────────────────────────────────────────────────────────┤
│ Project Name Workspace                    [Batch Analyze]   │
│ X captures • Y analyzed                                     │
├─────────────────────────────────────────────────────────────┤
│ [Search captures...] [Tag Filter] [Multi-select Mode]      │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Capture Card 1  │ │ Capture Card 2  │ │ Capture Card 3  │ │
│ │ From Extension  │ │ From Extension  │ │ From Manual     │ │
│ │ [Quick/Deep]    │ │ [Analyzed]      │ │ [Quick/Deep]    │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Extension Captures Display As:
- **Capture Cards**: Each extension capture appears as a Pinterest-style card
- **Source Indicator**: Shows it came from browser extension
- **Project Assignment**: Grouped under the project you selected
- **Template Section**: Categorized by the brief section you chose
- **Analysis Status**: Shows if it's been analyzed or needs analysis

## 🔄 Complete Extension → Workspace Flow

### 1. Capture Phase (In Extension)
```
Chrome Extension Popup:
├── Select Project: "My Marketing Project"
├── Template Section: "Cultural Signals"  
├── Add Notes: "Interesting trend on TikTok..."
└── Click "Save to Drafts"
```

### 2. Workspace Access (Two Ways)
```
Option A - Direct from Extension:
└── Click "🚀 Open Workspace" button
    └── Opens: localhost:5000/projects/2/workspace

Option B - Through Main App:
├── Go to Projects page
├── Find "My Marketing Project" card
└── Click "Workspace" button
    └── Opens: localhost:5000/projects/2/workspace
```

### 3. Workspace View (What You See)
```
My Marketing Project Workspace:
├── Breadcrumb: Projects / My Marketing Project / Workspace
├── Header: "My Marketing Project Workspace" 
├── Stats: "5 captures • 2 analyzed"
├── Filters: Search, tags, analysis status
└── Capture Cards:
    ├── Card 1: "Interesting trend on TikTok..." (from extension)
    │   ├── Status: Ready for analysis  
    │   ├── Section: Cultural Signals
    │   └── Actions: [Quick Analysis] [Deep Analysis]
    ├── Card 2: "Instagram Reel analysis" (from extension)
    │   ├── Status: Analyzed ✓
    │   ├── Section: Platform Signals  
    │   └── Actions: [View Results] [Edit Notes]
    └── Card 3: "Market research notes" (manual entry)
        ├── Status: Draft
        ├── Section: Performance
        └── Actions: [Quick Analysis] [Deep Analysis]
```

## 🎯 Key Integration Points

### Extension Captures Show:
- **Title**: From webpage title or your custom title
- **Content**: Selected text or full page content
- **Notes**: Your personal observations from extension
- **Project**: The project you assigned it to
- **Section**: The brief template section you chose
- **Tags**: Auto-detected + manual tags from extension
- **Source**: "Browser Extension" indicator

### Workspace Features for Extension Content:
- **Batch Analysis**: Select multiple extension captures for analysis
- **Note Editing**: Add workspace notes to extension captures
- **Status Tracking**: See analysis progress for each capture
- **Search & Filter**: Find extension captures by content, tags, or status
- **Brief Integration**: Use analyzed extension content in strategic briefs

## 🔍 How to Test Right Now

1. **Load Extension**: Go to `chrome://extensions/`, enable developer mode, load `/chrome-extension` folder
2. **Visit Any Site**: Go to a news article or blog post  
3. **Open Extension**: Click the extension icon in Chrome toolbar
4. **Create/Select Project**: Choose a project or create "Test Project"
5. **Select Template Section**: Choose "Cultural Signals" or any section
6. **Add Notes**: Write "Testing workspace integration"
7. **Save Content**: Click "Save to Drafts"
8. **Access Workspace**: Click "🚀 Open Workspace" button
9. **View Results**: See your capture in the workspace dashboard

The workspace is a fully functional project management interface where all your extension captures get organized, analyzed, and prepared for strategic brief creation.

---

**Quick Answer**: The workspace appears at `/projects/{id}/workspace` and shows all content captured via the extension organized by project, with tools for batch analysis and brief creation.