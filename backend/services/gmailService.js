/**
 * DeadlineOS - Gmail Integration Service
 * Fetches and parses emails from Gmail API (read-only scope).
 * Only extracts subject, body text, sender, and messageId.
 * Does NOT store raw email data.
 */

const { google } = require('googleapis');
const { createAuthenticatedClient } = require('../config/google');

async function fetchEmails(tokens, maxResults = 50) {
  const authClient = createAuthenticatedClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth: authClient });

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    maxResults: Math.min(maxResults, 100),
    q: 'in:inbox',
  });

  const messages = listResponse.data.messages || [];
  if (messages.length === 0) return [];

  const emails = [];

  for (const msg of messages) {
    try {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const parsed = parseEmailMessage(detail.data);
      if (parsed) emails.push(parsed);
    } catch (err) {
      console.error(`Failed to fetch message ${msg.id}:`, err.message);
    }
  }

  return emails;
}

function parseEmailMessage(message) {
  const headers = message.payload?.headers || [];
  const subject = getHeader(headers, 'Subject') || '(No Subject)';
  const from = getHeader(headers, 'From') || '';
  const date = getHeader(headers, 'Date') || '';

  const body = extractBody(message.payload);

  return {
    messageId: message.id,
    subject,
    from,
    date,
    body: body.substring(0, 5000), // Limit body size
  };
}

function getHeader(headers, name) {
  const header = headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header ? header.value : null;
}

function extractBody(payload) {
  if (!payload) return '';

  // Direct body data
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  // Multipart: look for text/plain first, then text/html
  if (payload.parts) {
    const textPart = payload.parts.find(
      (p) => p.mimeType === 'text/plain'
    );
    if (textPart?.body?.data) {
      return decodeBase64(textPart.body.data);
    }

    const htmlPart = payload.parts.find(
      (p) => p.mimeType === 'text/html'
    );
    if (htmlPart?.body?.data) {
      return stripHtml(decodeBase64(htmlPart.body.data));
    }

    // Nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
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

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { fetchEmails, parseEmailMessage };
