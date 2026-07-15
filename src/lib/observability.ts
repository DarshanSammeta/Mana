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

const bookingCounter = meter.createCounter('bookings_total', {
  description: 'Total number of bookings created',
});

const paymentCounter = meter.createCounter('payments_total', {
  description: 'Total number of payments processed',
});

const errorRate = meter.createCounter('errors_total', {
  description: 'Total number of errors',
});

const loginCounter = meter.createCounter('login_attempts_total', {
  description: 'Total number of login attempts',
});

const otpCounter = meter.createCounter('otp_requests_total', {
  description: 'Total number of OTP requests',
});

export const observability = {
  tracer,
  apiLatency,
  activeConnections,
  redisOperationCounter,
  bookingCounter,
  paymentCounter,
  errorRate,
  loginCounter,
  otpCounter,

  startSpan: (name: string) => tracer.startSpan(name),

  recordLatency: (path: string, duration: number) => {
    apiLatency.record(duration, { 'http.path': path });
  },

  incrementConnections: () => activeConnections.add(1),
  decrementConnections: () => activeConnections.add(-1),

  trackRedis: (operation: string) => {
    redisOperationCounter.add(1, { 'redis.operation': operation });
  },

  trackBooking: (status: string) => {
    bookingCounter.add(1, { 'booking.status': status });
  },

  trackPayment: (status: string, provider: string) => {
    paymentCounter.add(1, { 'payment.status': status, 'payment.provider': provider });
  },

  trackError: (code: string, service: string) => {
    errorRate.add(1, { 'error.code': code, 'error.service': service });
  },

  trackLogin: (success: boolean) => {
    loginCounter.add(1, { 'login.success': String(success) });
  },

  trackOTP: (success: boolean) => {
    otpCounter.add(1, { 'otp.success': String(success) });
  }
};
