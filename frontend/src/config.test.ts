import { describe, it, expect } from 'vitest';
import config from './config';

describe('Config', () => {
  it('should export config object with required properties', () => {
    expect(config).toBeDefined();
    expect(config).toHaveProperty('apiUrl');
    expect(config).toHaveProperty('clerkPublishableKey');
  });

  it('should have valid apiUrl', () => {
    expect(config.apiUrl).toBe('http://localhost:8000');
    expect(config.apiUrl).toMatch(/^https?:\/\//);
  });

  it('should have clerkPublishableKey', () => {
    expect(config.clerkPublishableKey).toBeDefined();
    expect(typeof config.clerkPublishableKey).toBe('string');
  });
});
