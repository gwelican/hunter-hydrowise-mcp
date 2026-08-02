import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config.js';
import { ConfigError } from '../../src/errors.js';

const minimal = {
  HYDRAWISE_USERNAME: 'alice@example.com',
  HYDRAWISE_PASSWORD: 'sekret',
} as NodeJS.ProcessEnv;

describe('loadConfig', () => {
  it('parses minimal config with defaults', () => {
    const cfg = loadConfig(minimal);
    expect(cfg).toEqual({
      username: minimal.HYDRAWISE_USERNAME,
      password: minimal.HYDRAWISE_PASSWORD,
      host: '127.0.0.1',
      port: 8765,
      sessionTtlSeconds: 3600,
      logLevel: 'warn',
    });
  });

  it('throws when HYDRAWISE_USERNAME is missing', () => {
    expect(() => loadConfig({ HYDRAWISE_PASSWORD: 'x' })).toThrow(ConfigError);
  });

  it('throws when HYDRAWISE_PASSWORD is empty', () => {
    expect(() =>
      loadConfig({ HYDRAWISE_USERNAME: 'alice', HYDRAWISE_PASSWORD: '' }),
    ).toThrow(ConfigError);
  });

  it('mentions the missing field in the error', () => {
    let caught: unknown = null;
    try {
      loadConfig({ HYDRAWISE_USERNAME: 'alice' });
    } catch (err) {
      caught = err;
    }
    expect((caught as Error).message).toContain('HYDRAWISE_PASSWORD');
  });

  it('rejects out-of-range port', () => {
    expect(() => loadConfig({ ...minimal, HYDRAWISE_MCP_PORT: '0' })).toThrow(ConfigError);
    expect(() => loadConfig({ ...minimal, HYDRAWISE_MCP_PORT: '70000' })).toThrow(ConfigError);
  });
});
