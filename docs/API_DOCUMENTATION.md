# Strategic Content Intelligence Platform - API Documentation

## Overview

This API documentation covers all endpoints for the Strategic Content Intelligence Platform, a full-stack application for AI-powered content analysis and strategic brief generation.

**Base URL**: `http://localhost:5000/api`
**Authentication**: Session-based authentication with secure cookies
**Response Format**: All endpoints return JSON with `success` boolean and appropriate `data` or `error` fields

## Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed (400) |
| `NOT_AUTHENTICATED` | User not logged in (401) |
| `ADMIN_REQUIRED` | Admin access required (403) |
| `NOT_FOUND` | Resource not found (404) |
| `RATE_LIMITED` | Too many requests (429) |
| `INTERNAL_ERROR` | Server error (500) |

## Authentication Endpoints (`/api/auth`)

### Register User
```http
POST /api/auth/register
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

### Login User
```http
POST /api/auth/login
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

### Check Authentication Status
```http
GET /api/auth/me
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

### Logout User
```http
POST /api/auth/logout
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

## Signal Management (`/api/signals`)

### Get All Signals
```http
GET /api/signals
```

**Query Parameters**:
- `status` (optional): `capture` | `potential_signal` | `signal` | `validated_signal`
- `hasSource` (optional): `true` | `false`
- `sourceDomain` (optional): Filter by source domain
- `limit` (optional): Number of results (1-100, default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): `created` | `updated` | `status` (default: `created`)
- `sortOrder` (optional): `asc` | `desc` (default: `desc`)

