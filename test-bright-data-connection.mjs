import puppeteer from 'puppeteer-core';

async function testBrightDataConnection() {
  console.log('🔍 Testing Bright Data browser connection...');
  
  const username = process.env.BRIGHT_DATA_USERNAME;
  const password = process.env.BRIGHT_DATA_PASSWORD;
  
  console.log('Username:', username ? 'Present' : 'Missing');
  console.log('Password:', password ? 'Present' : 'Missing');
  
  if (!username || !password) {
    console.log('❌ Credentials missing');
    return;
  }
  
  const browserEndpoint = `wss://${username}:${password}@brd.superproxy.io:9222`;
  console.log('Browser endpoint format check:', browserEndpoint.startsWith('wss://') ? 'Valid' : 'Invalid');
  
  try {
    console.log('🔗 Attempting connection...');
    const browser = await puppeteer.connect({
      browserWSEndpoint: browserEndpoint,
      defaultViewport: null
    });
    
    console.log('✅ Browser connected!');
    
    const page = await browser.newPage();
    console.log('📄 New page created');
    
    await page.goto('https://httpbin.org/ip', { 
      waitUntil: 'networkidle2', 
      timeout: 10000 
    });
    console.log('✅ Page loaded successfully');
    
    await page.close();
    await browser.disconnect();
    console.log('✅ Connection test successful');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
}

testBrightDataConnection();
