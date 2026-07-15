import winston from "winston";

const isServer = typeof window === "undefined";

let logger: any;

if (isServer) {
  const { combine, timestamp, json, colorize, printf, errors } = winston.format;

  const consoleLogFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message}`;
    if (stack) {
      msg += `\n${stack}`;
    }
    if (Object.keys(metadata).length > 0) {
      const { service: _service, environment: _environment, ...rest } = metadata;
      if (Object.keys(rest).length > 0) {
        msg += ` ${JSON.stringify(rest)}`;
      }
    }
    return msg;
  });

  logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(
      timestamp(),
      errors({ stack: true }),
      json()
    ),
    defaultMeta: {
      service: "mana-events-marketplace",
      environment: process.env.NODE_ENV || "development"
    },
    transports: [
      new winston.transports.Console({
        format: combine(
          colorize(),
          timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          consoleLogFormat
        ),
      }),
    ],
  });
} else {
  // Client-side fallback
  logger = {
    info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
    error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
    warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
    debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
    log: (level: string, msg: string, ...args: any[]) => console.log(`[${level.toUpperCase()}] ${msg}`, ...args),
  };
}

// Helper for structured production logs
export interface LogMeta {
  requestId?: string;
  correlationId?: string;
  userId?: string;
  vendorId?: string;
  bookingId?: string;
  apiName?: string;
  serviceName?: string;
  executionTime?: number;
  status?: number;
  errorCode?: string;
  environment?: string;
  route?: string;
  ipAddress?: string;
  traceId?: string;
  [key: string]: any;
}

export const logProduction = (
  level: "info" | "error" | "warn" | "debug",
  message: string,
  meta: LogMeta
) => {
  const logData = {
    ...meta,
    environment: meta.environment || process.env.NODE_ENV || "development",
  };

  if (isServer) {
    logger.log(level, message, logData);
  } else {
    console.log(`[PRODUCTION ${level.toUpperCase()}] ${message}`, logData);
  }
};

export default logger;
