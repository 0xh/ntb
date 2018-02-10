import fs from 'fs';
import path from 'path';

import Nodehun from 'nodehun';


const dictionaries = {};
const stopWords = {};
const cleanRegex = /^[^a-zA-Z\u00C0-\u017F0-9]+|[^a-zA-Z\u00C0-\u017F0-9]+$/gi;


export default function getDictionary(dictionaryName) {
  if (!dictionaries[dictionaryName]) {
    const affbuf = fs.readFileSync(path.resolve(
      __dirname, 'dictionaries', `${dictionaryName}.aff`,
    ));
    const dictbuf = fs.readFileSync(path.resolve(
      __dirname, 'dictionaries', `${dictionaryName}.dic`,
    ));

    dictionaries[dictionaryName] = new Nodehun(affbuf, dictbuf);
  }

  return dictionaries[dictionaryName];
}


export function cleanWord(word) {
  return word.replace(cleanRegex, '').trim();
}


export function cleanWords(words) {
  return words
    .map((w) => w.replace(cleanRegex, '').trim())
    .filter((w) => w.length);
}


export function clearStopWords(dictionaryName, words) {
  if (!stopWords[dictionaryName]) {
    const buf = fs.readFileSync(path.resolve(
      __dirname, 'stop-words', `${dictionaryName}.txt`
    ), 'utf-8');
    const sw = buf.split('\n').map((w) => w.trim());
    stopWords[dictionaryName] = sw;
  }

  return words.filter((w) => !stopWords[dictionaryName].includes(w));
}


export async function stemAll(dictionaryName, words, _clearStopWords = true) {
  const dict = getDictionary(dictionaryName);
  let stemmed = [];
  await Promise.all(
    words.map((w) => (
      new Promise((resolve, reject) => {
        dict.stem(w, (err, stem) => {
          if (err) {
            reject(err);
          }
          else {
            if (stem.length) {
              stemmed = stemmed.concat(stem);
            }
            else {
              stemmed.push(w);
            }
            resolve();
          }
        });
      })
    ))
  );

  if (_clearStopWords) {
    stemmed = clearStopWords(dictionaryName, stemmed);
  }

  const result = Array.from(new Set(stemmed));
  return result;
}
