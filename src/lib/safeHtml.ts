import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'a','b','blockquote','br','code','div','em','figure','figcaption','h1','h2','h3','h4','h5','h6',
  'hr','i','img','li','ol','p','pre','span','strong','sub','sup','table','tbody','td','tfoot',
  'th','thead','tr','u','ul','iframe','video','source','audio','small','mark','article','section','header','footer'
];

const ALLOWED_ATTR = [
  'href','src','alt','title','target','rel','class','style','width','height','colspan','rowspan',
  'allow','allowfullscreen','frameborder','controls','poster','loading','referrerpolicy','type'
];

export const sanitizeHtml = (raw: string): string => {
  if (typeof window === 'undefined') return '';
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ['script', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
    ALLOW_DATA_ATTR: false,
  });
};
