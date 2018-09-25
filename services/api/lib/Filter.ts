import uuidValidate from 'uuid-validate';

import { moment, isNumber } from '@ntb/utils';

import {
  FilterOptions,
  QueryFilterOption,
  QueryFilters,
  QueryOptions,
} from './types';
import { Moment } from 'moment';


class Filter {
  filterOptions: FilterOptions;
  queryOptions: QueryOptions;
  errors: string[] = [];
  queryFilterOptions?: QueryFilters<QueryFilterOption>;

  constructor(filterOptions: FilterOptions, queryOptions: QueryOptions) {
    this.filterOptions = filterOptions;
    this.queryOptions = queryOptions;

    if (filterOptions.type === 'relationExistance') {
      this.processRelationExistance();
      return;
    }
    if (filterOptions.type === 'uuid') {
      this.processUuid();
      return;
    }
    if (filterOptions.type === 'date') {
      this.processDate();
      return;
    }
    if (filterOptions.type === 'boolean') {
      this.processBoolean();
      return;
    }
    if (filterOptions.type === 'number') {
      this.processNumber();
      return;
    }
    if (filterOptions.type === 'text') {
      this.processText();
      return;
    }
    if (filterOptions.type === 'geojson') {
      this.processGeojson();
      return;
    }

    // filterOptions.type;
    throw new Error('Unsupported filter type');
  }

  private processRelationExistance(): this {
    const error = (
      `Invalid value of '${this.filterOptions.errorTrace}'. ` +
      "Must be a single string value of '' (blank) or '!'"
    );
    const value = this.getSingleStringValue(error);
    if (value === null) return this;

    if (value !== '' && value !== '!') {
      this.errors.push(error);
      return this;
    }

    // Relation does not exist
    if (value === '!') {
      this.queryFilterOptions = [
        {
          whereType: 'whereNull',
          options: [
            this.filterOptions.attribute as string,
          ],
        },
      ];
    }
    // Relation exists (set as inner join)
    else {
      const relationName = this.filterOptions.relationName as string;
      this.queryOptions.relationIndex[relationName] = 'inner';
      for (const [idx, relation] of this.queryOptions.relations.entries()) {
        if (relation.key === relationName) {
          this.queryOptions.relations[idx].type = 'inner';
        }
      }
    }

    return this;
  }

  private processUuid(): this {
    const { filterTypes, errorTrace } = this.filterOptions;
    const value = this.getSingleStringValue();
    if (value === null) return this;

    // Where null
    if (value === '' && (!filterTypes || filterTypes.includes('notnull'))) {
      return this.whereNotNull();
    }

    // Where not null
    if (value === '!' && (!filterTypes || filterTypes.includes('null'))) {
      return this.whereNull();
    }

    // In or not in list of values
    if (value.startsWith('$in:') || value.startsWith('$nin:')) {
      return this.whereIn(value);
    }

    // Exact match
    if (!filterTypes || filterTypes.includes('=')) {
      this.queryFilterOptions = [{
        whereType: 'where',
        options: [
          this.filterOptions.attribute as string,
          '=',
          value,
        ],
      }];
      return this;
    }

    this.errors.push(
      `Invalid value of '${errorTrace}'. Refer to the docs for correct usage.`,
    );
    return this;
  }

