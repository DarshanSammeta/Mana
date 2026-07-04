import { metrics, trace } from '@opentelemetry/api';

const tracer = trace.getTracer('mana-events-marketplace');
const meter = metrics.getMeter('mana-events-marketplace');

// Custom Metrics
const apiLatency = meter.createHistogram('api_latency', {
  description: 'API Latency in ms',
  unit: 'ms',
});

const activeConnections = meter.createUpDownCounter('active_connections', {
  description: 'Number of active Socket.IO connections',
});

const redisOperationCounter = meter.createCounter('redis_operations', {
  description: 'Number of Redis operations',
});

export const observability = {
  tracer,
  apiLatency,
  activeConnections,
  redisOperationCounter,

  startSpan: (name: string) => tracer.startSpan(name),

  recordLatency: (path: string, duration: number) => {
    apiLatency.record(duration, { 'http.path': path });
  },

  incrementConnections: () => activeConnections.add(1),
  decrementConnections: () => activeConnections.add(-1),

  trackRedis: (operation: string) => {
    redisOperationCounter.add(1, { 'redis.operation': operation });
  }
};
