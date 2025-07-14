// User-friendly error messages for the entire system

export interface ErrorMessage {
  title: string;
  message: string;
  solution?: string;
  code?: string;
}

export const ERROR_MESSAGES = {
  // Authentication Errors
  INVALID_EMAIL: {
    title: "Invalid Email",
    message: "Please enter a valid email address.",
    solution: "Check your email format (example: user@domain.com)",
    code: "AUTH_001"
  },
  
  WEAK_PASSWORD: {
    title: "Password Too Weak",
    message: "Your password doesn't meet security requirements.",
    solution: "Use at least 8 characters with uppercase, lowercase, number, and special character (!@#$%^&*)",
    code: "AUTH_002"
  },
  
  PASSWORD_MISMATCH: {
    title: "Passwords Don't Match",
    message: "The passwords you entered don't match.",
    solution: "Make sure both password fields contain exactly the same text",
    code: "AUTH_003"
  },
  
  EMAIL_ALREADY_EXISTS: {
    title: "Account Already Exists",
    message: "An account with this email already exists.",
    solution: "Try logging in instead, or use a different email address",
    code: "AUTH_004"
  },
  
  INVALID_CREDENTIALS: {
    title: "Login Failed",
    message: "The email or password you entered is incorrect.",
    solution: "Check your email and password, or register for a new account",
    code: "AUTH_005"
  },
  
  NOT_AUTHENTICATED: {
    title: "Please Log In",
    message: "You need to be logged in to access this feature.",
    solution: "Sign in to your account or create a new one",
    code: "AUTH_006"
  },
  
  NOT_AUTHORIZED: {
    title: "Access Denied",
    message: "You don't have permission to access this feature.",
    solution: "Contact an administrator if you believe this is a mistake",
    code: "AUTH_007"
  },
  
  // Content Analysis Errors
  CONTENT_TOO_SHORT: {
    title: "Content Too Short",
    message: "The content you entered is too short to analyze.",
    solution: "Please provide at least 10 characters of meaningful content",
    code: "CONTENT_001"
  },
  
  CONTENT_TOO_LONG: {
    title: "Content Too Long",
    message: "The content exceeds our processing limits.",
    solution: "Try breaking your content into smaller sections and analyze them separately",
    code: "CONTENT_002"
  },
  
  INVALID_URL: {
    title: "Invalid Web Address",
    message: "The URL you entered is not valid or accessible.",
    solution: "Check that the URL starts with http:// or https:// and is accessible",
    code: "CONTENT_003"
  },
  
  URL_FETCH_FAILED: {
    title: "Cannot Access Website",
    message: "We couldn't retrieve content from the website you provided.",
    solution: "Make sure the website is accessible and try again in a moment",
    code: "CONTENT_004"
  },
  
  ANALYSIS_FAILED: {
    title: "Analysis Failed",
    message: "We encountered an error while analyzing your content.",
    solution: "Please try again in a moment. If the problem persists, contact support",
    code: "CONTENT_005"
  },
  
  // API Errors
  OPENAI_API_ERROR: {
    title: "AI Service Unavailable",
    message: "Our AI analysis service is temporarily unavailable.",
    solution: "Please try again in a few minutes",
    code: "API_001"
  },
  
  RATE_LIMIT_EXCEEDED: {
    title: "Too Many Requests",
    message: "You've made too many requests in a short time.",
    solution: "Please wait a moment before trying again",
    code: "API_002"
  },
  
  EXTERNAL_API_ERROR: {
    title: "External Service Error",
    message: "One of our data sources is temporarily unavailable.",
    solution: "Some features may be limited. Please try again later",
    code: "API_003"
  },
  
  // Database Errors
  DATABASE_ERROR: {
    title: "Database Error",
    message: "We're having trouble saving your data.",
    solution: "Please try again in a moment. Your work may not be saved",
    code: "DB_001"
  },
  
  RECORD_NOT_FOUND: {
    title: "Item Not Found",
    message: "The item you're looking for doesn't exist or has been removed.",
    solution: "Check that you're using the correct link or refresh the page",
    code: "DB_002"
  },
  
  // Network Errors
  NETWORK_ERROR: {
    title: "Connection Problem",
    message: "We're having trouble connecting to our servers.",
    solution: "Check your internet connection and try again",
    code: "NET_001"
  },
  
  TIMEOUT_ERROR: {
    title: "Request Timeout",
    message: "The request took too long to complete.",
    solution: "Please try again. If using large content, consider breaking it into smaller pieces",
    code: "NET_002"
  },
  
  // Validation Errors
  REQUIRED_FIELD: {
    title: "Required Field Missing",
    message: "Please fill in all required fields.",
    solution: "Look for fields marked with * and make sure they're completed",
    code: "VAL_001"
  },
  
  INVALID_INPUT: {
    title: "Invalid Input",
    message: "The information you entered is not in the correct format.",
    solution: "Please check your input and try again",
    code: "VAL_002"
  },
  
  // Admin Errors
  ADMIN_REGISTRATION_FAILED: {
    title: "Admin Registration Failed",
    message: "We couldn't create your admin account.",
    solution: "Check that all fields are filled correctly and try again",
    code: "ADMIN_001"
  },
  
  ADMIN_ACCESS_DENIED: {
    title: "Admin Access Required",
    message: "You need admin privileges to access this feature.",
    solution: "Contact a system administrator for access",
    code: "ADMIN_002"
  },
  
  // Generic Errors
  UNKNOWN_ERROR: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred.",
    solution: "Please try again. If the problem continues, contact support",
    code: "GEN_001"
  }
};

// Helper function to get error message by code
export function getErrorMessage(code: string): ErrorMessage {
  const error = Object.values(ERROR_MESSAGES).find(msg => msg.code === code);
  return error || ERROR_MESSAGES.UNKNOWN_ERROR;
}

// Helper function to create error message from validation errors
export function createValidationErrorMessage(errors: Array<{ field: string; message: string }>): ErrorMessage {
  const fieldErrors = errors.map(err => `${err.field}: ${err.message}`).join(", ");
  
  return {
    title: "Please Fix These Issues",
    message: fieldErrors,
    solution: "Correct the highlighted fields and try again",
    code: "VAL_003"
  };
}

// Helper function to match common error patterns
export function matchErrorPattern(errorMessage: string): ErrorMessage {
  const message = errorMessage.toLowerCase();
  
  if (message.includes("email") && message.includes("already")) {
    return ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
  }
  
  if (message.includes("password") && message.includes("match")) {
    return ERROR_MESSAGES.PASSWORD_MISMATCH;
  }
  
  if (message.includes("password") && (message.includes("weak") || message.includes("requirements"))) {
    return ERROR_MESSAGES.WEAK_PASSWORD;
  }
  
  if (message.includes("credentials") || message.includes("login")) {
    return ERROR_MESSAGES.INVALID_CREDENTIALS;
  }
  
  if (message.includes("authenticated") || message.includes("login")) {
    return ERROR_MESSAGES.NOT_AUTHENTICATED;
  }
  
  if (message.includes("authorized") || message.includes("permission")) {
    return ERROR_MESSAGES.NOT_AUTHORIZED;
  }
  
  if (message.includes("url") || message.includes("website")) {
    return ERROR_MESSAGES.INVALID_URL;
  }
  
  if (message.includes("network") || message.includes("connection")) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  if (message.includes("timeout")) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }
  
  if (message.includes("rate limit")) {
    return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}