  private processDate(): this {
    const value = this.getSingleStringValue();
    const { errorTrace, filterTypes } = this.filterOptions;
    const error = `Invalid value of '${errorTrace}'. Invalid format.`;

    if (value === null) return this;

    // Where null
    if (value === '' && (!filterTypes || filterTypes.includes('notnull'))) {
      return this.whereNotNull();
    }

    // Where not null
    if (value === '!' && (!filterTypes || filterTypes.includes('null'))) {
      return this.whereNull(true);
    }

    // Set prefix
    type prefixType = '' | '$after' | '$between' | '$before';
    let prefix: prefixType = '';
    const prefixes: prefixType[] = ['$after', '$between', '$before'];
    for (const p of prefixes) {
      if (value.startsWith(`${p}:`)) {
        prefix = p;
      }
    }

    // Make sure the prefix is supported
    if (prefix && filterTypes && !filterTypes.includes(prefix)) {
      this.errors.push(
        `Invalid value of '${errorTrace}'. ${prefix}-filter is not ` +
        'supported on this field.',
      );
      return this;
    }

    // Split dates
    const dates = value.substr(prefix.length + 1).split('|');

    // Validate number of dates
    if (
      (dates.length !== 1 && prefix !== '$between')
      || (dates.length !== 2 && prefix === '$between')
    ) {
      this.errors.push(error);
      return this;
    }

    const date1 = moment(dates[0].toUpperCase(), moment.ISO_8601);
    const date2 = dates.length === 2
      ? moment(dates[1].toUpperCase(), moment.ISO_8601)
      : null;

    // Validate dates
    if (!date1.isValid() || (date2 && !date2.isValid())) {
      this.errors.push(`${error} Must be ISO 8601 formatted dates.`);
      return this;
    }

    // $before:
    if (prefix === '$before') {
      this.queryFilterOptions = [{
        whereType: 'where',
        options: [
          this.filterOptions.attribute as string,
          '<',
          date1.format(),
        ],
      }];
      return this;
    }

    // $after:
    if (prefix === '$after') {
      this.queryFilterOptions = [{
        whereType: 'where',
        options: [
          this.filterOptions.attribute as string,
          '>',
          date1.format(),
        ],
      }];
      return this;
    }

    // $between:
    if (prefix === '$between') {
      this.queryFilterOptions = [{
        whereType: 'whereBetween',
        options: [
          this.filterOptions.attribute as string,
          [date1.format(), (date2 as Moment).format()],
        ],
      }];
      return this;
    }

    // Exact match
    if (!filterTypes || filterTypes.includes('=')) {
      this.queryFilterOptions = [{
        whereType: 'where',
        options: [
          this.filterOptions.attribute as string,
          '=',
          date1.format(),
        ],
      }];
      return this;
    }

    this.errors.push(
      `Invalid value of '${errorTrace}'. Refer to the docs for correct usage.`,
    );
    return this;
  }

  private processBoolean(): this {
    const { errorTrace } = this.filterOptions;
    const value = this.getSingleStringValue();
    const error = `Invalid value of '${errorTrace}'. Invalid format.`;

    if (value === null) return this;

    if (value !== 'true' && value !== 'false') {
      this.errors.push(error);
      return this;
    }

    if (value === 'true') {
      this.queryFilterOptions = [
        {
          whereType: 'where',
          options: [
            this.filterOptions.attribute as string,
            '=',
            'true',
          ],
        },
      ];
      return this;
    }

    this.queryFilterOptions = [[
      '$or',
      [
        {
          whereType: 'where',
          options: [
            this.filterOptions.attribute as string,
            '=',
            'false',
          ],
        },
        {
          whereType: 'whereNull',
          options: [
            this.filterOptions.attribute as string,
          ],
        },
      ],
    ]];

    return this;
  }

  private processNumber(): this {
    const { filterTypes, errorTrace } = this.filterOptions;
    const value = this.getSingleStringOrNumberValue();
    const error = `Invalid value of '${errorTrace}'. Only integers supported.`;
    let num: number;

    if (value === null) return this;

    // Where null
    if (value === '' && (!filterTypes || filterTypes.includes('notnull'))) {
      return this.whereNotNull();
    }

    // Where not null
    if (value === '!' && (!filterTypes || filterTypes.includes('null'))) {
      return this.whereNull();
    }

    type prefixType = '$gt' | '$gte' | '$lt' | '$lte';
    let prefix: prefixType | '' = '';
    if (typeof value === 'string') {
      const prefixes: prefixType[] = ['$gt', '$gte', '$lt', '$lte'];
      for (const p of prefixes) {
        if (value.startsWith(p)) {
          if (filterTypes && !filterTypes.includes(p)) {
            this.errors.push(
              `Invalid value of '${errorTrace}'. ${p}-prefix ` +
              'is not supported on this field',
            );
            return this;
          }
          prefix = p;
        }
      }

      if (prefix === '' && filterTypes && !filterTypes.includes('=')) {
        this.errors.push(
          `Invalid value of '${errorTrace}'. Equal match ` +
          'is not supported on this field',
        );
        return this;
      }

      const rawValue = value.slice(prefix.length + 1);
      if (!isNumber(rawValue)) {
        this.errors.push(error);
        return this;
      }
      num = Number.parseInt(rawValue, 10);
    }
    else {
      if (!Number.isInteger(value)) {
        this.errors.push(error);
        return this;
      }
      num = value;
    }

    let dbPrefix = '=';
    switch (prefix) {
      case '$gt':
        dbPrefix = '>';
        break;
      case '$gte':
        dbPrefix = '>=';
        break;
      case '$lt':
        dbPrefix = '<';
        break;
      case '$lte':
        dbPrefix = '<=';
        break;
      default:
        dbPrefix = '=';
        break;
    }

    this.queryFilterOptions = [
      {
        whereType: 'where',
        options: [
          this.filterOptions.attribute as string,
          dbPrefix,
          num,
        ],
      },
    ];

    return this;
  }

