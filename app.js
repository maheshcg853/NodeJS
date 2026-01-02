const express = require('express');
const Redis = require('ioredis'); // ioredis is recommended for Cluster Mode
const app = express();
const port = process.env.PORT || 3000;

// 1. Initialize the Cluster connection
// Provide your ElastiCache "Configuration Endpoint" here. 
// ioredis will automatically discover all other nodes in the cluster.
const redis = new Redis.Cluster([
  {
    host: process.env.REDIS_CONF_ENDPOINT || 'master.apprunner-elasticcache.qcqeed.use1.cache.amazonaws.com',
    port: 6379
  }
], {
  redisOptions: {
    // Required if your ElastiCache has "Encryption in-transit" enabled
    tls: {}, 
    // Use if you have AUTH enabled (RBAC or Auth Token)
    // password: process.env.REDIS_PASSWORD 
  },
  // Ensures DNS resolution works correctly within AWS VPC
  dnsLookup: (address, callback) => callback(null, address) 
});

redis.on('error', (err) => console.error('Redis Cluster Error:', err));
redis.on('connect', () => console.log('Successfully connected to Redis Cluster'));

app.get('/', async (req, res) => {
  try {
    // Example: Use the cluster to store/get data
    await redis.set('last_access', new Date().toISOString());
    const lastAccess = await redis.get('last_access');

    res.json({
      message: 'Hello from AWS App Runner!',
      redis_data: lastAccess,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Redis operation failed' });
  }
});

app.get('/health', async (req, res) => {
  // Check cluster status for health checks
  const status = redis.status === 'ready' ? 'healthy' : 'unhealthy';
  res.status(status === 'healthy' ? 200 : 503).json({ status });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
