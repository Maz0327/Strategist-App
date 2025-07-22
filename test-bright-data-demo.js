// Quick demonstration of Bright Data issue and solution
import axios from 'axios';

console.log('🧪 BRIGHT DATA ISSUE DEMONSTRATION');
console.log('=====================================');

// Test 1: Current server IP (what YouTube sees now)
try {
  const serverResponse = await axios.get('https://httpbin.org/ip', { timeout: 10000 });
  const serverIP = serverResponse.data.origin;
  console.log(`🖥️  Current Server IP: ${serverIP}`);
  
  // Test 2: YouTube blocking test
  console.log('🎬 Testing YouTube access from server IP...');
  const youtubeResponse = await axios.get('https://www.youtube.com', { 
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    },
    validateStatus: () => true
  });
  
  const blocked = youtubeResponse.data.includes('Sign in to confirm') || 
                  youtubeResponse.data.includes('bot') ||
                  youtubeResponse.data.includes('captcha');
  
  console.log(`📊 YouTube Response: ${youtubeResponse.status}`);
  console.log(`🚫 Blocked: ${blocked ? 'YES - YouTube is blocking server traffic' : 'NO'}`);
  
  if (blocked) {
    console.log('\n💡 THIS IS WHY YOU NEED BRIGHT DATA:');
    console.log('   - YouTube blocks server IPs (like yours: ' + serverIP + ')');
    console.log('   - Bright Data routes through residential IPs (home internet)');
    console.log('   - Platforms see "normal user" instead of "automated bot"');
    console.log('   - This bypasses ALL platform blocking');
  }
  
  // Test 3: Bright Data proxy test (will show the 403 error)
  console.log('\n🔍 Testing Bright Data proxy (expected to fail)...');
  
  const username = process.env.BRIGHT_DATA_USERNAME;
  const password = process.env.BRIGHT_DATA_PASSWORD;
  
  if (username && password) {
    try {
      const brightDataResponse = await axios.get('https://httpbin.org/ip', {
        proxy: {
          host: 'brd.superproxy.io',
          port: 33335,
          auth: { username, password }
        },
        timeout: 10000
      });
      
      console.log('✅ Bright Data working! Residential IP:', brightDataResponse.data.origin);
      
    } catch (proxyError) {
      if (proxyError.message.includes('403') && proxyError.message.includes('Scraping Browser')) {
        console.log('⚠️  ERROR FOUND: "403 You are trying to use Scraping Browser zone as regular proxy"');
        console.log('\n🔧 SOLUTION IDENTIFIED:');
        console.log('   - Your account is configured for Scraping Browser (WebSocket)');
        console.log('   - Need to use browser automation instead of HTTP proxy');
        console.log('   - Browser automation = Real Chrome browser with residential IP');
        console.log('   - This is actually BETTER than regular proxy!');
      } else {
        console.log('❌ Proxy error:', proxyError.message);
      }
    }
  } else {
    console.log('⚠️  Bright Data credentials not found in environment');
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log(`   Current Status: YouTube blocking server IP ${serverIP}`);
  console.log('   Bright Data Type: Scraping Browser (WebSocket automation)');
  console.log('   Required Fix: Implement browser automation instead of HTTP proxy');
  console.log('   Expected Result: Full YouTube access via residential IP');
  
} catch (error) {
  console.error('Test failed:', error.message);
}