import session from "express-session";
import MemoryStoreFactory from "memorystore";

export function createSessionStore(): session.Store {
  const MemoryStore = MemoryStoreFactory(session);
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      // optional, loaded only in prod
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const connectRedis = require("connect-redis");
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Redis = require("ioredis");

      const RedisStore = connectRedis(session);
      const redisClient = new Redis(redisUrl, { connectTimeout: 10_000 });
      return new RedisStore({ client: redisClient });
    } catch (e) {
      console.warn("[session] Redis unavailable – using MemoryStore");
    }
  }
  return new MemoryStore({ checkPeriod: 86_400_000 }); // 24 h
}
