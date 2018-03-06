import _sanitizeHtml from 'sanitize-html';


export function sanitizeHtml(html) {
  return _sanitizeHtml(html);
}


export function stripHtml(html) {
  return html
    .replace(/<{1}[^<>]{1,}>{1}/g, ' ') // replace html-tags
    .replace(/\u00a0/g, ' ') // replace nbsp-character
    .trim();
}
