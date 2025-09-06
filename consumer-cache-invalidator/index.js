import { createClient } from "redis";

export const handler = async (event) => {
  console.log("Cache Invalidator received:", JSON.stringify(event));

  const redisClient = createClient({ url: process.env.REDIS_URL });
  await redisClient.connect();

  const detail = event.detail || JSON.parse(event.Detail);

  await redisClient.del("plans");
  console.log(`🗑️ Cache invalidated for plan ${detail.id}`);

  await redisClient.quit();
};
