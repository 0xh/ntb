import _sanitizeHtml from 'sanitize-html';
import he from 'he';


export function sanitizeHtml(html) {
  return _sanitizeHtml(html);
}


export function stripHtml(html) {
  let res = html
    .replace(/<{1}[^<>]{1,}>{1}/g, ' '); // replace html-tags

  // Decode htmlentities
  res = he.decode(res);

  // Remove spaces, newlines and tabs
  res = res
    .replace(/\u00a0/g, ' ') // replace nbsp-character
    .replace(/\r?\n|\r/g, '') // remove line breaks
    .replace(/\s\s+/g, ' ') // replace tabs and spaces with single space
    .trim();

  return res;
}
