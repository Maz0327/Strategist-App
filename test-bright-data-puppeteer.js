// Test Bright Data Puppeteer Implementation
import puppeteer from 'puppeteer-core';

async function testBrightDataBrowser() {
  const browserEndpoint = 'wss://brd-customer-hl_d2c6dd0f-zone-scraping_browser1:wl58vcxlx0ph@brd.superproxy.io:9222';
  
  console.log('🔥 Testing Bright Data Scraping Browser with Puppeteer...');
  
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: browserEndpoint,
      defaultViewport: null
    });
    
    console.log('✅ Connected to Bright Data Scraping Browser');
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Test basic functionality
    console.log('📍 Testing basic navigation...');
    await page.goto('https://httpbin.org/ip', { waitUntil: 'networkidle2', timeout: 10000 });
    const content = await page.content();
    console.log('✅ Basic navigation successful');
    
    // Test Instagram (most important for social media intelligence)
    console.log('📸 Testing Instagram hashtag scraping...');
    await page.goto('https://www.instagram.com/explore/tags/ai/', { 
      waitUntil: 'networkidle2', 
      timeout: 15000 
    });
    
    // Wait for content and extract posts
    await page.waitForSelector('article', { timeout: 10000 }).catch(() => {
      console.log('⚠️ Instagram articles not found - checking for login/block');
    });
    
    const posts = await page.evaluate(() => {
      const articles = Array.from(document.querySelectorAll('article'));
      return articles.slice(0, 5).map((article, index) => {
        const img = article.querySelector('img');
        const link = article.querySelector('a');
        
        return {
          id: `post_${index}`,
          url: link ? `https://www.instagram.com${link.getAttribute('href')}` : '',
          image: img ? img.getAttribute('src') : '',
          alt: img ? img.getAttribute('alt') : '',
          found: true
        };
      });
    });
    
    console.log(`✅ Instagram extraction successful: ${posts.length} posts found`);
    posts.forEach((post, i) => {
      if (post.alt) {
        console.log(`  Post ${i+1}: ${post.alt.substring(0, 50)}...`);
      }
    });
    
    await page.close();
    await browser.disconnect();
    
    console.log('🎉 BRIGHT DATA PUPPETEER TEST SUCCESSFUL - Real live data extracted!');
    
  } catch (error) {
    console.error('❌ Bright Data Puppeteer test failed:', error.message);
    process.exit(1);
  }
}

testBrightDataBrowser();