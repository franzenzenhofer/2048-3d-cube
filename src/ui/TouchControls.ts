import Hammer from 'hammerjs';
import { SwipeDirection } from '../game/CubeGame';

export class TouchControls {
  private hammer: HammerManager;
  private onSwipeCallback: (direction: SwipeDirection) => void;
  private onRestartCallback: () => void;
  private onRotateStartCallback?: () => void;
  private onRotateCallback?: (rotation: number) => void;
  private onPinchCallback?: (scale: number) => void;
  private onPanCallback?: (deltaX: number, deltaY: number) => void;
  private onRotateEndCallback?: () => void;
  private onLongPressCallback?: () => void;
  private isRotating: boolean = false;
  private isInRotationMode: boolean = false;

  constructor(
    element: HTMLElement, 
    onSwipe: (direction: SwipeDirection) => void,
    onRestart: () => void,
    onRotateStart?: () => void,
    onRotate?: (rotation: number) => void,
    onRotateEnd?: () => void,
    onPinch?: (scale: number) => void,
    onPan?: (deltaX: number, deltaY: number) => void,
    onLongPress?: () => void
  ) {
    this.onSwipeCallback = onSwipe;
    this.onRestartCallback = onRestart;
    this.onRotateStartCallback = onRotateStart;
    this.onRotateCallback = onRotate;
    this.onRotateEndCallback = onRotateEnd;
    this.onPinchCallback = onPinch;
    this.onPanCallback = onPan;
    this.onLongPressCallback = onLongPress;
    this.hammer = new Hammer(element);
    this.setupGestures();
    this.setupKeyboard();
  }

  public setRotationMode(enabled: boolean): void {
    this.isInRotationMode = enabled;
  }

  private setupGestures(): void {
    // Configure recognizers using Hammer.js to the max!
    
    // 1. Long press to enter rotation mode
    this.hammer.add(new Hammer.Press({
      event: 'press',
      time: 500, // 500ms hold
      threshold: 10
    }));
    
    // 2. Configure swipe with different behavior based on mode
    this.hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL,
      threshold: 30,
      velocity: 0.3
    });

    // 3. Pinch for zoom (always enabled)
    this.hammer.get('pinch').set({ enable: true });
    
    // 4. Rotate gesture for two-finger rotation
    this.hammer.get('rotate').set({ enable: true });
    
    // 5. Two-finger pan for free rotation
    this.hammer.add(new Hammer.Pan({ 
      event: 'twofingerpan',
      pointers: 2,
      threshold: 5
    }));
    
    // 6. Set up recognizer conflicts
    // Long press should block tap
    this.hammer.get('press').recognizeWith('tap');
    
    // Swipe should wait for press to fail
    this.hammer.get('swipe').requireFailure('press');
    
    // Two-finger gestures should work together
    const pinchRecognizer = this.hammer.get('pinch');
    const rotateRecognizer = this.hammer.get('rotate');
    const twoFingerPanRecognizer = this.hammer.get('twofingerpan');
    
    pinchRecognizer.recognizeWith([rotateRecognizer, twoFingerPanRecognizer]);
    rotateRecognizer.recognizeWith([pinchRecognizer, twoFingerPanRecognizer]);
    twoFingerPanRecognizer.recognizeWith([pinchRecognizer, rotateRecognizer]);

    // Long press to enter rotation mode
    this.hammer.on('press', () => {
      if (!this.isInRotationMode && this.onLongPressCallback) {
        this.haptic(50); // Strong haptic for mode change
        this.onLongPressCallback();
      }
    });

    // Single swipes - different behavior based on mode
    this.hammer.on('swipeleft', () => {
      if (this.isInRotationMode) {
        // In rotation mode, swipe exits mode and performs move
        this.setRotationMode(false);
        this.onSwipeCallback(SwipeDirection.LEFT);
        this.haptic(30);
      } else if (!this.isRotating) {
        // Normal mode swipe
        this.onSwipeCallback(SwipeDirection.LEFT);
        this.haptic();
      }
    });

    this.hammer.on('swiperight', () => {
      if (this.isInRotationMode) {
        this.setRotationMode(false);
        this.onSwipeCallback(SwipeDirection.RIGHT);
        this.haptic(30);
      } else if (!this.isRotating) {
        this.onSwipeCallback(SwipeDirection.RIGHT);
        this.haptic();
      }
    });

    this.hammer.on('swipeup', () => {
      if (this.isInRotationMode) {
        this.setRotationMode(false);
        this.onSwipeCallback(SwipeDirection.UP);
        this.haptic(30);
      } else if (!this.isRotating) {
        this.onSwipeCallback(SwipeDirection.UP);
        this.haptic();
      }
    });

    this.hammer.on('swipedown', () => {
      if (this.isInRotationMode) {
        this.setRotationMode(false);
        this.onSwipeCallback(SwipeDirection.DOWN);
        this.haptic(30);
      } else if (!this.isRotating) {
        this.onSwipeCallback(SwipeDirection.DOWN);
        this.haptic();
      }
    });

    // Two-finger rotation
    this.hammer.on('rotatestart', () => {
      this.isRotating = true;
      if (this.onRotateStartCallback) {
        this.onRotateStartCallback();
      }
    });

    this.hammer.on('rotatemove', (e) => {
      if (this.onRotateCallback) {
        this.onRotateCallback(e.rotation);
      }
    });

    this.hammer.on('rotateend rotatecancel', () => {
      this.isRotating = false;
      if (this.onRotateEndCallback) {
        this.onRotateEndCallback();
      }
    });

    // Also handle pinch as rotation
    this.hammer.on('pinchstart', () => {
      this.isRotating = true;
      if (this.onRotateStartCallback) {
        this.onRotateStartCallback();
      }
    });

    this.hammer.on('pinchmove', (e) => {
      if (this.onPinchCallback) {
        // Send pinch scale for zooming
        this.onPinchCallback(e.scale);
      }
      if (this.onRotateCallback) {
        // Convert pinch rotation to degrees
        this.onRotateCallback(e.rotation);
      }
    });

    this.hammer.on('pinchend pinchcancel', () => {
      this.isRotating = false;
      if (this.onRotateEndCallback) {
        this.onRotateEndCallback();
      }
    });
    
    // Two-finger pan - only for free rotation in rotation mode
    this.hammer.on('twofingerpanstart', () => {
      if (this.isInRotationMode) {
        this.isRotating = true;
        if (this.onRotateStartCallback) {
          this.onRotateStartCallback();
        }
      }
    });
    
    this.hammer.on('twofingerpanmove', (e) => {
      if (this.isInRotationMode && this.onPanCallback) {
        this.onPanCallback(e.deltaX, e.deltaY);
      }
    });
    
    this.hammer.on('twofingerpanend twofingerpancancel', () => {
      if (this.isInRotationMode) {
        this.isRotating = false;
        if (this.onRotateEndCallback) {
          this.onRotateEndCallback();
        }
      }
    });

    // Double tap to restart
    this.hammer.get('tap').set({ taps: 2 });
    this.hammer.on('tap', (e) => {
      if (e.tapCount === 2 && !this.isRotating) {
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