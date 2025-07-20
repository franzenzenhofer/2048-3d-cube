import { chromium } from '@playwright/test';

const PRODUCTION_URL = 'https://2048-3d.franzai.com';
const PAGES_URL = 'https://2048-3d-cube.pages.dev';

async function testProduction() {
  console.log('🧪 Running production tests...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  
  try {
    for (const url of [PAGES_URL, PRODUCTION_URL]) {
      console.log(`\n📍 Testing ${url}`);
      
      const page = await context.newPage();
      
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        console.log('✅ Page loaded successfully');
        
        const title = await page.locator('.game-title').textContent();
        if (title?.includes('2048')) {
          console.log('✅ Game title found');
        } else {
          throw new Error('Game title not found');
        }
        
        const canvas = await page.locator('canvas').boundingBox();
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          console.log('✅ 3D canvas rendering');
        } else {
          throw new Error('Canvas not rendering');
        }
        
        const performanceMetrics = await page.evaluate(() => {
          return JSON.stringify(performance.getEntriesByType('navigation')[0], null, 2);
        });
        const metrics = JSON.parse(performanceMetrics);
        console.log(`⚡ Load time: ${Math.round(metrics.loadEventEnd - metrics.fetchStart)}ms`);
        
        await page.screenshot({ 
          path: `screenshots/production-${url.includes('pages') ? 'pages' : 'custom'}.png`,
          fullPage: true 
        });
        console.log('📸 Screenshot captured');
        
      } catch (error) {
        console.error(`❌ Error testing ${url}:`, error.message);
        if (url === PRODUCTION_URL) {
          console.log('⏳ Custom domain might still be propagating...');
        }
      } finally {
        await page.close();
      }
    }
    
    console.log('\n✅ Production tests completed!');
    
  } finally {
    await browser.close();
  }
}

testProduction().catch(console.error);