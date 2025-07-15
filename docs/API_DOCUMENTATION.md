# 🔌 API Documentation - Strategist App

## Overview
This documentation covers all API endpoints available in the Strategist Content Analysis Platform.

**Base URL**: `http://localhost:5000/api` (development) | `https://your-app.replit.app/api` (production)

---

## 🔐 Authentication Endpoints

### POST `/auth/login`
**Description**: Authenticate user with email/username and password

**Request Body**:
```json
{
  "emailOrUsername": "admin@strategist.app",
  "password": "Ma.920707"
}
```

**Response** (200):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "admin@strategist.app"
  }
}
```

**Error Responses**:
- `401`: Invalid credentials
- `429`: Rate limit exceeded
- `500`: Server error

### POST `/auth/register`
**Description**: Register new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "newuser",
  "password": "securepassword123"
}
```

**Response** (201):
```json
{
  "success": true,
  "user": {
    "id": 2,
    "email": "user@example.com"
  }
}
```

### GET `/auth/me`
**Description**: Get current authenticated user

**Response** (200):
```json
{
  "user": {
    "id": 1,
    "email": "admin@strategist.app"
  }
}
```

### POST `/auth/logout`
**Description**: Logout current user

**Response** (200):
```json
{
  "success": true
}
```

---

## 📊 Signals Endpoints

### GET `/signals`
**Description**: Get all signals for authenticated user

**Query Parameters**:
- `status` (optional): Filter by signal status (`capture`, `potential_signal`, `signal`)
- `limit` (optional): Number of results (default: 50)

**Response** (200):
```json
{
  "signals": [
    {
      "id": 1,
      "title": "AI Trends in 2025",
      "content": "Analysis of emerging AI trends...",
      "status": "signal",
      "sentiment": "positive",
      "keywords": ["AI", "trends", "2025"],
      "createdAt": "2025-07-15T22:00:00Z"
    }
  ]
}
```

### POST `/signals`
**Description**: Create new signal

**Request Body**:
```json
{
  "title": "New Signal Title",
  "content": "Signal content here...",
  "url": "https://example.com/source"
}
```

**Response** (201):
```json
{
  "signal": {
    "id": 2,
    "title": "New Signal Title",
    "content": "Signal content here...",
    "status": "capture",
    "createdAt": "2025-07-15T22:00:00Z"
  }
}
```

### POST `/signals/analyze`
**Description**: Analyze content with AI

**Rate Limits**:
- 20 requests per minute
- 500 requests per day

**Request Body**:
```json
{
  "title": "Article Title",
  "content": "Article content to analyze...",
  "url": "https://example.com/article"
}
```

**Response** (200):
```json
{
  "analysis": {
    "summary": "Brief summary of the content...",
    "sentiment": "positive",
    "tone": "professional",
    "keywords": ["keyword1", "keyword2"],
    "tags": ["tag1", "tag2"],
    "confidence": "high",
    "truthFact": "Key fact from the content",
    "humanTruth": "Human insight derived",
    "culturalMoment": "Cultural context",
    "attentionValue": "High potential for engagement"
  }
}
```

### PUT `/signals/:id`
**Description**: Update existing signal

**Request Body**:
```json
{
  "status": "signal",
  "userNotes": "This is now a confirmed signal",
  "promotionReason": "Strong engagement potential"
}
```

### DELETE `/signals/:id`
**Description**: Delete signal

**Response** (204): No content

---

## 🌐 External Data Endpoints

### GET `/external/trending`
**Description**: Get trending topics from multiple platforms

**Query Parameters**:
- `platform` (optional): Filter by platform (`google`, `reddit`, `youtube`, `spotify`)
- `limit` (optional): Number of results per platform

**Response** (200):
```json
{
  "trending": {
    "google": [
      {
        "query": "AI trends 2025",
        "interest": 85,
        "related": ["artificial intelligence", "machine learning"]
      }
    ],
    "reddit": [
      {
        "subreddit": "technology",
        "title": "New AI breakthrough",
        "upvotes": 1234,
        "comments": 567
      }
    ],
    "youtube": [
      {
        "title": "AI in 2025",
        "views": 100000,
        "channel": "Tech Channel"
      }
    ]
  }
}
```

### GET `/external/news`
**Description**: Get latest news from multiple sources

**Query Parameters**:
- `source` (optional): Filter by source (`newsapi`, `gnews`, `currents`)
- `category` (optional): Filter by category
- `limit` (optional): Number of results

**Response** (200):
```json
{
  "news": [
    {
      "title": "Breaking Tech News",
      "description": "Latest developments in technology...",
      "url": "https://example.com/news",
      "source": "TechNews",
      "publishedAt": "2025-07-15T22:00:00Z",
      "category": "technology"
    }
  ]
}
```

---

## 📈 Analytics Endpoints

### GET `/analytics/user-stats`
**Description**: Get user signal statistics

