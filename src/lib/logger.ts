import winston from "winston";

const { combine, timestamp, json, colorize, printf } = winston.format;

const consoleLogFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp(), json()),
  defaultMeta: { service: "mana-events-web" },
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

// If we are in production, we might want to log to a file or a cloud logging service
if (process.env.NODE_ENV === "production") {
  // Example: Add a file transport
  // logger.add(new winston.transports.File({ filename: 'error.log', level: 'error' }));
  // logger.add(new winston.transports.File({ filename: 'combined.log' }));
}

export default logger;
