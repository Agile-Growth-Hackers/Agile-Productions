import DOMPurify from 'dompurify';

/**
 * Clean and sanitize HTML content for safe rendering
 * - Removes empty paragraphs (<p></p>, <p> </p>, etc.)
 * - Sanitizes content with DOMPurify
 * - Returns empty string if content is effectively empty
 *
 * @param {string} htmlContent - The HTML content to clean
 * @param {string} fallback - Fallback content if htmlContent is empty
 * @returns {string} Cleaned and sanitized HTML
 */
export function cleanHtmlContent(htmlContent, fallback = '') {
  if (!htmlContent && !fallback) return '';

  const content = htmlContent || fallback;

  // Sanitize first
  let cleaned = DOMPurify.sanitize(content);

  // Remove empty paragraphs and whitespace-only paragraphs
  cleaned = cleaned
    .replace(/<p><\/p>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<p>&nbsp;<\/p>/gi, '')
    .trim();

  // If after cleaning we only have empty tags, return empty string
  if (!cleaned || cleaned === '<p></p>' || cleaned === '<br>' || cleaned === '<br/>') {
    return '';
  }

  return cleaned;
}

/**
 * Prepare HTML content for dangerouslySetInnerHTML
 * Returns an object with __html property
 *
 * @param {string} htmlContent - The HTML content to prepare
 * @param {string} fallback - Fallback content if htmlContent is empty
 * @returns {object} Object with __html property
 */
export function prepareHtml(htmlContent, fallback = '') {
  return { __html: cleanHtmlContent(htmlContent, fallback) };
}

/**
 * Strip all HTML tags from content
 * Useful for fields that should be plain text but might have been edited with rich text editor
 *
 * @param {string} content - The content to strip HTML from
 * @param {string} fallback - Fallback content if content is empty
 * @returns {string} Plain text without HTML tags
 */
export function stripHtmlTags(content, fallback = '') {
  if (!content && !fallback) return '';

  const text = content || fallback;

  // Create a temporary div to convert HTML to text
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;

  // Get text content and trim whitespace
  return tempDiv.textContent || tempDiv.innerText || '';
}
