const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from AWS App Runner!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


const { createClient } = require("redis");

let client;

function getRedisClient() {
  if (client) return client;

  // const redisUrl = process.env.REDIS_URL;
  const redisUrl =
    "rediss://master.apprunner-elasticcache.qcqeed.use1.cache.amazonaws.com:6379";
  
  if (!redisUrl) throw new Error("REDIS_URL is missing");

  const isTls = true;
  // const isTls =
  //   process.env.REDIS_TLS === "true" || redisUrl.startsWith("rediss://");

  client = createClient({
    url: redisUrl,
    socket: {
      tls: isTls,
      // For ElastiCache TLS, many teams set this false.
      // If you want strict validation later, set it to true and use proper CA/certs.
      rejectUnauthorized: true,
      // rejectUnauthorized: process.env.REDIS_REJECT_UNAUTHORIZED !== "false",
    },
  });

  client.on("error", (err) => {
    console.error("Redis error:", err);
    process.exit(1);
  });

  return client;
}

async function connectRedis() {
  const c = getRedisClient();
  if (!c.isOpen) await c.connect();
  return c;
}

module.exports = { getRedisClient, connectRedis };
