/**
 * Rich Text Sanitiser for GrievEase Notices
 * Strictly enforces an allow-list:
 * - Allowed tags: <b>, <strong>, <i>, <em>, <u>, <p>, <br>, <ul>, <ol>, <li>, <a>, <h3>, <h4>, <blockquote>
 * - Blocked tags: <script>, <iframe>, <object>, <embed>, <form>, <input>, <style>, <img>, etc.
 * - Allowed attributes: <a> href (only http/https/mailto, with target="_blank" rel="noopener noreferrer")
 * - Strips all event handlers (onclick, onload, onerror, etc.)
 * - Zero third-party runtime dependencies.
 */

export function sanitizeNoticeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input;

  // 1. Remove dangerous script, iframe, style, object, embed, svg tags and their contents
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  sanitized = sanitized.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

  // 2. Remove inline event handlers (e.g. onload=, onclick=, onerror=)
  sanitized = sanitized.replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 3. Remove javascript: and data: URLs
  sanitized = sanitized.replace(/href\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, 'href="#"');
  sanitized = sanitized.replace(/href\s*=\s*(?:'data:[^']*'|"data:[^"]*"|data:[^\s>]+)/gi, 'href="#"');

  // 4. Remove remote and inline images (per specification: block remote images)
  sanitized = sanitized.replace(/<img\b[^>]*>/gi, '');

  // 5. Allow-list tag filtering
  // Permitted tags: p, br, b, strong, i, em, u, ul, ol, li, h3, h4, blockquote, a
  const allowedTags = new Set([
    'p', '/p',
    'br', 'br/',
    'b', '/b',
    'strong', '/strong',
    'i', '/i',
    'em', '/em',
    'u', '/u',
    'ul', '/ul',
    'ol', '/ol',
    'li', '/li',
    'h3', '/h3',
    'h4', '/h4',
    'blockquote', '/blockquote',
  ]);

  // Parse and sanitize <a> tags specifically to enforce safe href
  sanitized = sanitized.replace(/<a\b([^>]*)>(.*?)<\/a>/gi, (_match, attrs, content) => {
    const hrefMatch = attrs.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = hrefMatch ? (hrefMatch[1] || hrefMatch[2] || hrefMatch[3]) : '#';

    // Validate href protocol (http, https, or mailto)
    if (/^(https?:\/\/|mailto:)/i.test(href)) {
      const cleanHref = href.replace(/[<>"']/g, '');
      return `<a href="${cleanHref}" target="_blank" rel="noopener noreferrer">${content}</a>`;
    }
    return content; // If invalid URL, strip the anchor tag and preserve inner text
  });

  // Strip any other unapproved opening or closing tags
  sanitized = sanitized.replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (match, tagName) => {
    const lowerTag = tagName.toLowerCase();
    if (lowerTag === 'a') {
      return match; // already sanitized in step 5
    }
    if (allowedTags.has(lowerTag) || allowedTags.has('/' + lowerTag)) {
      return match.startsWith('</') ? `</${lowerTag}>` : `<${lowerTag}>`;
    }
    return '';
  });

  return sanitized.trim();
}
