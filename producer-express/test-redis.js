import { createClient } from "redis";

const client = createClient({ url: process.env.REDIS_URL });

client.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  try {
    await client.connect();
    console.log("✅ Connected to Redis");

    await client.set("foo", "bar");
    const value = await client.get("foo");
    console.log("foo =", value);

    await client.disconnect();
  } catch (err) {
    console.error("❌ Failed to connect:", err);
  }
})();
