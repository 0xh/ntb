import { ApiFilter } from '@ntb/models/Document';


export type requestValue = string | string[] | number | boolean;

export interface RequestParameter {
  rawKey: string;
  rawKeys: string[];
  rawValue: requestValue;
  errorTrace: string;
  key: string;
  keys: string[];
  firstKey: string;
  value: requestValue;
}

export interface RequestParameters {
  [key: string]: RequestParameter;
}

export type Operator = '$and' | '$or';
type OperatorRequestFilters = [Operator, RequestFilters];
export interface RequestFilters extends Array<RequestFilter> {}
export type RequestFilter = RequestParameter | OperatorRequestFilters;

type OperatorQueryFilters<T> = [Operator, QueryFilters<T>];
export interface QueryFilters<T> extends Array<QueryFilterItem<T>> {}
type QueryFilterItem<T> = T | OperatorQueryFilters<T>;

export interface FilterOptions extends ApiFilter {
  attribute?: string;
  snakeCasedAttribute?: string;
  isSelf?: boolean;
  isJoin?: boolean;
  isRelation?: boolean;
  relationName?: string;
  value: requestValue;
  errorTrace: string;
}

export type orderValue = [string, 'ASC' | 'DESC'];
export type orderValues = orderValue[];

type joinRelationType = 'inner' | 'left';
interface JoinRelation {
  key: string;
  type: joinRelationType;
}
interface JoinRelationIndex {
  [key: string]: joinRelationType;
}

export interface QueryOptions {
  limit: number | null;
  offset: number | null;
  order: orderValues | null;
  attributes: Set<string>;
  relations: JoinRelation[];
  relationIndex: JoinRelationIndex;
  filters: QueryFilters<QueryFilterOption>;
  fullTextJoin: null | [string, [string]];
}


export interface QueryFilterOption {
  whereType:
    | 'where'
    | 'whereBetween'
    | 'whereIn'
    | 'whereNotIn'
    | 'whereNull'
    | 'whereNotNull'
    | 'whereRaw';
  options: (string | string[] | number)[];
}


export interface DbQueryRow {
  [key: string]: any;
}


export interface DbPaginatedQueryResult {
  limit: number;
  offset: number;
  count: number;
  rows: DbQueryRow[];
}

export type DbQueryResult = DbPaginatedQueryResult | DbQueryRow;
