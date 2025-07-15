# Authentication System Documentation

## Overview

The Strategist App uses a session-based authentication system with support for both email and username login. The system is designed to be user-friendly with case-insensitive username matching.

## Login System

### Supported Login Methods

Users can log in using either:
1. **Email Address**: `admin@strategist.app`
2. **Username**: `admin` (case-insensitive)

### Case-Insensitive Username

The username field accepts any case variation:
- `admin` ✅
- `Admin` ✅
- `ADMIN` ✅
- `aDmIn` ✅

### Default Admin Credentials

For initial setup and testing:
- **Username**: `admin`
- **Password**: `Ma.920707`
- **Email**: `admin@strategist.app`

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Features

1. **Email Uniqueness**: Each email can only be used once
2. **Username Uniqueness**: Each username can only be used once
3. **Case-Insensitive Lookup**: Username matching uses SQL LOWER() function
4. **Password Hashing**: Uses bcrypt with 12 salt rounds
5. **Role-Based Access**: Supports user/admin roles

## Implementation Details

### Authentication Flow

1. User submits login form with email/username and password
2. System validates input using Zod schema
3. Database lookup using `getUserByEmailOrUsername()` method
4. Password verification using bcrypt
5. Session creation with user ID
6. Cookie-based session management

### Database Methods

```typescript
// Get user by email
getUserByEmail(email: string): Promise<User | undefined>

// Get user by username
getUserByUsername(username: string): Promise<User | undefined>

// Get user by email OR username (case-insensitive)
getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined>
```

### Security Features

1. **Rate Limiting**: 5 failed attempts trigger 15-minute lockout
2. **Session Security**: HTTP-only cookies with proper expiration
3. **Password Strength**: Minimum 8 characters required
4. **Input Validation**: Zod schema validation on all inputs
5. **SQL Injection Protection**: Parameterized queries via Drizzle ORM

## Configuration

### Environment Variables

```env
# Session Management
SESSION_SECRET=your_session_secret_here

# Admin Credentials (for initial setup)
# Login: admin@strategist.app / Ma.920707 (or username: admin / Ma.920707)
```

### Session Configuration

- **Cookie Name**: `connect.sid`
- **Max Age**: 24 hours
- **Secure**: Auto-detected based on environment
- **HTTP Only**: true
- **Same Site**: lax

## Frontend Integration

### Login Form

The login form accepts both email and username in the same input field:

```typescript
// Form field label
<Label htmlFor="login-email">Email or Username</Label>

// Input placeholder
<Input
  placeholder="Enter your email or username"
  type="text"
/>
```

### Validation Schema

```typescript
export const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(8),
});
```

## Testing

### Test Cases

1. **Email Login**: `admin@strategist.app` + `Ma.920707` ✅
2. **Username Login**: `admin` + `Ma.920707` ✅
3. **Case Variations**: `ADMIN`, `Admin`, `aDmIn` + `Ma.920707` ✅
4. **Invalid Credentials**: Should show error message ✅
5. **Rate Limiting**: Multiple failures trigger lockout ✅

### API Endpoints

```bash
# Login
POST /api/auth/login
Content-Type: application/json
{
  "email": "admin",
  "password": "Ma.920707"
}

# Check authentication status
GET /api/auth/me

# Logout
POST /api/auth/logout
```

## Troubleshooting

### Common Issues

1. **Case Sensitivity**: Username is case-insensitive, but ensure database stores lowercase
2. **Session Persistence**: Check SESSION_SECRET is set in environment
3. **Rate Limiting**: Wait 15 minutes after 5 failed attempts
4. **Database Connection**: Verify DATABASE_URL is correctly configured

### Debug Commands

```bash
# Check user in database
SELECT id, email, username, role FROM users WHERE email = 'admin@strategist.app';

# Test login via curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin", "password": "Ma.920707"}'
```

## Migration Notes

If updating from email-only to email/username system:

1. Add username column to users table
2. Update authentication service to use `getUserByEmailOrUsername`
3. Update frontend form to accept both formats
4. Update login schema to remove email validation
5. Test all case variations
6. Update documentation and environment templates

## Security Considerations

1. **Username Enumeration**: System returns generic error for failed logins
2. **Brute Force Protection**: Rate limiting prevents automated attacks
3. **Session Hijacking**: HTTP-only cookies prevent XSS access
4. **Password Storage**: Never store plain text passwords
5. **Input Sanitization**: All inputs validated before database queries