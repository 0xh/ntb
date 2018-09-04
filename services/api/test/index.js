import test from 'ava';

import db from '@ntb/shared-models';


test('foo', (t) => {
  t.pass();
});


test('bar', async (t) => {
  const bar = Promise.resolve('bar');

  t.is(await bar, 'bar');
});
