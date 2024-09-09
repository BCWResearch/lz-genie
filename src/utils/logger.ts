class Logger {
  log(...message): void {
    console.log('> ', ...message);
  }

  error(...message): void {
    console.error('> ', ...message);
  }

  // Verbose log method, logs only if using in dev mode
  verbose(...message): void {
    if (process.env.LZ_GENIE_DEV_MODE === '1') {
      console.log('> ', ...message);
    }
  }
}

const logger = new Logger();
export default logger;
