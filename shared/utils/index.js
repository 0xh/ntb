import { performance } from 'perf_hooks'; // eslint-disable-line
import uuid4 from 'uuid/v4';
import winston from 'winston';


export function createLogger() {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log`
      // - Write all logs error (and below) to `error.log`.
      //
      // new winston.transports.File({
      //   filename: 'error.log',
      //   level: 'error',
      // }),
      // new winston.transports.File({
      //   filename: 'combined.log',
      // }),

      new winston.transports.Console({
        format: winston.format.simple(),
        colorize: true,
        timestamp: true,
        level: 'debug',
      }),
    ],
  });

  return logger;
}


const logger = createLogger();


/**
 * Prints the duration between performance measurement marks.
 * As default, it will clear the marks.
 */
export function printDone(m1 = 'a', m2 = 'b', clearMarks = true, comment) {
  const label = `${m1} to ${m2}`;
  performance.measure(label, m1, m2);
  const measure = performance.getEntriesByName(label)[0];
  logger.info(
    `- ${comment || 'done'} ${(measure.duration / 1000).toFixed(3)} s`
  );
  performance.clearMeasures(label);

  if (clearMarks) {
    performance.clearMarks(m1);
    performance.clearMarks(m2);
  }
}


/**
 * Start a duration timer and return the mark id
 */
export function startDuration() {
  const mark = uuid4();
  performance.mark(mark);
  return mark;
}


/**
 * Given a starting mark id, end the duration timer and print the results
 */
export function endDuration(startMark, comment) {
  const endMark = uuid4();
  performance.mark(endMark);
  printDone(startMark, endMark, true, comment);
}


/**
 * Print the error message and the error stack
 */
export function logError(err, msg) {
  logger.error(`ERROR: ${msg}`);
  logger.error(err);
  logger.error(err.stack);
}
