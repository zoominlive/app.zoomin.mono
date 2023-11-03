const isConsoleLogEnabled = process.env.REACT_APP_ENABLE_CONSOLE_LOG === 'true';

const Logger = {
  log: (...args) => {
    if (isConsoleLogEnabled) {
      console.log(...args);
    }
  },
  error: (...args) => {
    if (isConsoleLogEnabled) {
      console.error(...args);
    }
  },
  warn: (...args) => {
    if (isConsoleLogEnabled) {
      console.warn(...args);
    }
  }
};

export default Logger;
