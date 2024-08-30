// Assuming you have a config module with a getConfig method
import { getConfig, IConfigData } from '../config';

class Logger {
  log(...message): void {
    console.log('> ', ...message);
  }

  error(...message): void {
    console.error('> ', ...message);
  }

  // Verbose log method, logs only if config.verbose is true
  verbose(...message): void {
    if (process.env.LZGENIE_VERBOSE === '1') {
      console.log('> ', ...message);
    }
  }
}

const logger = new Logger();
export default logger;
