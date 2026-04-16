/**
 * DeadlineOS - Deadline Extraction Engine
 * Parses email subject + body to extract task titles and deadline dates.
 * Discards emails where no valid date is found.
 */

const DEADLINE_KEYWORDS = [
  'due',
  'deadline',
  'submit by',
  'last date',
  'due date',
  'submission date',
  'turn in by',
  'must be submitted',
  'due on',
  'expires',
  'expiry',
  'due before',
];

const MONTH_MAP = {
  january: 0, february: 1, march: 2, april: 3,
  may: 4, june: 5, july: 6, august: 7,
  september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3,
  jun: 5, jul: 6, aug: 7, sep: 8, sept: 8,
  oct: 9, nov: 10, dec: 11,
};

// Regex patterns for date extraction (ordered by specificity)
const DATE_PATTERNS = [
  // "March 15, 2026" or "Mar 15 2026"
  {
    regex: /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?\b/gi,
    parse: (match) => {
      const month = MONTH_MAP[match[1].toLowerCase()];
      const day = parseInt(match[2], 10);
      const year = match[3] ? parseInt(match[3], 10) : inferYear(month, day);
      return createDate(year, month, day);
    },
  },
  // "15 March 2026" or "15th March"
  {
    regex: /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec),?\s*(\d{4})?\b/gi,
    parse: (match) => {
      const day = parseInt(match[1], 10);
      const month = MONTH_MAP[match[2].toLowerCase()];
      const year = match[3] ? parseInt(match[3], 10) : inferYear(month, day);
      return createDate(year, month, day);
    },
  },
  // "MM/DD/YYYY" or "MM-DD-YYYY"
  {
    regex: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g,
    parse: (match) => {
      const first = parseInt(match[1], 10);
      const second = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      // Heuristic: if first > 12, treat as DD/MM; else MM/DD
      if (first > 12) return createDate(year, second - 1, first);
      return createDate(year, first - 1, second);
    },
  },
  // "MM/DD" or "DD/MM" (no year)
  {
    regex: /\b(\d{1,2})[\/\-](\d{1,2})\b/g,
    parse: (match) => {
      const first = parseInt(match[1], 10);
      const second = parseInt(match[2], 10);
      let month, day;
      if (first > 12) {
        day = first;
        month = second - 1;
      } else {
        month = first - 1;
        day = second;
      }
      const year = inferYear(month, day);
      return createDate(year, month, day);
    },
  },
  // "YYYY-MM-DD" (ISO format)
  {
    regex: /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    parse: (match) => {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return createDate(year, month, day);
    },
  },
];

function inferYear(month, day) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const candidate = new Date(currentYear, month, day);
  // If the date has already passed, assume next year
  if (candidate < now) return currentYear + 1;
  return currentYear;
}

function createDate(year, month, day) {
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const date = new Date(year, month, day, 23, 59, 59);
  if (isNaN(date.getTime())) return null;
  // Reject dates more than 1 year in the future or in the distant past
  const now = new Date();
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  if (date > oneYearFromNow || date.getFullYear() < now.getFullYear() - 1) return null;
  return date;
}

function extractDatesFromText(text) {
  const dates = [];
  for (const pattern of DATE_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(text)) !== null) {
      const date = pattern.parse(match);
      if (date) dates.push(date);
    }
  }
  return dates;
}

function hasDeadlineKeyword(text) {
  const lower = text.toLowerCase();
  return DEADLINE_KEYWORDS.some((kw) => lower.includes(kw));
}

function extractTaskTitle(subject, body) {
  // Clean subject line: remove "Re:", "Fwd:", etc.
  let title = subject.replace(/^(re:|fwd?:|fw:)\s*/gi, '').trim();
  // If subject is too generic, try extracting from body context
  if (title.length < 5) {
    const lines = body.split('\n').filter((l) => l.trim().length > 10);
    if (lines.length > 0) {
      title = lines[0].trim().substring(0, 100);
    }
  }
  // Cap title length
  return title.substring(0, 200);
}

/**
 * Main extraction function.
 * Returns null if no valid deadline date is found.
 */
function extractDeadline(email) {
  const { subject = '', body = '', from = '', messageId = '' } = email;
  const fullText = `${subject} ${body}`;

  if (!hasDeadlineKeyword(fullText)) return null;

  const dates = extractDatesFromText(fullText);
  if (dates.length === 0) return null;

  // Pick the earliest future date as the deadline
  const now = new Date();
  const futureDates = dates.filter((d) => d >= now);
  const deadline = futureDates.length > 0
    ? futureDates.sort((a, b) => a - b)[0]
    : dates.sort((a, b) => a - b)[0];

  const title = extractTaskTitle(subject, body);
  if (!title) return null;

  return {
    title,
    deadline,
    source: 'email',
    sourceEmail: {
      subject: subject.substring(0, 300),
      from: from.substring(0, 200),
      messageId,
    },
  };
}

/**
 * Process an array of emails and return extracted tasks.
 * Discards emails without valid deadlines.
 */
function extractDeadlinesFromEmails(emails) {
  const tasks = [];
  const seenMessageIds = new Set();

  for (const email of emails) {
    if (seenMessageIds.has(email.messageId)) continue;
    seenMessageIds.add(email.messageId);

    const extracted = extractDeadline(email);
    if (extracted) tasks.push(extracted);
  }

  return tasks;
}

module.exports = {
  extractDeadline,
  extractDeadlinesFromEmails,
  extractDatesFromText,
  hasDeadlineKeyword,
  extractTaskTitle,
};
