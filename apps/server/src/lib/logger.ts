/* eslint-disable no-console */

export const logger = {
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }
    // biome-ignore lint/suspicious/noConsole: I want to use console
    console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }
    // biome-ignore lint/suspicious/noConsole: I want to use console
    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }
    // biome-ignore lint/suspicious/noConsole: I want to use console
    console.error(...args);
  },
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }
    // biome-ignore lint/suspicious/noConsole: I want to use console
    console.debug(...args);
  },
};
