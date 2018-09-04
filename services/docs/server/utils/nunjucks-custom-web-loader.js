import { nunjucks } from '@ntb/shared-web-server-utils';

import loadFromWebpackDevServer from './load-from-webpack-dev-server';


const { Loader } = nunjucks;


export default class NunjuckCustomWebLoader extends Loader {
  constructor() {
    super();
    this.async = true;
    this.baseURL = 'templates';
  }

  getSource(name, cb) {
    let result;
    try {
      loadFromWebpackDevServer(`${this.baseURL}/${name}`)
        .then((src) => {
          result = {
            src,
            path: name,
            noCache: !this.useCache,
          };
          if (cb) {
            cb(null, result);
          }
        });
    }
    catch (e) {
      console.log('UNABLE TO LOAD TEMPLATE FROM WEBPACK');
      console.log(e);
    }
  }
}
