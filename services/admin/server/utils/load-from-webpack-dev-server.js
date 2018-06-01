import http from 'http';


export default function (path) {
  const promise = new Promise((resolve, reject) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log(`http://admin-client:3000/${path}`);  // eslint-disable-line
    http.get(`http://admin-client:3000/${path}`, (res) => {
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        resolve(rawData);
      });
    }).on('error', (e) => {
      throw e;
    });
  });

  return promise;
}
