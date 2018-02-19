import fs from 'fs';
import path from 'path';

// Nodehun is in a special file format and eslint does not recognize it
import Nodehun from 'nodehun'; // eslint-disable-line


const DICTIONARY_NAMES = ['nb', 'nn', 'en_us', 'en_gb'];


const dictionaries = {};
const stopWords = {};
const cleanRegex = /^[^a-zA-Z\u00C0-\u017F0-9]+|[^a-zA-Z\u00C0-\u017F0-9]+$/gi;


// Load each dictionary and stop words list to memory
DICTIONARY_NAMES.forEach((name) => {
  const affbuf = fs.readFileSync(path.resolve(
    __dirname, 'dictionaries', `${name}.aff`,
  ));
  const dictbuf = fs.readFileSync(path.resolve(
    __dirname, 'dictionaries', `${name}.dic`,
  ));

  dictionaries[name] = new Nodehun(affbuf, dictbuf);

  const buf = fs.readFileSync(path.resolve(
    __dirname, 'stop-words', `${name}.txt`
  ), 'utf-8');
  const sw = buf.split('\n').map((w) => w.trim());
  stopWords[name] = sw;
});


/**
 * Return Nodehun instance of the named dictionary
 */
export default function getDictionary(dictionaryName) {
  return dictionaries[dictionaryName];
}


/**
 * Clean word of leading and trailing dots, dashes and so on
 */
export function cleanWord(word) {
  return word.replace(cleanRegex, '').trim();
}


/**
 * Clean words of leading and trailing dots, dashes and so on
 */
export function cleanWords(words) {
  return words
    .map((w) => w.replace(cleanRegex, '').trim())
    .filter((w) => w.length);
}


/**
 * Remove stop words by using the named dictionary
 */
export function clearStopWords(dictionaryName, words) {
  return words.filter((w) => !stopWords[dictionaryName].includes(w));
}


/**
 * Stem each word using Hunspell
 */
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
