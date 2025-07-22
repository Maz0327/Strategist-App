// Quick Bright Data connectivity test
const http = require('http');

// Test Bright Data proxy with your credentials
const options = {
  hostname: 'brd.superproxy.io',
  port: 9515,
  path: 'http://httpbin.org/ip',
  method: 'GET',
  headers: {
    'Proxy-Authorization': 'Basic ' + Buffer.from(process.env.BRIGHT_DATA_USERNAME + ':' + process.env.BRIGHT_DATA_PASSWORD).toString('base64'),
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
};

console.log('🧪 Testing Bright Data proxy connection...');
console.log('Username configured:', !!process.env.BRIGHT_DATA_USERNAME);
console.log('Password configured:', !!process.env.BRIGHT_DATA_PASSWORD);

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Bright Data SUCCESS!');
      console.log('Residential IP:', result.origin);
      console.log('This IP will bypass YouTube blocking!');
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Bright Data connection failed:', error.message);
});

req.setTimeout(10000, () => {
  console.log('⏰ Connection timeout - proxy not responding');
  req.destroy();
});

req.end();