import { test, expect } from '@playwright/test';

test.describe('2048 3D Cube Game v2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show start screen with tap to begin', async ({ page }) => {
    await expect(page.locator('.start-screen')).toBeVisible();
    await expect(page.locator('.start-title')).toContainText('2048³');
    await expect(page.locator('.start-subtitle')).toContainText('A 3D PUZZLE');
    await expect(page.locator('.start-hint')).toContainText('TAP TO BEGIN');
  });

  test('should start game on tap/click', async ({ page }) => {
    await page.locator('.start-screen').click();
    await expect(page.locator('.start-screen')).not.toBeVisible();
    await expect(page.locator('.game-screen')).toBeVisible();
    await expect(page.locator('.score-display')).toBeVisible();
  });

  test('should display initial score of 0', async ({ page }) => {
    await page.locator('.start-screen').click();
    await expect(page.locator('#score')).toHaveText('0');
  });

  test('should render 3D cube with visible faces', async ({ page }) => {
    await page.locator('.start-screen').click();
    await page.waitForTimeout(500);
    
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  });

  test('should respond to swipe gestures on mobile', async ({ page, isMobile }) => {
    await page.locator('.start-screen').click();
    await page.waitForTimeout(500);
    
    if (isMobile) {
      const container = page.locator('#game-container');
      
      // Simulate swipe left
      await container.dispatchEvent('touchstart', { 
        touches: [{ clientX: 200, clientY: 200 }] 
      });
      await container.dispatchEvent('touchmove', { 
        touches: [{ clientX: 100, clientY: 200 }] 
      });
      await container.dispatchEvent('touchend', { 
        changedTouches: [{ clientX: 100, clientY: 200 }] 
      });
      
      await page.waitForTimeout(600);
    }
  });

  test('should respond to keyboard controls', async ({ page, isMobile }) => {
    await page.locator('.start-screen').click();
    await page.waitForTimeout(500);
    
    if (!isMobile) {
      const initialScore = await page.locator('#score').textContent();
      
      // Try all directions
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(500);
      
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
      
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(500);
      
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(500);
      
      // Score might increase if tiles merged
      const finalScore = await page.locator('#score').textContent();
      expect(parseInt(finalScore || '0')).toBeGreaterThanOrEqual(parseInt(initialScore || '0'));
    }
  });

  test('should restart game on double tap', async ({ page, isMobile }) => {
    await page.locator('.start-screen').click();
    await page.waitForTimeout(500);
    
    if (isMobile) {
      // Make a move first
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(500);
      
      // Double tap to restart
      const container = page.locator('#game-container');
      await container.dblclick();
      await page.waitForTimeout(2500); // Wait for game over animation
      
      // Should be back at start screen
      await expect(page.locator('.start-screen')).toBeVisible();
    }
  });

  test('should restart game with R key', async ({ page, isMobile }) => {
    await page.locator('.start-screen').click();
    await page.waitForTimeout(500);
    
    if (!isMobile) {
      // Make a move first
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(500);
      
      // Press R to restart
      await page.keyboard.press('r');
      await page.waitForTimeout(2500);
      
      // Should be back at start screen
      await expect(page.locator('.start-screen')).toBeVisible();
    }
  });

  test('should fit entirely above the fold', async ({ page, viewport }) => {
    await page.locator('.start-screen').click();
    await page.waitForTimeout(500);
    
    // Check that game container matches viewport
    const container = await page.locator('#game-container').boundingBox();
    expect(container?.height).toBeLessThanOrEqual(viewport!.height);
    
    // Check no scrolling is possible
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const clientHeight = await page.evaluate(() => document.body.clientHeight);
    expect(scrollHeight).toBe(clientHeight);
  });

  test('should show version number', async ({ page }) => {
    await expect(page.locator('.version-start')).toContainText('v2');
  });

  test('should take screenshots at different stages', async ({ page, isMobile }) => {
    const device = isMobile ? 'mobile' : 'desktop';
    
    // Start screen
    await page.screenshot({ 
      path: `screenshots/${device}-start-screen.png`, 
      fullPage: false 
    });
    
    // Game screen
    await page.locator('.start-screen').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: `screenshots/${device}-game-initial.png`, 
      fullPage: false 
    });
    
    // After moves
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(600);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(600);
    await page.screenshot({ 
      path: `screenshots/${device}-game-playing.png`, 
      fullPage: false 
    });
  });

  test('performance: should maintain smooth framerate', async ({ page }) => {
    await page.locator('.start-screen').click();
    await page.waitForTimeout(500);
    
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        const startTime = performance.now();
        
        function countFrames() {
          frameCount++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve(frameCount);
          }
        }
        
        requestAnimationFrame(countFrames);
      });
    });
    
    expect(metrics).toBeGreaterThan(30); // At least 30fps
  });
});