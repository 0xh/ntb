import _sanitizeHtml from 'sanitize-html';

import { cleanWord, stemAll } from '@turistforeningen/ntb-shared-hunspell';


export function sanitizeHtml(html) {
  return _sanitizeHtml(html);
}


export async function processContent(html) {
  const res = {};

  if (!html) {
    return res;
  }

  res.sanitized = _sanitizeHtml(html);
  res.plain = res.sanitized
    .replace(/<{1}[^<>]{1,}>{1}/g, ' ') // replace html-tags
    .replace(/\u00a0/g, ' ') // replace nbsp-character
    .trim();
  res.words = Array.from(new Set(
    res.plain
      .split(' ')
      .map((w) => cleanWord(w.toLowerCase()))
      .filter((w) => w)
  ));
  res.stemmed = await stemAll('nb', res.words);

  return res;
}
