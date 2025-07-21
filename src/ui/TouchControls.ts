import Hammer from 'hammerjs';
import { SwipeDirection } from '../game/CubeGame';

export class TouchControls {
  private hammer: HammerManager;
  private onSwipeCallback: (direction: SwipeDirection) => void;
  private onRestartCallback: () => void;

  constructor(
    element: HTMLElement, 
    onSwipe: (direction: SwipeDirection) => void,
    onRestart: () => void
  ) {
    this.onSwipeCallback = onSwipe;
    this.onRestartCallback = onRestart;
    this.hammer = new Hammer(element);
    this.setupGestures();
    this.setupKeyboard();
  }

  private setupGestures(): void {
    // Configure swipe detection
    this.hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL,
      threshold: 30,
      velocity: 0.3
    });

    // Single swipes for movement
    this.hammer.on('swipeleft', () => {
      this.onSwipeCallback(SwipeDirection.LEFT);
      this.haptic();
    });

    this.hammer.on('swiperight', () => {
      this.onSwipeCallback(SwipeDirection.RIGHT);
      this.haptic();
    });

    this.hammer.on('swipeup', () => {
      this.onSwipeCallback(SwipeDirection.UP);
      this.haptic();
    });

    this.hammer.on('swipedown', () => {
      this.onSwipeCallback(SwipeDirection.DOWN);
      this.haptic();
    });

    // Double tap to restart
    this.hammer.get('tap').set({ taps: 2 });
    this.hammer.on('tap', (e) => {
      if (e.tapCount === 2) {
        this.onRestartCallback();
        this.haptic(20);
      }
    });
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          this.onSwipeCallback(SwipeDirection.LEFT);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          this.onSwipeCallback(SwipeDirection.RIGHT);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          this.onSwipeCallback(SwipeDirection.UP);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.onSwipeCallback(SwipeDirection.DOWN);
          break;
        case 'r':
        case 'R':
        case ' ':
          e.preventDefault();
          this.onRestartCallback();
          break;
      }
    });
  }

  private haptic(duration: number = 10): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }

  public destroy(): void {
    this.hammer.destroy();
  }
}