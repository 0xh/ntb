import Logger from './Logger';
import * as lodash from 'lodash';
import _moment from 'moment';
import _uuid4 from 'uuid/v4';


export { default as Logger } from './Logger';


const logger = Logger.getLogger();

type logLevel = 'debug' | 'info' | 'warn' | 'error';
type durationDataItem = { [key: string]: Date };

let durationDataAutoId = 0;
const durationData: durationDataItem = {};


// Export common dependencies
export const _ = lodash;
export const moment = _moment;
export const uuid4 = _uuid4;

/**
 * Starts a duration timer. Returns the duration id
 * @param id Specify an ID or the function will autogenerate one
 * @returns durationId
 */
export function startDuration(id?: string): string {
  let durationId = id;
  if (!durationId) {
    durationId = `__autoid__${durationDataAutoId}`;
    durationDataAutoId += 1;
  }

  durationData[durationId] = new Date();

  return durationId;
}


export function printDuration(
  durationId: string,
  messageFormat?: string,
  level?: logLevel,
): void;


export function printDuration(
  date: Date,
  messageFormat?: string,
  level?: logLevel,
): void;

export function printDuration(
  dateOrDurationId: Date | string,
  messageFormat: string = '- done: %duration',
  level: logLevel = 'info',
) {
  // Set date from key or submitted date object
  const date = typeof dateOrDurationId === 'string'
    ? durationData[dateOrDurationId]
    : dateOrDurationId;

  // Make sure we found the date object
  if (!date) {
    throw new Error('Unable to determine the duration start date');
  }

  // Remove from durationData if using key
  if (
    typeof dateOrDurationId === 'string'
    && dateOrDurationId.startsWith('__autoid__')
  ) {
    delete durationData[dateOrDurationId];
  }

  // Format and pretty print
  const seconds = ((new Date().getTime() - date.getTime()) / 1000).toFixed(3);
  const durationText = `${seconds} s`;
  const message = messageFormat.replace('%duration', durationText);
  logger[level](message);
}
