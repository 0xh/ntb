import settings from '@turistforeningen/ntb-shared-settings';

const environment = {
  production: settings.NODE_ENV === 'production',
  development: settings.NODE_ENV === 'development',
  test: settings.NODE_ENV === 'test',
};


environment.ifProduction = (a, b) => (environment.production ? a : b);
environment.ifDevelopment = (a, b) => (environment.development ? a : b);
environment.ifTest = (a, b) => (environment.test ? a : b);


export default environment;
