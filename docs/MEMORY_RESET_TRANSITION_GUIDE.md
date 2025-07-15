# Memory Reset Transition Guide

## When to Use This Guide

Use this guide when:
- Your current Replit chat memory is full and you need to start a new chat
- You need to recreate your development environment in a fresh Replit session
- You want to continue working on the Strategist App from where you left off

## Prerequisites

- Your code is already pushed to GitHub (or you need to push it first)
- You have your API keys saved somewhere secure (password manager, notes, etc.)
- You know your GitHub repository URL

---

## Step-by-Step Transition Process

### Step 1: Prepare Current Environment (If Not Already Done)

**In your current Replit chat:**

1. **Check if code is pushed to GitHub:**
   ```bash
   git status
   git log --oneline -5
   ```

2. **If changes need to be pushed:**
   ```bash
   git add .
   git commit -m "Latest changes before memory reset"
   git push origin main
   ```

3. **Save your current database state (if needed):**
   - Note: Your production database on Supabase will remain intact
   - Only local development data will be lost

### Step 2: Start New Replit Chat

1. **Open a new Replit chat session**
2. **Import your repository:**
   - Click "Create Repl" or "Import from GitHub"
   - Enter your GitHub repository URL
   - Wait for import to complete

### Step 3: Environment Setup

1. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file with your API keys:**
   ```
   # Database
   DATABASE_URL=your_postgresql_connection_string
   
   # OpenAI API
   OPENAI_API_KEY=your_openai_key
   
   # News APIs
   NEWS_API_KEY=your_news_api_key
   GNEWS_API_KEY=your_gnews_key
   CURRENTS_API_KEY=your_currents_key
   
   # Social Media APIs
   REDDIT_CLIENT_ID=your_reddit_client_id
   REDDIT_CLIENT_SECRET=your_reddit_secret
   YOUTUBE_API_KEY=your_youtube_key
   
   # Music APIs
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_secret
   
   # Other APIs (add as needed)
   TMDB_API_KEY=your_tmdb_key
   GENIUS_ACCESS_TOKEN=your_genius_token
   
   # Session
   SESSION_SECRET=your_session_secret
   ```

### Step 4: Bootstrap the Environment

1. **Run the bootstrap script:**
   ```bash
   ./scripts/bootstrap.sh
   ```

2. **Wait for the process to complete** (should take 2-3 minutes)

3. **If bootstrap fails, run commands manually:**
   ```bash
   npm ci
   pip install --upgrade pip
   pip install -e .
   npm run db:push
   npm run build
   ```

### Step 5: Start the Application

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Verify the application is running:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

3. **Test basic functionality:**
   - Try logging in with: `admin@strategist.app` / `AdminSecure123!`
   - Check if trending topics are loading
   - Test the chat system

### Step 6: Verify System Status

1. **Check database connection:**
   - Login to your admin account
   - Verify your existing data is still there (it should be in production database)

2. **Test API integrations:**
   - Go to Trending Topics and verify data is loading
   - Test a few API endpoints to ensure they're working

3. **Check Chrome extension (if needed):**
   - Make sure production URL is updated in the extension
   - Test content capture functionality

### Step 7: Update Context in New Chat

**Tell the new Replit Agent:**

"I'm continuing work on the Strategist App. The system is already set up and running. Here's the current status:

- **Project**: Strategic content analysis platform with AI-powered insights
- **Current Status**: Beta-ready system configured for 6 users
- **Database**: PostgreSQL with 16 tables, admin user created
- **APIs**: 40+ trending topics from 12+ platforms operational
- **Cost Structure**: $17.30/month max per user, realistic $30-50/month for 6 beta users
- **Rate Limits**: 50 chat messages/minute, 300/day per user
- **Architecture**: React frontend, Express backend, Chrome extension complete

Please read the `docs/replit.md` file for complete project context and user preferences. The system is deployment-ready and optimized for beta testing."

---

## Troubleshooting Common Issues

### Issue: Bootstrap Script Fails

**Solution:**
```bash
# Check if script is executable
chmod +x scripts/bootstrap.sh

# Run commands manually
npm ci
pip install --upgrade pip
npm run db:push
npm run build
```

### Issue: Database Connection Fails

**Solution:**
1. Verify `DATABASE_URL` in `.env` file
2. Check if PostgreSQL service is running
3. Test connection manually:
   ```bash
   npm run db:push
   ```

### Issue: API Keys Not Working

**Solution:**
1. Double-check all API keys in `.env` file
2. Verify no extra spaces or quotes around keys
3. Test individual APIs through the frontend

### Issue: NPM Install Errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port Already in Use

**Solution:**
```bash
# Kill existing process
pkill -f "node.*server"

# Start fresh
npm run dev
```

---

## Important Notes

1. **Your Production Database**: Your PostgreSQL database on Supabase remains intact across chat sessions
2. **API Keys**: Always use your actual API keys, never placeholder values
3. **GitHub Repository**: Your code backup is the source of truth
4. **Documentation**: Always refer to `docs/replit.md` for project context
5. **Admin User**: Login with `admin@strategist.app` / `AdminSecure123!`

---

## Quick Reference Commands

```bash
# Complete setup from scratch
cp .env.example .env
# (Edit .env with your API keys)
./scripts/bootstrap.sh
npm run dev

# Manual database reset (if needed)
npm run db:push

# Check system status
curl http://localhost:5000/api/auth/me
curl http://localhost:5000/api/topics | jq '.topics | length'

# Test chat system
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "sessionId": ""}'
```

---

## Success Checklist

- [ ] Repository imported successfully
- [ ] `.env` file configured with all API keys
- [ ] Bootstrap script completed without errors
- [ ] Application running on http://localhost:5000
- [ ] Admin login working
- [ ] Trending topics loading (40+ topics)
- [ ] Chat system responding
- [ ] Database connection verified
- [ ] New Replit Agent briefed on project status

**Time to Complete**: 10-15 minutes for experienced user, 20-30 minutes for first time

This process ensures seamless continuation of your work without losing any progress or context.