/**
 * sanitize.ts
 * Utility functions for client-side input sanitization.
 * Prevents XSS vectors introduced via user-generated or AI-generated content.
 */

/**
 * Validates that a URL is safe to use as an image src.
 * Blocks javascript:, data:text/html, vbscript: and other non-image protocols.
 *
 * @param url - The URL string to validate
 * @returns The original URL if safe, or an empty string if dangerous
 */
export function sanitizeImageUrl(url: string | null | undefined): string {
  if (!url) return "";

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Relative URLs are safe (no protocol to exploit)
    return url.startsWith("/") || url.startsWith("./") ? url : "";
  }

  const allowedProtocols = new Set(["https:", "http:"]);
  if (!allowedProtocols.has(parsed.protocol)) {
    return "";
  }

  // Block unstable Pollinations URLs — they frequently break
  if (parsed.hostname.includes("pollinations.ai")) {
    return "";
  }

  return url;
}

/**
 * Strips all HTML tags from a string, returning plain text.
 * Use this when rendering user-provided content in non-HTML contexts
 * (e.g., meta tags, aria-labels, console output).
 *
 * @param html - String potentially containing HTML tags
 * @returns Plain text string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
