import { z } from 'zod';
import { ConfigError } from './errors.js';
import type { LogLevel } from './logger.js';

const RawSchema = z.object({
  HYDRAWISE_USERNAME: z.string().min(1, 'HYDRAWISE_USERNAME is required'),
  HYDRAWISE_PASSWORD: z.string().min(1, 'HYDRAWISE_PASSWORD is required'),
  HYDRAWISE_MCP_HOST: z.string().min(1).default('127.0.0.1'),
  HYDRAWISE_MCP_PORT: z
    .string()
    .default('8765')
    .transform((s, ctx) => {
      const n = Number.parseInt(s, 10);
      if (!Number.isInteger(n) || n < 1 || n > 65535) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `HYDRAWISE_MCP_PORT must be an integer 1..65535, got ${s}`,
        });
        return z.NEVER;
      }
      return n;
    }),
  HYDRAWISE_MCP_SESSION_TTL: z
    .string()
    .default('3600')
    .transform((s, ctx) => {
      const n = Number.parseInt(s, 10);
      if (!Number.isInteger(n) || n < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `HYDRAWISE_MCP_SESSION_TTL must be a positive integer, got ${s}`,
        });
        return z.NEVER;
      }
      return n;
    }),
  HYDRAWISE_LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug'] as const)
    .default('warn'),
});

export interface Config {
  username: string;
  password: string;
  host: string;
  port: number;
  sessionTtlSeconds: number;
  logLevel: LogLevel;
}


export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const filtered: Record<string, string | undefined> = {};
  for (const key of Object.keys(RawSchema.shape)) {
    const v = env[key];
    if (v !== undefined && v !== '') filtered[key] = v;
  }

  const parsed = RawSchema.safeParse(filtered);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const fieldName = first?.path?.[0];
    const baseMessage = first?.message ?? 'invalid configuration';
    const message =
      fieldName && !baseMessage.includes(String(fieldName))
        ? `${String(fieldName)}: ${baseMessage}`
        : baseMessage;
    throw new ConfigError(message);
  }
  const raw = parsed.data;
  const host = raw.HYDRAWISE_MCP_HOST;

  return {
    username: raw.HYDRAWISE_USERNAME,
    password: raw.HYDRAWISE_PASSWORD,
    host,
    port: raw.HYDRAWISE_MCP_PORT,
    sessionTtlSeconds: raw.HYDRAWISE_MCP_SESSION_TTL,
    logLevel: raw.HYDRAWISE_LOG_LEVEL,
  };
}
