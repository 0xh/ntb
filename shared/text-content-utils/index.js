import _sanitizeHtml from 'sanitize-html';
import he from 'he';


/**
 * Sanetize html string. Remove unnecessary and unallowed html formatting
 * @param {string} html  html string to sanetize
 */
export function sanitizeHtml(html) {
  const res = _sanitizeHtml(html)
    .replace(/\r?\n|\r/g, '') // remove line breaks
    .replace(/\u00a0/g, ' ') // replace nbsp-character
    .replace(/[\t ]+</g, '<') // remove space and tabs before tags
    .replace(/>[\t ]+</g, '><') // remove whitespace between tags
    .replace(/>[\t ]+$/g, '>') // remove whitespace after tags
    .replace(/\s+/g, ' ') // replace multiple spaces into a single space
    .trim();
  return res;
}


/**
 * Strips all html-tags and converts any htmlentities from string
 * @param {string} html   html string to strip
 */
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
