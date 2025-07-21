import './style.css';
import { Game2048V3 } from './Game2048V3';

// Prevent zoom and scroll on mobile
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new Game2048V3();
});

// Prevent pull-to-refresh
let lastTouchY = 0;
document.addEventListener('touchstart', (e) => {
  lastTouchY = e.touches[0].clientY;
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  const touchY = e.touches[0].clientY;
  const touchDiff = touchY - lastTouchY;
  
  if (window.scrollY === 0 && touchDiff > 0) {
    e.preventDefault();
  }
  
  lastTouchY = touchY;
}, { passive: false });
