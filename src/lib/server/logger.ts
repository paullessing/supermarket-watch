import winston, { format, Logger } from 'winston';

const { printf } = format;

export function initialiseLogger(logLevel?: string): Logger {
  const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  });

  if (logLevel) {
    console.log(`Log level set to "${logLevel}"`);
  }

  const logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: format.combine(format.timestamp(), format.colorize(), myFormat),
  });

  logger.level = logLevel || 'info';

  function formatConsoleLog(...args: unknown[]): string {
    return args
      .map((value) => {
        if (typeof value === 'string') {
          return value;
        }
        if (value === 'null') {
          return 'null';
        }
        if (typeof value === 'undefined') {
          return 'undefined';
        }
        return JSON.stringify(value);
      })
      .join(' ');
  }

  console.log = (...args: unknown[]) => logger.verbose(formatConsoleLog(...args));
  console.info = (...args: unknown[]) => logger.info(formatConsoleLog(...args));
  console.warn = (...args: unknown[]) => logger.warn(formatConsoleLog(...args));
  console.error = (...args: unknown[]) => logger.error(formatConsoleLog(...args));
  console.debug = (...args: unknown[]) => logger.debug(formatConsoleLog(...args));

  return logger;
}
