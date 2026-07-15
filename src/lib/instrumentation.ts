import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { logAuthLimits } from '@/config/auth-limits';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    'service.name': 'mana-events-marketplace',
  }),
  traceExporter: new OTLPTraceExporter({
    // Replace with your Honeycomb/Jaeger/OTEL Collector endpoint
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
    }),
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // ioredis and redis-based instrumentations are disabled since we use @upstash/redis (REST)
      ...({
        '@opentelemetry/instrumentation-ioredis': { enabled: false },
        '@opentelemetry/instrumentation-redis': { enabled: false },
        '@opentelemetry/instrumentation-redis-4': { enabled: false },
      } as any)
    }),
  ],
});

if (process.env.NEXT_RUNTIME === 'nodejs') {
  sdk.start();

  // Log auth rate limits on startup
  logAuthLimits();

  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
}
