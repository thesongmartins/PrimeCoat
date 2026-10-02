type Level = "info" | "warn" | "error";

interface LogContext {
  [key: string]: string | number | boolean | null | undefined;
}

function write(level: Level, event: string, context?: LogContext) {
  const entry = { level, event, ts: new Date().toISOString(), ...context };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

/**
 * Minimal structured logger. Never pass secrets, tokens or full request bodies.
 */
export const logger = {
  info: (event: string, context?: LogContext) => write("info", event, context),
  warn: (event: string, context?: LogContext) => write("warn", event, context),
  error: (event: string, context?: LogContext) => write("error", event, context),
};
