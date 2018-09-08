// Additional keywords to json schema from ajv-keywords and NTB-customs

import * as JsonSchema from 'json-schema';

type BuiltinDynamics =
  | 'timestamp'
  | 'datetime'
  | 'date'
  | 'time'
  | 'random'
  | 'randomint'
  | 'seq';

type DynamicDefault = BuiltinDynamics | string;
type DynamicDefaultWithArgs = { func: DynamicDefault, [key: string]: any };

interface KeywordAugmentations {
// From ajv-keywords
dynamicDefaults?: {
  [key: string]: DynamicDefault | DynamicDefaultWithArgs;
}

format?:
  | 'date'
  | 'time'
  | 'date-time'
  | 'uri'
  | 'uri-reference'
  | 'uri-template'
  | 'url'
  | 'email'
  | 'hostname'
  | 'ipv4'
  | 'ipv6'
  | 'regex'
  | 'uuid'
  | 'json-pointer'
  | 'relative-json-pointer';

// NTB custom keywords
readOnly?: boolean,
noApiReturn?: boolean,
availableForReferrers?: string[],

// define other keywords...

}

declare module 'objection' {
  export interface JsonSchema extends KeywordAugmentations { }
}
