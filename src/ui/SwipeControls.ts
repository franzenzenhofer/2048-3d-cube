import Hammer from 'hammerjs';
import { Direction } from '../game/GameBoard';

export class SwipeControls {
  private hammer: HammerManager;
  private onSwipeCallback: (direction: Direction) => void;
  private element: HTMLElement;

  constructor(element: HTMLElement, onSwipe: (direction: Direction) => void) {
    this.element = element;
    this.onSwipeCallback = onSwipe;
    this.hammer = new Hammer(element);
    this.setupGestures();
    this.setupKeyboardControls();
  }

  private setupGestures(): void {
    this.hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL,
      threshold: 10,
      velocity: 0.3
    });

    this.hammer.on('swipeleft', () => {
      this.onSwipeCallback(Direction.LEFT);
      this.addHapticFeedback();
    });

    this.hammer.on('swiperight', () => {
      this.onSwipeCallback(Direction.RIGHT);
      this.addHapticFeedback();
    });

    this.hammer.on('swipeup', () => {
      this.onSwipeCallback(Direction.UP);
      this.addHapticFeedback();
    });

    this.hammer.on('swipedown', () => {
      this.onSwipeCallback(Direction.DOWN);
      this.addHapticFeedback();
    });

    this.hammer.get('tap').set({ taps: 2 });
    this.hammer.on('tap', (e) => {
      if (e.tapCount === 2) {
        this.element.dispatchEvent(new CustomEvent('restart'));
      }
    });
  }

  private setupKeyboardControls(): void {
    window.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          this.onSwipeCallback(Direction.LEFT);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          this.onSwipeCallback(Direction.RIGHT);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          this.onSwipeCallback(Direction.UP);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.onSwipeCallback(Direction.DOWN);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          this.element.dispatchEvent(new CustomEvent('restart'));
          break;
      }
    });
  }

  private addHapticFeedback(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }

  public destroy(): void {
    this.hammer.destroy();
  }
}