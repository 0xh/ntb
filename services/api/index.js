import express from 'express';
import type

const app: express$Application = express();


app.get('/', (req: express$Request, res: express$Response) => {
  res.send('Hello world!');
});

app.get('/')


app.listen('3000', () => console.log('Example app listening on port 3000!'));
