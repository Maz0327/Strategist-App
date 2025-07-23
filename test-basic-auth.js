// Basic test to verify API functionality without authentication
const http = require('http');

// Test helper to create session
function createTestSession() {
  return new Promise((resolve, reject) => {
    const sessionData = JSON.stringify({
      userId: 1,
      email: 'test@example.com'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/test-session',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': sessionData.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Session test response:', data);
        resolve(res.headers['set-cookie']);
      });
    });

    req.on('error', reject);
    req.write(sessionData);
    req.end();
  });
}

// Test the analyze endpoint
async function testAnalyzeEndpoint() {
  try {
    const testData = JSON.stringify({
      content: 'This is a test content for truth analysis.',
      title: 'Test Analysis',
      mode: 'speed',
      lengthPreference: 'medium'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/analyze',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`\n=== ANALYZE ENDPOINT TEST ===`);
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        console.log(`Response Body:`, data.substring(0, 500));
        
        if (res.headers['content-type']?.includes('application/json')) {
          console.log('✅ Response is JSON - Route working correctly');
        } else {
          console.log('❌ Response is HTML - Route not working correctly');
        }
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err);
    });

    req.write(testData);
    req.end();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run test
setTimeout(testAnalyzeEndpoint, 2000); // Wait for server to fully start