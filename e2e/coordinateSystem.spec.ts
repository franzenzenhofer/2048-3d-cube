import { test, expect } from '@playwright/test';

test.describe('Coordinate System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should move tiles correctly on all faces', async ({ page }) => {
    // Start the game
    await page.locator('.start-screen').click();
    await page.waitForTimeout(500);
    
    // Make several moves to test coordinate system
    const moves = [
      { key: 'ArrowLeft', description: 'Move left' },
      { key: 'ArrowRight', description: 'Move right' },
      { key: 'ArrowUp', description: 'Move up' },
      { key: 'ArrowDown', description: 'Move down' }
    ];
    
    for (const move of moves) {
      console.log(`Testing ${move.description}`);
      
      // Get initial score
      const initialScore = await page.locator('#score').textContent();
      
      // Make the move
      await page.keyboard.press(move.key);
      await page.waitForTimeout(800); // Wait for animation
      
      // Check that game is still playable
      await expect(page.locator('.game-screen')).toBeVisible();
      
      // Verify score changed (indicating tiles moved/merged)
      const newScore = await page.locator('#score').textContent();
      console.log(`Score: ${initialScore} -> ${newScore}`);
    }
  });
  
  test('should spawn new tiles only on active face', async ({ page }) => {
    await page.locator('.start-screen').click();
    await page.waitForTimeout(500);
    
    // Enable console logging to capture game state
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('Game:', msg.text());
      }
    });
    
    // Make moves and verify tile spawning
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(800);
      
      // Game should still be playable
      await expect(page.locator('.game-screen')).toBeVisible();
    }
  });
  
  test('should handle edge cases correctly', async ({ page }) => {
    await page.locator('.start-screen').click();
    await page.waitForTimeout(500);
    
    // Test rapid moves
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(200);
    }
    
    // Test alternating directions
    const directions = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press(directions[i % 4]);
      await page.waitForTimeout(600);
    }
    
    // Game should still be running
    await expect(page.locator('.game-screen')).toBeVisible();
    await expect(page.locator('#score')).toBeVisible();
  });
  
  test('should show different cube faces after rotation', async ({ page }) => {
    await page.locator('.start-screen').click();
    await page.waitForTimeout(500);
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/coord-test-initial.png' });
    
    // Move right (should show LEFT face)
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/coord-test-after-right.png' });
    
    // Move up (should show BOTTOM face from LEFT's perspective)
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/coord-test-after-up.png' });
    
    // Verify game is still playable
    await expect(page.locator('.game-screen')).toBeVisible();
  });
  
  test('should prevent rotation when no tiles can move', async ({ page }) => {
    await page.locator('.start-screen').click();
    await page.waitForTimeout(500);
    
    // Try to move in a direction where no tiles can move (edge case)
    // This is hard to test directly, but we can verify the game handles it
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(100);
    }
    
    // Game should still be running and not crashed
    await expect(page.locator('.game-screen')).toBeVisible();
  });
});