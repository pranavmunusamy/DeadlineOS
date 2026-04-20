/**
 * DeadlineOS - Gmail Integration Service v2
 * Upgraded: smarter query filters, deeper parsing,
 * better HTML extraction for LMS emails, date-range lookback.
 */

const { google } = require('googleapis');
const { createAuthenticatedClient } = require('../config/google');

/**
 * Build a Gmail search query that targets academic / deadline emails.
 * Casts a wider net than just inbox — includes labels and categories.
 */
function buildSearchQuery(options = {}) {
  const { daysBack = 30, customQuery } = options;

  if (customQuery) return customQuery;

  // Date range: look back N days
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const afterDate = `${since.getFullYear()}/${String(since.getMonth() + 1).padStart(2, '0')}/${String(since.getDate()).padStart(2, '0')}`;

  // Search terms that target deadline-containing emails
  const deadlineTerms = [
    'due', 'deadline', 'submit', 'assignment', 'homework',
    'quiz', 'exam', 'project', 'paper', 'essay',
    'submission', 'turn in', 'last date', 'expires',
    'available until', 'closes',
  ].join(' OR ');

  // Also catch LMS notification subjects
  const lmsTerms = [
    'subject:assignment', 'subject:reminder', 'subject:deadline',
    'subject:submission', 'subject:quiz', 'subject:exam',
    'subject:homework', 'subject:announcement',
  ].join(' OR ');

  return `after:${afterDate} {${deadlineTerms} ${lmsTerms}}`;
}

async function fetchEmails(tokens, maxResults = 50, options = {}) {
  const authClient = createAuthenticatedClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth: authClient });

  const query = buildSearchQuery(options);
  const cappedMax = Math.min(maxResults, 200); // Allow up to 200

  // Paginate if needed (Gmail returns max 100 per page)
  let allMessages = [];
  let pageToken = null;

  do {
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: Math.min(cappedMax - allMessages.length, 100),
      q: query,
      pageToken,
    });

    const messages = listResponse.data.messages || [];
    allMessages = allMessages.concat(messages);
    pageToken = listResponse.data.nextPageToken;
  } while (pageToken && allMessages.length < cappedMax);

  if (allMessages.length === 0) return [];

  // Fetch full email details in parallel batches (5 at a time)
  const emails = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < allMessages.length; i += BATCH_SIZE) {
    const batch = allMessages.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((msg) =>
        gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        })
      )
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const parsed = parseEmailMessage(result.value.data);
        if (parsed) emails.push(parsed);
      }
    }
  }

  return emails;
}

function parseEmailMessage(message) {
  const headers = message.payload?.headers || [];
  const subject = getHeader(headers, 'Subject') || '(No Subject)';
  const from = getHeader(headers, 'From') || '';
  const date = getHeader(headers, 'Date') || '';
  const to = getHeader(headers, 'To') || '';

  const body = extractBody(message.payload);

  return {
    messageId: message.id,
    subject,
    from,
    to,
    date,
    body: body.substring(0, 8000), // Increased from 5000 for LMS emails
  };
}

function getHeader(headers, name) {
  const header = headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header ? header.value : null;
}

/**
 * Improved body extraction that handles:
 * - Deeply nested multipart messages (Canvas, Blackboard, Moodle)
 * - Prefers plain text, falls back to cleaned HTML
 * - Recursively searches all parts
 */
function extractBody(payload) {
  if (!payload) return '';

  // Direct body data
  if (payload.body?.data) {
    const decoded = decodeBase64(payload.body.data);
    if (payload.mimeType === 'text/html') return stripHtml(decoded);
    return decoded;
  }

  if (!payload.parts) return '';

  // Collect all text parts recursively
  const textParts = [];
  const htmlParts = [];

  function collectParts(parts) {
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        textParts.push(decodeBase64(part.body.data));
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        htmlParts.push(decodeBase64(part.body.data));
      }
      // Recurse into nested multipart
      if (part.parts) {
        collectParts(part.parts);
      }
    }
  }

  collectParts(payload.parts);

  // Prefer plain text
  if (textParts.length > 0) {
    return textParts.join('\n');
  }

  // Fall back to HTML → stripped text
  if (htmlParts.length > 0) {
    return stripHtml(htmlParts.join('\n'));
  }

  return '';
}

function decodeBase64(encoded) {
  try {
    const sanitized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(sanitized, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

/**
 * Improved HTML stripper that preserves meaningful structure
 * from LMS emails (tables, lists, etc.)
 */
function stripHtml(html) {
  return html
    // Preserve line breaks from structural elements
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<td[^>]*>/gi, ' | ') // Table cells → pipe-separated
    .replace(/<li[^>]*>/gi, '- ') // List items → dashes
    // Strip remaining tags
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    // Decode entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    // Clean up whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { fetchEmails, parseEmailMessage, buildSearchQuery };
