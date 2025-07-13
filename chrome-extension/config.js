// Configuration for different environments
const CONFIG = {
  development: {
    backendUrl: 'http://localhost:5000',
    apiPrefix: '/api'
  },
  production: {
    backendUrl: 'https://your-app-name.replit.app', // Replace with your actual Replit app URL
    apiPrefix: '/api'
  }
};

// Auto-detect environment based on current context
const getConfig = () => {
  const hostname = window.location?.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return CONFIG.development;
  }
  return CONFIG.production;
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, getConfig };
}