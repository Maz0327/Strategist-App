# Strategist App

A dynamic strategic content analysis platform that enables intelligent insight generation through flexible, user-centric design and advanced AI technologies.

## Features

- **AI-Powered Content Analysis**: Deep behavioral insights and cultural intelligence using OpenAI GPT-4o-mini
- **Multi-Source Intelligence**: 40+ trending topics from 12+ platforms (Google Trends, Reddit, YouTube, etc.)
- **Chrome Extension**: Frictionless content capture from any webpage
- **Strategic Brief Builder**: Define → Shift → Deliver framework for strategic content creation
- **Real-time Chat System**: AI assistant with comprehensive documentation knowledge
- **Three-Channel Intelligence**: Client Pulse, Custom Feeds, and Market Intelligence

## Quick Start

```bash
git clone https://github.com/your-username/strategist-app.git
cd strategist-app

# 1. Copy and configure environment variables
cp .env.example .env
# Edit .env with your API keys

# 2. Bootstrap the environment
./scripts/bootstrap.sh

# 3. Start development server
npm run dev
```

Your app will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## Replit Import

1. In Replit, choose **Import from GitHub**
2. Select this repository
3. Copy `.env.example` to `.env` and add your API keys
4. Click **Run** - Replit will automatically install dependencies and start the server

## API Keys Required

The following API keys are needed for full functionality:

- `OPENAI_API_KEY` - For content analysis (required)
- `DATABASE_URL` - PostgreSQL database connection (required)
- `REDDIT_CLIENT_ID` & `REDDIT_CLIENT_SECRET` - For Reddit trends
- `YOUTUBE_API_KEY` - For YouTube trending content
- `NEWS_API_KEY` - For news intelligence
- Additional API keys listed in `.env.example`

## Project Structure

```
├── client/              # React frontend
├── server/              # Express backend
├── shared/              # Shared types and schemas
├── chrome-extension/    # Chrome extension for content capture
├── docs/               # Documentation
├── scripts/            # Build and deployment scripts
└── .env.example        # Environment variables template
```

## Development

- **Database**: PostgreSQL with Drizzle ORM
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **AI**: OpenAI GPT-4o-mini for cost-effective analysis
- **External APIs**: 12+ platforms for real-time intelligence

## Beta Testing

Currently configured for 6 beta users with:
- No subscription fees during beta period
- Rate limits: 50 chat messages/minute, 300/day per user
- Cost structure: $17.30/month maximum per user
- Realistic usage: $30-50/month total for all beta users

## Documentation

Comprehensive documentation is available in the `docs/` directory:
- `replit.md` - Main project documentation
- `DEVELOPMENT_SESSION_LOG_JULY_15_2025.md` - Latest session details
- `GIT_DEPLOYMENT_READY.md` - Deployment guide

## License

This project is currently in private beta testing.