  private processText(): this {
    const { filterTypes, errorTrace } = this.filterOptions;
    let value = this.getSingleStringValue();
    if (value === null) return this;

    if (this.filterOptions.caseInsensitive) {
      value = value.toLowerCase();
    }

    // Where null
    if (value === '' && (!filterTypes || filterTypes.includes('notnull'))) {
      return this.whereNotNull();
    }

    // Where not null
    if (value === '!' && (!filterTypes || filterTypes.includes('null'))) {
      return this.whereNull();
    }

    // In or not in list of values
    if (value.startsWith('$in:') || value.startsWith('$nin:')) {
      return this.whereIn(value);
    }

    // Set prefix
    type prefixType = '~' | '^' | '$' | '!';
    let prefix: prefixType | '' = '';
    const prefixes: prefixType[] = ['~', '^', '$', '!'];
    for (const p of prefixes) {
      if (value.startsWith(p)) {
        prefix = p;
      }
    }

    // Make sure the prefix is supported
    if (prefix && filterTypes && !filterTypes.includes(prefix)) {
      this.errors.push(
        `Invalid value of '${errorTrace}'. ${prefix}-filter is not ` +
        'supported on this field.',
      );
      return this;
    }

    // Contains
    if (prefix === '~') {
      this.queryFilterOptions = [{
        whereType: 'where',
        options: [
          this.filterOptions.attribute as string,
          'like',
          `%${value.slice(1)}%`,
        ],
      }];
      return this;
    }

    // Starts with
    if (prefix === '^') {
      this.queryFilterOptions = [{
        whereType: 'where',
        options: [
          this.filterOptions.attribute as string,
          'like',
          `%${value.slice(1)}`,
        ],
      }];
      return this;
    }

    // Ends with
    if (prefix === '$') {
      this.queryFilterOptions = [{
        whereType: 'where',
        options: [
          this.filterOptions.attribute as string,
          'like',
          `${value.slice(1)}%`,
        ],
      }];
      return this;
    }

    // Not equal
    if (prefix === '!') {
      this.queryFilterOptions = [{
        whereType: 'where',
        options: [
          this.filterOptions.attribute as string,
          '<>',
          value.slice(1),
        ],
      }];
      return this;
    }

    // Exact match
    if (!filterTypes || filterTypes.includes('=')) {
      this.queryFilterOptions = [{
        whereType: 'where',
        options: [
          this.filterOptions.attribute as string,
          '=',
          value,
        ],
      }];
      return this;
    }

    this.errors.push(
      `Invalid value of '${errorTrace}'. Refer to the docs for correct usage.`,
    );
    return this;
  }

  private processGeojson(): this {
    const { filterTypes, errorTrace } = this.filterOptions;
    const value = this.getSingleStringValue();
    if (value === null) return this;

    // Where null
    if (value === '' && (!filterTypes || filterTypes.includes('notnull'))) {
      return this.whereNotNull();
    }

    // Where not null
    if (value === '!' && (!filterTypes || filterTypes.includes('null'))) {
      return this.whereNull();
    }

    this.errors.push(
      `Invalid value of '${errorTrace}'. Refer to the docs for correct usage.`,
    );
    return this;
  }

