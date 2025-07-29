// Chrome Extension Configuration
// Auto-detects the correct API endpoint based on environment

const ExtensionConfig = {
    // Try to determine the correct API base URL
    getApiBase() {
        // For Chrome extensions, we need to manually specify the Replit URL
        // since we can't access window.location from the extension context
        
        // Check if we have stored the URL from a previous session
        const storedUrl = localStorage.getItem('apiBase');
        if (storedUrl) {
            return storedUrl;
        }
        
        // Default Replit patterns - update this with your actual domain
        const replitPatterns = [
            'https://workspace-{username}.replit.dev',
            'https://{workspace-name}.{username}.replit.dev'
        ];
        
        // For now, try common localhost first, then fallback
        return 'http://localhost:5000';
    },
    
    // Set the API base URL (useful for when user provides the correct URL)
    setApiBase(url) {
        localStorage.setItem('apiBase', url);
    },
    
    // Test if an API endpoint is reachable
    async testConnection(baseUrl) {
        try {
            const response = await fetch(`${baseUrl}/api/auth/me`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.status === 200 || response.status === 401; // 401 means server is reachable but not logged in
        } catch (error) {
            return false;
        }
    },
    
    // Auto-discover the correct API URL
    async discoverApiUrl() {
        const urlsToTry = [
            'http://localhost:5000',
            'http://127.0.0.1:5000',
            // Add your Replit URL here when known
        ];
        
        for (const url of urlsToTry) {
            console.log(`Testing connection to: ${url}`);
            if (await this.testConnection(url)) {
                console.log(`Successfully connected to: ${url}`);
                this.setApiBase(url);
                return url;
            }
        }
        
        // If nothing works, return localhost as fallback
        console.warn('No working API endpoint found, using localhost fallback');
        return 'http://localhost:5000';
    }
};

// Make available globally
window.ExtensionConfig = ExtensionConfig;