import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');

// Test API endpoint directly to verify routing
function testApiRoute() {
  const testData = JSON.stringify({
    content: 'Test content for analysis',
    title: 'Test Title',
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

  console.log('Testing /api/analyze endpoint...');
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('\n=== API TEST RESULTS ===');
      console.log(`Status: ${res.statusCode}`);
      console.log(`Content-Type: ${res.headers['content-type']}`);
      console.log(`Response Length: ${data.length}`);
      
      if (res.headers['content-type']?.includes('application/json')) {
        console.log('✅ SUCCESS: API returning JSON');
        try {
          const parsed = JSON.parse(data);
          console.log('Response:', parsed);
        } catch (e) {
          console.log('⚠️  Warning: Invalid JSON response');
        }
      } else {
        console.log('❌ FAILURE: API returning HTML instead of JSON');
        console.log('First 200 chars:', data.substring(0, 200));
      }
    });
  });

  req.on('error', (err) => {
    console.error('Request error:', err.message);
  });

  req.write(testData);
  req.end();
}

// Wait for server to restart, then test
setTimeout(testApiRoute, 3000);