  private whereNull(checkLength = false): this {
    const { filterTypes, errorTrace } = this.filterOptions;
    if (filterTypes && !filterTypes.includes('null')) {
      this.errors.push(
        `Invalid value of '${errorTrace}'. null-filter is not supported ` +
        'on this field',
      );
      return this;
    }

    const whereNull: QueryFilterOption = {
      whereType: 'whereNull',
      options: [
        this.filterOptions.attribute as string,
      ],
    };

    if (checkLength) {
      this.queryFilterOptions = [[
        '$or',
        [
          whereNull,
          {
            whereType: 'whereRaw',
            options: [
              `LENGTH(${this.filterOptions.snakeCasedAttribute}) = 0`,
            ],
          },
        ],
      ]];
    }
    else {
      this.queryFilterOptions = [whereNull];
    }

    return this;
  }

  private whereNotNull(): this {
    const { filterTypes, errorTrace } = this.filterOptions;
    if (filterTypes && !filterTypes.includes('notnull')) {
      this.errors.push(
        `Invalid value of '${errorTrace}'. not-null-filter is not supported ` +
        'on this field',
      );
      return this;
    }

    this.queryFilterOptions = [
      {
        whereType: 'whereNotNull',
        options: [
          this.filterOptions.attribute as string,
        ],
      },
    ];

    return this;
  }

  private whereIn(value: string): this {
    const { filterTypes, errorTrace } = this.filterOptions;
    const error = (
      `Invalid value of '${errorTrace}'. Not able to parse a list of values.`
    );
    const prefix = value.startsWith('$in:')
      ? '$in'
      : '$nin';

    if (filterTypes && !filterTypes.includes(prefix)) {
      this.errors.push(
        `Invalid value of '${errorTrace}'. ${prefix}-filter is not ` +
        'supported on this field',
      );
      return this;
    }

    // Verify values format
    const valuesString = value.slice(prefix.length + 1);
    if (
      !valuesString
      || valuesString.length < 3
      || !valuesString.startsWith('"')
      || !valuesString.endsWith('"')
    ) {
      this.errors.push(error);
      return this;
    }

    // Parse values
    let values: string[] | undefined;
    try {
      values = JSON.parse(`[${valuesString}]`);
    }
    catch (e) {
      this.errors.push(error);
      return this;
    }

    if (!values) {
      this.errors.push(error);
      return this;
    }

    // Validate uuid-values
    if (this.filterOptions.type === 'uuid') {
      for (const uuid of values) {
        if (!uuidValidate(uuid)) {
          this.errors.push(
            `Invalid value of '${errorTrace}'. ` +
            'Not able to parse a list of uuid values.',
          );
          return this;
        }
      }
    }

    // Number of values
    if (values.length > 20) {
      this.errors.push(
        `Invalid value of '${errorTrace}'. ` +
        'Too many values (max 20).',
      );
      return this;
    }

    // Create where clause
    const whereType = prefix === '$in'
      ? 'whereIn'
      : 'whereNotIn';
    this.queryFilterOptions = [
      {
        whereType,
        options: [
          this.filterOptions.attribute as string,
          values,
        ],
      },
    ];

    return this;
  }

  private getSingleStringValue(error: string | null = null): string | null {
    const { errorTrace } = this.filterOptions;
    const errorMsg = error || (
      `Invalid value of '${errorTrace}'. Expecting a single string value.`
    );
    const values = this.filterOptions.value;

    if (!Array.isArray(values) && typeof values !== 'string') {
      this.errors.push(errorMsg);
      return null;
    }

    if (Array.isArray(values) && values.length > 1) {
      this.errors.push(errorMsg);
      return null;
    }

    if (Array.isArray(values)) {
      return values[0].trim();
    }

    return values.trim();
  }

  private getSingleStringOrNumberValue(
    error: string | null = null,
  ): string | number | null {
    const { errorTrace } = this.filterOptions;
    const errorMsg = error || (
      `Invalid value of '${errorTrace}'. ` +
      'Expecting a single string or number value.'
    );
    const values = this.filterOptions.value;

    if (
      !Array.isArray(values)
      && typeof values !== 'string'
      && typeof values !== 'number'
    ) {
      this.errors.push(errorMsg);
      return null;
    }

    if (Array.isArray(values) && values.length > 1) {
      this.errors.push(errorMsg);
      return null;
    }

    if (Array.isArray(values)) {
      return values[0].trim().toLowerCase();
    }

    if (typeof values === 'string') {
      return values.trim().toLowerCase();
    }

    return values;
  }
}

export default Filter;
