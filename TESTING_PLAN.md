# Testing Plan - Debug and Error Detection System

## Overview
Comprehensive debugging and error detection system implemented to identify issues during testing phase. This includes real-time logging, performance monitoring, and error tracking across the entire application stack.

## Debug System Components

### 1. Server-Side Debug Logger (`server/services/debug-logger.ts`)
- **Request/Response Logging**: Automatic logging of all API calls with timing
- **Error Tracking**: Comprehensive error capture with stack traces
- **Performance Monitoring**: Response time tracking and slow request detection
- **Database Operations**: Logging of all DB interactions
- **External API Calls**: Monitoring of OpenAI, Google Trends, etc.

### 2. Debug API Endpoints
Available at `/api/debug/*`:
- `GET /api/debug/logs` - Retrieve recent system logs with filtering
- `GET /api/debug/errors` - Error summary and distribution
- `GET /api/debug/performance` - Performance metrics and insights
- `POST /api/debug/clear-logs` - Clear debug logs for maintenance

### 3. Frontend Debug Panel (`client/src/components/debug-panel.tsx`)
- **Real-time Monitoring**: Live view of system activity
- **Error Visualization**: Clear error reporting with stack traces
- **Performance Dashboard**: API response times and bottleneck detection
- **Log Filtering**: Filter by log level (error, warn, info, debug)

## Testing Workflow

### Phase 1: Basic Functionality Testing
1. **Authentication Flow**
   - Test user registration
   - Test user login
   - Test session persistence
   - Monitor debug panel for auth errors

2. **Content Analysis**
   - Test text input analysis
   - Test URL content extraction
   - Test OpenAI API integration
   - Check response times in performance tab

3. **Signal Management**
   - Test signal creation and storage
   - Test signal editing and updates
   - Test signal status progression
   - Monitor database operations

### Phase 2: Error Detection Testing
1. **Intentional Error Testing**
   - Submit invalid content for analysis
   - Test with malformed URLs
   - Test with missing required fields
   - Verify errors appear in debug panel

2. **Load Testing**
   - Submit multiple analysis requests
   - Monitor performance metrics
   - Check for slow requests (>1000ms)
   - Verify system stability

3. **External API Testing**
   - Test OpenAI connectivity issues
   - Test Google Trends API limits
   - Monitor external API call failures
   - Check fallback mechanisms

### Phase 3: Performance Monitoring
1. **Response Time Analysis**
   - Monitor average response times
   - Identify slow endpoints
   - Check P95/P99 percentiles
   - Optimize bottlenecks

2. **Error Pattern Analysis**
   - Review error distribution
   - Identify common failure points
   - Check error frequency by endpoint
   - Monitor user-specific errors

## Key Metrics to Monitor

### Performance Indicators
- **Average Response Time**: Should be <500ms for most requests
- **P95 Response Time**: Should be <1000ms
- **Error Rate**: Should be <5% of total requests
- **OpenAI API Response Time**: Should be <3000ms

### Error Patterns
- **Authentication Errors**: Session timeouts, invalid credentials
- **Content Analysis Errors**: OpenAI API failures, invalid content
- **Database Errors**: Connection issues, constraint violations
- **External API Errors**: Rate limits, service unavailability

### Success Criteria
- ✅ All core functionality working without errors
- ✅ Response times within acceptable ranges
- ✅ Error handling graceful and informative
- ✅ Debug information comprehensive and actionable

## Debug Panel Usage Guide

### Accessing Debug Information
1. **Debug Button**: Fixed bottom-right corner for easy access
2. **Overview Tab**: Quick system health summary
3. **Logs Tab**: Detailed request/response logging
4. **Errors Tab**: Error analysis and distribution
5. **Performance Tab**: Response time metrics and insights

### Interpreting Debug Data
- **Green Indicators**: System performing well
- **Yellow Indicators**: Performance warnings
- **Red Indicators**: Errors requiring attention
- **Log Levels**: Error > Warn > Info > Debug

### Common Issues to Watch For
1. **High Response Times**: >1000ms consistently
2. **Frequent Errors**: Same error repeating
3. **Authentication Issues**: Session management problems
4. **OpenAI Failures**: API key or quota issues
5. **Database Slowness**: Query optimization needed

## Testing Checklist

### Before Testing
- [ ] Verify debug panel is accessible
- [ ] Check all API endpoints are responding
- [ ] Confirm OpenAI API key is working
- [ ] Ensure database connectivity

### During Testing
- [ ] Monitor debug panel continuously
- [ ] Check performance metrics after each test
- [ ] Document any errors encountered
- [ ] Note response time patterns

### After Testing
- [ ] Review error summary
- [ ] Analyze performance bottlenecks
- [ ] Document findings for optimization
- [ ] Clear logs if needed for next test session

## Environment Variables Required
```
# OpenAI Integration
OPENAI_API_KEY=your_openai_api_key

# Database Connection
DATABASE_URL=your_database_url

# Session Management
SESSION_SECRET=your_session_secret
```

## Debug Output Examples

### Successful Request Log
```json
{
  "timestamp": "2025-01-10T22:46:04.123Z",
  "level": "info",
  "message": "Content analysis request received",
  "data": {
    "title": "Test Content",
    "hasUrl": false,
    "contentLength": 150,
    "userId": 1
  },
  "endpoint": "/api/analyze"
}
```

### Error Log Example
```json
{
  "timestamp": "2025-01-10T22:46:05.456Z",
  "level": "error",
  "message": "OpenAI analysis failed",
  "data": {
    "error": "API key not valid"
  },
  "stack": "Error: API key not valid\n    at OpenAIService.analyzeContent...",
  "endpoint": "/api/analyze",
  "userId": 1
}
```

### Performance Metrics
```json
{
  "totalRequests": 25,
  "averageResponseTime": 450,
  "p95ResponseTime": 800,
  "p99ResponseTime": 1200,
  "slowRequests": 2
}
```

This comprehensive debug system provides full visibility into application behavior, enabling rapid identification and resolution of issues during testing and production use.