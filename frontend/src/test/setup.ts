import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock environment variables
vi.mock('../config', () => ({
  default: {
    apiUrl: 'http://localhost:8000',
    clerkPublishableKey: 'pk_test_mock',
  },
  config: {
    apiUrl: 'http://localhost:8000',
    clerkPublishableKey: 'pk_test_mock',
  },
}));
