// @flow

declare type levels = 'silly' | 'debug' | 'verbose' | 'info' | 'warn' | 'error'

declare type format = any

declare type loggerOptions = {
  level: string,
  format: any,
  transports: Array<mixed>,
}


declare module 'winston' {
  declare type winston$logger = {
    log: (level: levels, ...args: mixed) => void,
    silly: (...args: mixed) => void,
    debug: (...args: mixed) => void,
    verbose: (...args: mixed) => void,
    info: (...args: mixed) => void,
    warn: (...args: mixed) => void,
    error: (...args: mixed) => void,
  }

  declare function createLogger(options: loggerOptions): winston$logger;

  declare module.exports: {
    createLogger: createLogger,
    format: format,
    transports: any,
  };
}