**Response**:
```json
{
  "success": true,
  "data": {
    "signals": [
      {
        "id": 1,
        "title": "Strategic Content Analysis",
        "content": "Content text...",
        "status": "capture",
        "url": "https://example.com",
        "sourceType": "webpage",
        "sourceDomain": "example.com",
        "createdAt": "2025-07-22T21:00:00.000Z",
        "updatedAt": "2025-07-22T21:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

### Create Signal
```http
POST /api/signals
```

**Request Body**:
```json
{
  "title": "Signal Title",
  "content": "Signal content",
  "url": "https://example.com",
  "userNotes": "Optional notes",
  "status": "capture",
  "sourceType": "webpage",
  "sourceUrl": "https://example.com"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "signal": {
      "id": 1,
      "title": "Signal Title",
      "content": "Signal content",
      "status": "capture",
      "createdAt": "2025-07-22T21:00:00.000Z"
    }
  }
}
```

### Get Signal by ID
```http
GET /api/signals/:id
```

**Response**:
```json
{
  "success": true,
  "data": {
    "signal": {
      "id": 1,
      "title": "Signal Title",
      "content": "Signal content",
      "status": "capture"
    }
  }
}
```

### Update Signal
```http
PUT /api/signals/:id
```

**Request Body**:
```json
{
  "title": "Updated Title",
  "status": "potential_signal",
  "promotionReason": "Shows strong strategic potential"
}
```

### Delete Signal
```http
DELETE /api/signals/:id
```

### Create Draft Signal (Chrome Extension)
```http
POST /api/signals/draft
```

**Request Body**:
```json
{
  "title": "Captured Content",
  "content": "Content from webpage",
  "url": "https://example.com",
  "userNotes": "Notes from extension",
  "browserContext": {
    "domain": "example.com",
    "timestamp": "2025-07-22T21:00:00.000Z"
  }
}
```

## Content Analysis (`/api/analyze`)

### Analyze URL
```http
POST /api/analyze
```

**Request Body**:
```json
{
  "url": "https://example.com/article",
  "mode": "deep",
  "lengthPreference": "medium",
  "userNotes": "Analysis context",
  "forceAnalysis": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "signal": {
      "id": 1,
      "title": "Article Title",
      "truthAnalysis": {
        "fact": "Key facts from content",
        "observation": "Strategic observations",
        "insight": "Deep insights",
        "humanTruth": "Human behavioral insights",
        "culturalMoment": "Cultural context"
      },
      "sentiment": "positive",
      "confidence": 0.85
    }
  }
}
```

### Analyze Text Content
```http
POST /api/analyze/text
```

**Request Body**:
```json
{
  "content": "Text to analyze",
  "title": "Content Title",
  "mode": "quick",
  "lengthPreference": "short",
  "author": "Author Name",
  "publishDate": "2025-07-22"
}
```

### Extract Content from URL
```http
POST /api/analyze/extract-url
```

**Request Body**:
```json
{
  "url": "https://example.com/article",
  "includeImages": true,
  "includeVideo": true,
  "maxImages": 5
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "extractedContent": {
      "title": "Article Title",
      "content": "Extracted text content",
      "author": "Author Name",
      "publishDate": "2025-07-22",
      "images": ["https://example.com/image1.jpg"],
      "url": "https://example.com/article"
    }
  }
}
```

### Visual Analysis
```http
POST /api/analyze/visual
```

**Request Body**:
```json
{
  "signalId": 1,
  "imageUrls": ["https://example.com/image.jpg"],
  "analysisType": "brand"
}
```

## User Profile (`/api/user`)

### Get Topic Profile
```http
GET /api/user/topic-profile
```

**Response**:
```json
{
  "success": true,
  "data": {
    "interests": ["technology", "marketing"],
    "industries": ["SaaS", "E-commerce"],
    "preferredSources": ["https://techcrunch.com"],
    "excludeKeywords": ["spam", "clickbait"]
  }
}
```

### Create/Update Topic Profile
```http
POST /api/user/topic-profile
```

**Request Body**:
```json
{
  "interests": ["technology", "AI", "marketing"],
  "industries": ["SaaS", "E-commerce", "FinTech"],
  "preferredSources": ["https://techcrunch.com", "https://producthunt.com"],
  "excludeKeywords": ["spam", "clickbait"]
}
```

## Source Traceability (`/api/traceability`)

### Audit Source Compliance
```http
GET /api/traceability/audit
```

**Response**:
```json
{
  "success": true,
  "data": {
    "audit": {
      "compliant": 45,
      "violations": 5,
      "details": [
        {
          "signalId": 123,
          "title": "Signal Title",
          "violations": ["Signal must reference a source URL"]
        }
      ]
    },
    "compliance_rate": 0.9,
    "total_signals": 50
  }
}
```

## Admin Endpoints (`/api/admin`)

**Note**: All admin endpoints require admin authentication.

### System Health
```http
GET /api/admin/health
```

**Response**:
```json
{
  "success": true,
  "data": {
    "system": {
      "uptime": 3600000,
      "memoryUsage": {
        "rss": 52428800,
        "heapTotal": 29356032,
        "heapUsed": 18874568
      },
      "requestCount": 1250,
      "errorCount": 12,
      "slowRequestCount": 5,
      "averageResponseTime": 245,
      "systemHealth": "healthy",
      "lastErrors": [],
      "slowRequests": []
    },
    "timestamp": "2025-07-22T21:00:00.000Z",
    "version": "1.0.0"
  }
}
```

### Error Analysis
```http
GET /api/admin/errors
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalErrors": 12,
    "errorRate": 0.0096,
    "errorsByPath": {
      "/api/analyze": 8,
      "/api/signals": 4
    },
    "errorsByStatusCode": {
      "400": 7,
      "500": 5
    },
    "recentErrors": [
      {
        "timestamp": "2025-07-22T21:00:00.000Z",
        "method": "POST",
        "path": "/api/analyze",
        "statusCode": 400,
        "error": "Validation failed",
        "duration": 123
      }
    ]
  }
}
```

### Performance Analysis
```http
GET /api/admin/performance
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalRequests": 1250,
    "averageResponseTime": 245,
    "percentile95": 890,
    "percentile99": 1250,
    "slowRequestCount": 5,
    "slowRequestRate": 0.004,
    "recentSlowRequests": []
  }
}
```

### Reset System Monitor
```http
POST /api/admin/monitor/reset
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "System monitor metrics reset successfully",
    "timestamp": "2025-07-22T21:00:00.000Z"
  }
}
```

### Debug Logs
```http
GET /api/admin/debug/logs
```

**Query Parameters**:
- `limit` (optional): Number of logs (default: 50)
- `level` (optional): `info` | `warn` | `error` | `debug`

**Response**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "timestamp": "2025-07-22T21:00:00.000Z",
        "level": "info",
        "message": "Request completed",
        "context": {
          "method": "POST",
          "path": "/api/analyze",
          "duration": 245
        }
      }
    ],
    "count": 50,
    "level": "info",
    "limit": 50
  }
}
```

## Rate Limiting

All endpoints are subject to rate limiting:
- Standard endpoints: 100 requests per minute
- Analysis endpoints: 20 requests per minute
- Admin endpoints: 50 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Time when window resets

## WebSocket Events (Future)

The platform will support real-time updates via WebSocket connections:

- `signal:created` - New signal created
- `signal:updated` - Signal status changed  
- `analysis:complete` - Analysis finished
- `system:alert` - System health alert

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": ["Optional additional details"],
  "timestamp": "2025-07-22T21:00:00.000Z"
}
```

## Security Considerations

1. **Authentication**: Session-based with secure cookies
2. **CORS**: Configured for web client and Chrome extension origins
3. **Input Validation**: Comprehensive Zod validation on all inputs
4. **Rate Limiting**: Protection against abuse and DoS attacks
5. **URL Filtering**: Prevents access to local/internal resources
6. **Content Limits**: Maximum sizes for text inputs and file uploads
7. **Session Management**: Secure session configuration with memory store

## Development Guidelines

1. **Consistent Responses**: All endpoints use standardized success/error format
2. **Error Codes**: Specific codes for different error types enable proper client handling
3. **Logging**: Comprehensive logging with request context and performance metrics
4. **Validation**: All inputs validated with appropriate error messages
5. **Source Traceability**: Every signal must reference a source for compliance
6. **Admin Controls**: Sensitive operations require admin authentication
7. **Performance**: Response times monitored with slow request tracking