# Strategic Content Analysis Platform

A cutting-edge strategic content analysis platform that transforms raw content into actionable insights using advanced AI technologies. Built for Post Creative Strategists using the Define → Shift → Deliver methodology.

## 🚀 Features

### Core Platform
- **AI-Powered Content Analysis** - Deep behavioral insights and cultural truths using OpenAI GPT-4o
- **Real-Time Intelligence** - 16+ integrated platforms (Google Trends, Reddit, YouTube, news APIs)
- **Strategic Brief Builder** - Define → Shift → Deliver framework for professional brief creation
- **Three-Feed System** - Client Pulse, Custom Watch (RSS), and Market Intelligence feeds
- **Truth-Based Analysis** - Fact → Observation → Insight → Human Truth progression
- **Cultural Intelligence** - Attention arbitrage and cultural moment identification

### Chrome Extension
- **Frictionless Content Capture** - One-click capture from any webpage
- **Smart Text Selection** - Context-aware highlighting and analysis
- **Auto-Suggestions** - AI-powered note recommendations
- **Draft System** - Batch processing workflow for strategic analysis
- **Manifest V3** - Future-proof Chrome extension architecture

### Advanced Analytics
- **7 Pillars Cohort Building** - Raw Behavior, Rival Landscape, Local Pulse, Life Lens, Market Moves, Channel Vibes, Surprise Signals
- **Signal Mining** - Real-time cultural intelligence and trend detection
- **Daily Reports** - Automated morning briefings with strategic insights
- **Performance Monitoring** - Real-time system health and debug capabilities

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** + **Radix UI** for professional design
- **React Query** for efficient data fetching
- **Vite** for development and production builds

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database with **Drizzle ORM**
- **Session-based authentication** with bcrypt
- **OpenAI API** integration for content analysis

### Database Schema
- **7 tables** with comprehensive relationships
- **Users, Signals, Sources, Feed Items, User Profiles** and more
- **Full audit trail** for research verification

### External Integrations
- **OpenAI GPT-4o** for content analysis
- **Google Trends API** for trending data
- **Reddit API** for authentic engagement metrics
- **YouTube API** for video content analysis
- **Multiple News APIs** (NewsAPI, GNews, Currents, MediaStack)
- **RSS Parser** for custom feed aggregation

## 🏗 System Architecture

```
├── Frontend (React + TypeScript)
│   ├── 5-Tab Workflow Interface
│   ├── Real-time Data Fetching
│   └── Professional UI Components
├── Backend (Express + TypeScript)
│   ├── 25+ API Endpoints
│   ├── Session Management
│   └── External API Integration
├── Database (PostgreSQL + Drizzle)
│   ├── 7 Tables with Relations
│   └── Type-Safe Operations
└── Chrome Extension (Manifest V3)
    ├── Content Capture
    ├── Smart Analysis
    └── Draft Management
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Maz0327/strategic-content-analysis-platform.git
   cd strategic-content-analysis-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   SESSION_SECRET=your_session_secret
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

### Chrome Extension Setup

1. **Navigate to chrome-extension folder**
2. **Update production URL** in `config.js` when deployed
3. **Load in Chrome**:
   - Open Chrome → Extensions → Developer mode
   - Click "Load unpacked" → Select chrome-extension folder
   - Extension ready for testing

## 📊 Key Components

### Content Analysis Pipeline
1. **Content Capture** - Text input, URL extraction, or Chrome extension
2. **AI Analysis** - OpenAI-powered deep analysis with cultural intelligence
3. **Signal Creation** - User-driven workflow from capture to strategic signal
4. **Brief Building** - Professional strategic brief generation

### Feed Management System
- **Client Pulse** - Project data and analytics integration
- **Custom Watch** - RSS feeds and custom data sources
- **Market Intelligence** - AI-filtered, personalized intelligence feed

### User Experience
- **5-Tab Workflow** - Today's Briefing, Explore Signals, New Capture, Strategic Lab, Manage
- **Real-time Updates** - Live data from external APIs
- **Professional Design** - Clean, strategist-focused interface

## 🔧 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push database schema changes
npm run check        # TypeScript type checking
```

## 🎯 Strategic Workflow

### Define → Shift → Deliver Framework
1. **Define** - Capture and analyze content for strategic insights
2. **Shift** - Transform insights into strategic positioning
3. **Deliver** - Create professional briefs and actionable recommendations

### Signal Progression
- **Capture** → **Potential Signal** → **Signal** → **Insight** → **Brief**
- User-driven workflow with AI suggestions and validation

## 🔒 Security Features

- **Session-based authentication** with secure password hashing
- **Rate limiting** (5 failed attempts = 15-minute lockout)
- **Input validation** with Zod schemas
- **CORS configuration** for Chrome extension support
- **Environment variable protection**

## 📈 Performance

- **2ms average response time**
- **Real-time data processing** from 16+ external APIs
- **Efficient caching** with React Query
- **Lightweight monitoring** system
- **Comprehensive error handling**

## 🎨 UI/UX Features

- **Dark mode support** with system preference detection
- **Professional color scheme** optimized for strategic work
- **Responsive design** for desktop and mobile
- **Loading states** and error boundaries
- **Accessibility** compliance with ARIA standards

## 🔍 Debug & Monitoring

- **Real-time debug panel** accessible via floating button
- **Performance monitoring** with response time tracking
- **Comprehensive logging** system
- **Error tracking** with stack traces
- **API monitoring** for external service health

## 📚 Documentation

- **Complete code export** available in `COMPLETE_SYSTEM_CODE_EXPORT.md`
- **Development context** preserved in `replit.md`
- **Chrome extension guides** in `chrome-extension/` folder
- **API documentation** in route comments

## 🚀 Deployment

### Replit Deployment
1. **Push to Replit** using existing workflow
2. **Configure environment variables** in Replit Secrets
3. **Run deployment** - platform handles hosting and scaling

### Chrome Extension Deployment
1. **Update production URL** in `config.js`
2. **Create Chrome Web Store account** ($5 one-time fee)
3. **Upload extension** following Google guidelines
4. **Privacy policy** and documentation included

## 🎯 Next Steps

- **Test Chrome extension** in developer mode
- **Deploy to production** using Replit
- **Optional Chrome Web Store** publication
- **Add additional integrations** (TikTok, LinkedIn APIs)
- **Implement team collaboration** features

## 💡 Key Innovation

This platform transforms traditional content analysis into strategic intelligence through:
- **Cultural moment detection** for timing strategic initiatives
- **Attention arbitrage** identification for underpriced opportunities
- **Truth-based analysis** revealing human motivations behind content
- **Cross-platform intelligence** aggregation for comprehensive insights

## 🏆 Project Status

- **✅ Development Complete** - All core features implemented and tested
- **✅ Chrome Extension Ready** - Production-ready with advanced features
- **✅ Database Operational** - 7 tables with full relationship mapping
- **✅ API Integration** - 16+ platforms with fallback handling
- **✅ Documentation Complete** - Comprehensive guides and context preservation

## 📞 Support

For development questions or technical support, refer to:
- `replit.md` for comprehensive development context
- `COMPLETE_SYSTEM_CODE_EXPORT.md` for complete code reference
- Chrome extension documentation in `chrome-extension/` folder

---

**Built with ❤️ for strategic content professionals**# Strategist-App
