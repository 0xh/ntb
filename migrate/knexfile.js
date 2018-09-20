import path from 'path';

import { knexConfig } from '@ntb/db-utils';


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
