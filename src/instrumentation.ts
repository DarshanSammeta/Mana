export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    const { OTLPMetricExporter } = await import('@opentelemetry/exporter-metrics-otlp-http');
    const { PeriodicExportingMetricReader } = await import('@opentelemetry/sdk-metrics');
    const { resourceFromAttributes } = await import('@opentelemetry/resources');
    const { logAuthLimits } = await import('@/config/auth-limits');

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        'service.name': 'mana-events-marketplace',
      }),
      traceExporter: new OTLPTraceExporter({
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
            '@opentelemetry/instrumentation-winston': { enabled: false },
            '@opentelemetry/instrumentation-fs': { enabled: false },
          } as any)
        }),
      ],
    });

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
}
