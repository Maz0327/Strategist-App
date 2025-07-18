# Database Migrations

This directory contains database migrations for the strategic content analysis platform.

## Commands

### Push schema changes to database
```bash
npm run db:push
```

### Generate migration files
```bash
npx drizzle-kit generate
```

### Apply migrations
```bash
npx drizzle-kit migrate
```

## Current Schema Status

The database currently contains 14 tables:
- users
- signals
- sources
- signal_sources
- user_feed_sources
- feed_items
- user_topic_profiles
- visual_captures
- chat_sessions
- chat_messages
- user_analytics
- user_feedback
- feature_usage
- system_performance
- ab_test_results
- api_calls
- external_api_calls

All tables are operational and properly indexed.