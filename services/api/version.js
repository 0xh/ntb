import fs from 'fs';
import path from 'path';

const tag = fs.readFileSync(path.resolve(__dirname, 'version-tag'), 'utf-8');
const version = { tag };


module.exports = version;
