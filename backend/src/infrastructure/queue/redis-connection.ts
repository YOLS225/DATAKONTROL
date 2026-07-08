import type { ConfigService } from "@nestjs/config";

interface RedisConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: Record<string, never>;
  maxRetriesPerRequest?: number | null;
}

export function createRedisConnectionOptions(
  config: ConfigService,
  options: { maxRetriesPerRequest?: number | null } = {},
): RedisConnectionOptions {
  const redisUrl = config.get<string>("REDIS_URL");
  const connection = redisUrl
    ? fromRedisUrl(redisUrl)
    : fromDiscreteConfig(config);

  if (options.maxRetriesPerRequest !== undefined) {
    connection.maxRetriesPerRequest = options.maxRetriesPerRequest;
  }

  return connection;
}

function fromRedisUrl(redisUrl: string): RedisConnectionOptions {
  const url = new URL(redisUrl);
  const usesTls = url.protocol === "rediss:";

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    ...(url.username ? { username: decodeURIComponent(url.username) } : {}),
    ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
    ...(usesTls ? { tls: {} } : {}),
  };
}

function fromDiscreteConfig(config: ConfigService): RedisConnectionOptions {
  const password = config.get<string>("REDIS_PASSWORD");
  const useTls = config.get<string>("REDIS_TLS") === "true";

  return {
    host: config.get<string>("REDIS_HOST") ?? "localhost",
    port: Number(config.get<string>("REDIS_PORT") ?? 6379),
    ...(password ? { password } : {}),
    ...(useTls ? { tls: {} } : {}),
  };
}
