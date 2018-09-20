
declare module 'objection/lib/utils/identifierMapping' {
  import { KnexMappers } from 'objection';

  type knexIdentifierMappersParams = {
    parse: (str: string) => string,
    format: (str: string) => string,
  }

  export const knexIdentifierMappers:
    (knexIdentifierMappersParams: knexIdentifierMappersParams) => KnexMappers
}
