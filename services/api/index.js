// @flow

import express from 'express';


const app: express$Application = express();


app.get('/', (req: express$Request, res: express$Response) => {
  res.send('Hello world!');
});


app.listen('3000', () => console.log('Example app listening on port 3000!'));
