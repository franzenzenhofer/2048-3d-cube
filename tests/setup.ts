import { vi } from 'vitest';

// Define app version for tests
(global as any).__APP_VERSION__ = '2.2.20';
(global as any).__BUILD_TIME__ = new Date().toISOString();

// Mock window and document for Hammer.js
global.window = {
  navigator: {
    vibrate: vi.fn()
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  document: {},
  // Add other window properties Hammer.js might need
  screen: { width: 1024, height: 768 },
  innerWidth: 1024,
  innerHeight: 768
} as any;

global.document = {
  createElement: vi.fn(() => ({
    style: {},
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => [])
  })),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => [])
  },
  head: {
    appendChild: vi.fn()
  },
  getElementById: vi.fn(() => ({
    innerHTML: '',
    style: {},
    addEventListener: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => [])
  }))
} as any;

// Mock navigator
global.navigator = {
  vibrate: vi.fn(() => true),
  userAgent: 'test'
} as any;

// Mock HTMLElement
global.HTMLElement = class HTMLElement {
  style: any = {};
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
  appendChild = vi.fn();
  removeChild = vi.fn();
  querySelector = vi.fn();
  querySelectorAll = vi.fn(() => []);
} as any;