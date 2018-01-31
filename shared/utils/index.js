// @flow

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
export function printDone(
  m1: string = 'a',
  m2: string = 'b',
  clearMarks: boolean = true,
  comment: ?string,
): void {
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
 * Prints Neo4j query statistics
 */
export function printNeo4jStats(result: neo4j$result): void {
  if (result.records && result.records.length) {
    logger.info(`- ${result.records.length} rows returned`);
  }

  const stats = {
    nodesCreated: result.summary.counters.nodesCreated(),
    nodesDeleted: result.summary.counters.nodesDeleted(),
    relationshipsCreated: result.summary.counters.relationshipsCreated(),
    relationshipsDeleted: result.summary.counters.relationshipsDeleted(),
    propertiesSet: result.summary.counters.propertiesSet(),
    labelsAdded: result.summary.counters.labelsAdded(),
    labelsRemoved: result.summary.counters.labelsRemoved(),
    indexesAdded: result.summary.counters.indexesAdded(),
    indexesRemoved: result.summary.counters.indexesRemoved(),
    constraintsAdded: result.summary.counters.constraintsAdded(),
    constraintsRemoved: result.summary.counters.constraintsRemoved(),
  };

  Object.keys(stats).forEach((key) => {
    const stat = stats[key];
    if (stat) {
      const label = key.replace(/([A-Z])/g, ' $1').toLowerCase();
      logger.info(`- ${stat} ${label}`);
    }
  });
}


/**
 * Start a duration timer and return the mark id
 */
export function startDuration(): string {
  const mark = uuid4();
  performance.mark(mark);
  return mark;
}


/**
 * Given a starting mark id, end the duration timer and print the results
 */
export function endDuration(startMark: string, comment: ?string): void {
  const endMark = uuid4();
  performance.mark(endMark);
  printDone(startMark, endMark, true, comment);
}


/**
 * Print the error message and the error stack
 */
export function logError(
  err: Error,
  msg: string
): void {
  logger.error(`ERROR: ${msg}`);
  logger.error(err);
  logger.error(err.stack);
}
