import path from 'path';

import { knexConfig } from '@ntb/shared-db-utils';


const config = {
  ...knexConfig,
  migrations: {
    directory: path.resolve(__dirname, 'migrate', 'migrations'),
  },
};


module.exports = {
  development: { ...config },
  staging: { ...config },
  production: { ...config },
};
