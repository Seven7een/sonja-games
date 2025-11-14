import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, setAuthToken } from './api';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any stored token
    (window as any).__CLERK_TOKEN__ = null;
  });

  describe('setAuthToken', () => {
    it('should set token on window object', () => {
      const token = 'test-token-123';
      setAuthToken(token);
      expect((window as any).__CLERK_TOKEN__).toBe(token);
    });

    it('should clear token when null is passed', () => {
      setAuthToken('test-token');
      setAuthToken(null);
      expect((window as any).__CLERK_TOKEN__).toBeNull();
    });
  });

  describe('api convenience methods', () => {
    it('should have get method', () => {
      expect(api.get).toBeDefined();
      expect(typeof api.get).toBe('function');
    });

    it('should have post method', () => {
      expect(api.post).toBeDefined();
      expect(typeof api.post).toBe('function');
    });

    it('should have put method', () => {
      expect(api.put).toBeDefined();
      expect(typeof api.put).toBe('function');
    });

    it('should have patch method', () => {
      expect(api.patch).toBeDefined();
      expect(typeof api.patch).toBe('function');
    });

    it('should have delete method', () => {
      expect(api.delete).toBeDefined();
      expect(typeof api.delete).toBe('function');
    });
  });
});
