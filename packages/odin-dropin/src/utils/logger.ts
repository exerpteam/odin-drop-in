export type LogLevel = 'NONE' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

const LogLevelSeverity: Record<LogLevel, number> = {
  'NONE': 0,
  'ERROR': 1,
  'WARN': 2,
  'INFO': 3,
  'DEBUG': 4,
};

export const DEFAULT_LOG_LEVEL: LogLevel = 'WARN';

/**
 * Simple logger function that respects the configured level.
 * @param configuredLevel The maximum level allowed to be logged.
 * @param messageLevel The level of the message being logged.
 * @param messages The message(s) to log.
 */
export function log(configuredLevel: LogLevel, messageLevel: LogLevel, ...messages: any[]) {
  if (LogLevelSeverity[messageLevel] <= LogLevelSeverity[configuredLevel]) {
    const prefix = `[OdinDropin][${messageLevel}]`;
    switch (messageLevel) {
      case 'ERROR':
        console.error(prefix, ...messages);
        break;
      case 'WARN':
        console.warn(prefix, ...messages);
        break;
      case 'INFO':
        console.info(prefix, ...messages); // console.info often styles differently
        break;
      case 'DEBUG':
        console.debug(prefix, ...messages); // console.debug might be filtered by browser
        break;
      // 'NONE' level messages are implicitly handled by the severity check
    }
  }
}

/**
 * Helper function to check if a certain level is loggable based on the configured level.
 * Useful for wrapping expensive log message generation.
 * @param configuredLevel The maximum level allowed to be logged.
 * @param messageLevel The level to check against.
 * @returns boolean indicating if the messageLevel is loggable.
 */
export function isLogLevelEnabled(configuredLevel: LogLevel, messageLevel: LogLevel): boolean {
    return LogLevelSeverity[messageLevel] <= LogLevelSeverity[configuredLevel];
}