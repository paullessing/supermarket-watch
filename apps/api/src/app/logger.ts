import winston, { format, Logger } from 'winston';

const { printf } = format;

export function initialiseLogger(logLevel?: string): Logger {
  const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  });

  const logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: format.combine(format.timestamp(), format.colorize(), myFormat),
  });

  logger.level = logLevel || 'info';

  /* eslint-disable @typescript-eslint/ban-types */
  console.log = (...args: unknown[]) => (logger.verbose as Function).call(logger, ...args);
  console.info = (...args: unknown[]) => (logger.info as Function).call(logger, ...args);
  console.warn = (...args: unknown[]) => (logger.warn as Function).call(logger, ...args);
  console.error = (...args: unknown[]) => (logger.error as Function).call(logger, ...args);
  console.debug = (...args: unknown[]) => (logger.debug as Function).call(logger, ...args);

  return logger;
}
