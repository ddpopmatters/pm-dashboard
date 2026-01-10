/**
 * Structured JSON logging for better observability.
 * Outputs logs in JSON format with timestamp, level, message, and context.
 */

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  path?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

export interface Logger {
  info: (message: string, data?: object) => void;
  warn: (message: string, data?: object) => void;
  error: (message: string, error?: Error | null, data?: object) => void;
  child: (additionalContext: LogContext) => Logger;
}

/**
 * Formats a log entry as a JSON string.
 */
function formatLogEntry(
  level: LogLevel,
  message: string,
  context: LogContext,
  data?: object,
  error?: Error | null,
): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    ...data,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return JSON.stringify(entry);
}

/**
 * Writes a log entry to the console.
 */
function writeLog(level: LogLevel, formattedEntry: string): void {
  switch (level) {
    case 'error':
      console.error(formattedEntry);
      break;
    case 'warn':
      console.warn(formattedEntry);
      break;
    default:
      console.log(formattedEntry);
  }
}

/**
 * Creates a logger instance with optional context.
 * Context is included in every log entry from this logger.
 *
 * @example
 * const logger = createLogger({ requestId: 'abc123', path: '/api/auth' });
 * logger.info('User logged in', { userId: '456' });
 * // Output: {"timestamp":"2024-01-10T12:00:00Z","level":"info","message":"User logged in","requestId":"abc123","path":"/api/auth","userId":"456"}
 */
export function createLogger(context: LogContext = {}): Logger {
  return {
    info(message: string, data?: object): void {
      const entry = formatLogEntry('info', message, context, data);
      writeLog('info', entry);
    },

    warn(message: string, data?: object): void {
      const entry = formatLogEntry('warn', message, context, data);
      writeLog('warn', entry);
    },

    error(message: string, error?: Error | null, data?: object): void {
      const entry = formatLogEntry('error', message, context, data, error);
      writeLog('error', entry);
    },

    /**
     * Creates a child logger with additional context merged in.
     */
    child(additionalContext: LogContext): Logger {
      return createLogger({ ...context, ...additionalContext });
    },
  };
}

/**
 * Extracts request context from an HTTP request for logging.
 */
export function getRequestContext(request: Request): LogContext {
  const url = new URL(request.url);
  return {
    requestId: crypto.randomUUID(),
    path: url.pathname,
    method: request.method,
    ip:
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for') ||
      undefined,
  };
}

/**
 * Creates a logger pre-configured with request context.
 *
 * @example
 * const logger = createRequestLogger(request);
 * logger.info('Processing request');
 */
export function createRequestLogger(request: Request, additionalContext?: LogContext): Logger {
  const requestContext = getRequestContext(request);
  return createLogger({ ...requestContext, ...additionalContext });
}
