/**
 * Logger utility for consistent logging across the application
 */

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
}

export class Logger implements Logger {
  private context: string;
  private colors = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m',  // Reset
  };

  constructor(context: string) {
    this.context = context;
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, error?: Error, ...args: any[]): void {
    if (error) {
      this.log('error', message, error, ...args);
    } else {
      this.log('error', message, ...args);
    }
  }

  private log(level: keyof typeof this.colors, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const color = this.colors[level];
    const reset = this.colors.reset;
    const levelStr = level.toUpperCase().padEnd(5);
    
    const logMessage = `${color}[${timestamp}] ${levelStr} [${this.context}] ${message}${reset}`;
    
    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(logMessage, ...args);
        break;
      case 'info':
        console.info(logMessage, ...args);
        break;
      case 'warn':
        console.warn(logMessage, ...args);
        break;
      case 'error':
        console.error(logMessage, ...args);
        break;
    }
  }
}