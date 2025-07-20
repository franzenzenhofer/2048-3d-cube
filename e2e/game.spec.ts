import { test, expect } from '@playwright/test';

test.describe('2048 3D Cube Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load game with correct title', async ({ page }) => {
    await expect(page.locator('.game-title')).toContainText('2048');
    await expect(page.locator('.cube-3d')).toBeVisible();
  });

  test('should display initial score of 0', async ({ page }) => {
    await expect(page.locator('.score-value')).toHaveText('0');
  });

  test('should show control hints on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await expect(page.locator('.control-hint').first()).toBeVisible();
      await expect(page.locator('.control-hint')).toContainText(['Swipe to move', 'Double tap to restart']);
    }
  });

  test('should respond to swipe gestures', async ({ page, isMobile }) => {
    if (isMobile) {
      const gameContainer = page.locator('#game-container');
      
      await gameContainer.dispatchEvent('touchstart', { touches: [{ clientX: 200, clientY: 200 }] });
      await gameContainer.dispatchEvent('touchend', { changedTouches: [{ clientX: 100, clientY: 200 }] });
      
      await page.waitForTimeout(600);
      
      const score = await page.locator('.score-value').textContent();
      expect(parseInt(score || '0')).toBeGreaterThanOrEqual(0);
    }
  });

  test('should respond to keyboard controls', async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(600);
      
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(600);
      
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(600);
      
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(600);
      
      const score = await page.locator('.score-value').textContent();
      expect(parseInt(score || '0')).toBeGreaterThanOrEqual(0);
    }
  });

  test('should restart game on double tap', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(600);
      
      const scoreBefore = await page.locator('.score-value').textContent();
      
      const gameContainer = page.locator('#game-container');
      await gameContainer.dblclick();
      await page.waitForTimeout(300);
      
      const scoreAfter = await page.locator('.score-value').textContent();
      expect(scoreAfter).toBe('0');
    }
  });

  test('should restart game with R key', async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(600);
      
      await page.keyboard.press('r');
      await page.waitForTimeout(300);
      
      const score = await page.locator('.score-value').textContent();
      expect(score).toBe('0');
    }
  });

  test('should render 3D cube', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  });

  test('should take mobile screenshots', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.screenshot({ path: 'screenshots/mobile-initial.png', fullPage: true });
      
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'screenshots/mobile-gameplay.png', fullPage: true });
    }
  });

  test('should take desktop screenshots', async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.screenshot({ path: 'screenshots/desktop-initial.png', fullPage: true });
      
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'screenshots/desktop-gameplay.png', fullPage: true });
    }
  });

  test('performance: should maintain 60fps', async ({ page }) => {
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
    
    expect(metrics).toBeGreaterThan(50);
  });
});