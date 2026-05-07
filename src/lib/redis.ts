import Redis from "ioredis";
import { redisUrl } from "./env";

declare global {
  var tmpRedisClient: Redis | undefined;
}

export function getRedisClient() {
  if (!globalThis.tmpRedisClient) {
    globalThis.tmpRedisClient = new Redis(redisUrl(), {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
    });
  }

  return globalThis.tmpRedisClient;
}

export async function assertRedisConnection() {
  const redis = getRedisClient();

  if (redis.status === "wait" || redis.status === "end") {
    await redis.connect();
  }

  const pong = await redis.ping();
  await redis.set("tmp:healthcheck", new Date().toISOString(), "EX", 60);
  const lastCheck = await redis.get("tmp:healthcheck");

  return { pong, lastCheck };
}