**Response** (200):
```json
{
  "stats": {
    "total": 150,
    "captures": 100,
    "potentialSignals": 35,
    "signals": 15,
    "thisWeek": 25,
    "growthRate": 12.5
  }
}
```

### GET `/analytics/performance`
**Description**: Get system performance metrics

**Response** (200):
```json
{
  "performance": {
    "averageResponseTime": 245,
    "cacheHitRate": 0.78,
    "apiCallsToday": 1234,
    "errorRate": 0.02,
    "uptime": 99.95
  }
}
```

---

## 💬 Chat Endpoints

### POST `/chat/session`
**Description**: Create new chat session

**Request Body**:
```json
{
  "type": "signal_analysis",
  "context": {
    "signalId": 123
  }
}
```

**Response** (201):
```json
{
  "session": {
    "id": 1,
    "sessionId": "chat-uuid-123",
    "type": "signal_analysis",
    "createdAt": "2025-07-15T22:00:00Z"
  }
}
```

### POST `/chat/message`
**Description**: Send message in chat session

**Request Body**:
```json
{
  "sessionId": "chat-uuid-123",
  "content": "Can you analyze this signal?",
  "role": "user"
}
```

**Response** (200):
```json
{
  "message": {
    "id": 1,
    "content": "I'll analyze this signal for you...",
    "role": "assistant",
    "createdAt": "2025-07-15T22:00:00Z"
  }
}
```

### GET `/chat/messages/:sessionId`
**Description**: Get chat history

**Response** (200):
```json
{
  "messages": [
    {
      "id": 1,
      "content": "Hello, how can I help?",
      "role": "assistant",
      "createdAt": "2025-07-15T22:00:00Z"
    }
  ]
}
```

---

## 🏥 System Endpoints

### GET `/health`
**Description**: System health check

**Response** (200):
```json
{
  "status": "healthy",
  "timestamp": "2025-07-15T22:00:00Z",
  "uptime": 3600.5,
  "memory": {
    "rss": 201928704,
    "heapTotal": 79585280,
    "heapUsed": 65432108
  },
  "services": {
    "openai": true,
    "reddit": true,
    "youtube": true,
    "news": true,
    "spotify": true
  }
}
```

### GET `/debug/logs`
**Description**: Get recent system logs (admin only)

**Response** (200):
```json
{
  "logs": [
    {
      "level": "info",
      "message": "User authenticated",
      "timestamp": "2025-07-15T22:00:00Z",
      "userId": 1
    }
  ]
}
```

### GET `/debug/performance`
**Description**: Get detailed performance metrics

**Response** (200):
```json
{
  "metrics": {
    "cache": {
      "hits": 1234,
      "misses": 456,
      "hitRate": 0.73
    },
    "database": {
      "queries": 5678,
      "averageTime": 125,
      "slowQueries": 12
    },
    "apis": {
      "openai": {
        "calls": 234,
        "avgTime": 1500,
        "errors": 2
      }
    }
  }
}
```

---

## 🚨 Error Handling

### Standard Error Response Format
```json
{
  "error": true,
  "message": "Descriptive error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-07-15T22:00:00Z",
  "path": "/api/endpoint",
  "method": "POST"
}
```

### Common Error Codes
- `INVALID_CREDENTIALS`: Authentication failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error
- `UNAUTHORIZED`: Access denied

---

## 📝 Rate Limiting

### Limits by Endpoint Type
- **OpenAI Analysis**: 20 requests/minute, 500 requests/day
- **General API**: 200 requests/minute
- **Authentication**: 5 requests/minute

### Rate Limit Headers
```
RateLimit-Limit: 20
RateLimit-Remaining: 19
RateLimit-Reset: 1642694400
```

---

## 🔒 Security

### Authentication
- Session-based authentication with secure cookies
- CSRF protection enabled
- Rate limiting on all endpoints

### API Keys
- All external API keys managed via environment variables
- No API keys exposed in client-side code

### Data Protection
- Input validation with Zod schemas
- SQL injection protection via parameterized queries
- XSS protection with proper sanitization

---

## 📚 Usage Examples

### JavaScript/TypeScript Example
```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    emailOrUsername: 'admin@strategist.app',
    password: 'Ma.920707'
  })
});

// Analyze content
const analysisResponse = await fetch('/api/signals/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'AI Trends 2025',
    content: 'Detailed analysis of AI trends...',
    url: 'https://example.com/ai-trends'
  })
});
```

### cURL Examples
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"admin@strategist.app","password":"Ma.920707"}'

# Get health status
curl http://localhost:5000/api/health

# Analyze content
curl -X POST http://localhost:5000/api/signals/analyze \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content","url":"https://example.com"}'
```

---

## 🔄 Changelog

### Version 1.0 (Current)
- Initial API implementation
- Authentication system
- Signal management
- External data integration
- Chat system
- Health monitoring
- Performance analytics

---

**Last Updated**: July 15, 2025  
**API Version**: 1.0  
**Documentation Version**: 1.0