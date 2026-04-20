/**
 * DeadlineOS - Deadline Extraction Engine v2
 * Major upgrade: relative dates, time-of-day, expanded keywords,
 * Canvas/LMS support, smarter title extraction.
 */

// ─── KEYWORD DETECTION ─────────────────────────────────────────────
// Three tiers: strong signals, moderate signals, and context-dependent

const STRONG_KEYWORDS = [
  'due', 'due date', 'due by', 'due on', 'due before',
  'deadline', 'submit by', 'submit before', 'submission date',
  'submission deadline', 'last date', 'turn in by', 'turn in before',
  'must be submitted', 'must submit', 'must be turned in',
  'final submission', 'late submission',
];

const MODERATE_KEYWORDS = [
  'expires', 'expiry', 'expiration', 'closes', 'closing date',
  'done by', 'complete by', 'completed by', 'finish by',
  'hand in by', 'hand in before', 'assignment due',
  'homework due', 'paper due', 'project due', 'lab due',
  'report due', 'essay due', 'quiz due',
  'exam on', 'exam date', 'test on', 'test date',
  'midterm on', 'midterm date', 'final on', 'final exam',
  'presentation on', 'presentation date',
  'available until', 'open until', 'closes on',
  'no later than', 'not later than', 'by end of day',
  'needs to be done', 'should be completed',
];

// LMS / Canvas / Blackboard / Moodle patterns
const LMS_KEYWORDS = [
  'assignment has been posted',
  'new assignment',
  'graded assignment',
  'quiz available', 'quiz opens', 'quiz closes',
  'course announcement', 'submission attempt',
  'is now available', 'has been published',
  'reminder:', 'upcoming:',
];

const ALL_KEYWORDS = [...STRONG_KEYWORDS, ...MODERATE_KEYWORDS, ...LMS_KEYWORDS];

// ─── MONTH MAP ──────────────────────────────────────────────────────

const MONTH_MAP = {
  january: 0, february: 1, march: 2, april: 3,
  may: 4, june: 5, july: 6, august: 7,
  september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3,
  jun: 5, jul: 6, aug: 7, sep: 8, sept: 8,
  oct: 9, nov: 10, dec: 11,
};

const DAY_MAP = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
  sun: 0, mon: 1, tue: 2, tues: 2, wed: 3,
  thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6,
};

// ─── ABSOLUTE DATE PATTERNS ─────────────────────────────────────────

const MONTH_NAMES = 'january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec';

const ABSOLUTE_DATE_PATTERNS = [
  // "March 15, 2026" or "Mar 15 2026" or "March 15th"
  {
    regex: new RegExp(`\\b(${MONTH_NAMES})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(\\d{4})?\\b`, 'gi'),
    parse: (match) => {
      const month = MONTH_MAP[match[1].toLowerCase()];
      const day = parseInt(match[2], 10);
      const year = match[3] ? parseInt(match[3], 10) : inferYear(month, day);
      return createDate(year, month, day);
    },
  },
  // "15 March 2026" or "15th March"
  {
    regex: new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_NAMES}),?\\s*(\\d{4})?\\b`, 'gi'),
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
      if (first > 12) return createDate(year, second - 1, first);
      return createDate(year, first - 1, second);
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
  // "MM/DD" or "DD/MM" (no year)
  {
    regex: /\b(\d{1,2})[\/\-](\d{1,2})\b/g,
    parse: (match) => {
      const first = parseInt(match[1], 10);
      const second = parseInt(match[2], 10);
      let month, day;
      if (first > 12) { day = first; month = second - 1; }
      else { month = first - 1; day = second; }
      const year = inferYear(month, day);
      return createDate(year, month, day);
    },
  },
];

// ─── RELATIVE DATE PATTERNS ─────────────────────────────────────────

const DAY_NAMES = 'sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat';

const RELATIVE_PATTERNS = [
  // "tomorrow"
  {
    regex: /\btomorrow\b/gi,
    resolve: () => offsetDays(1),
  },
  // "today"
  {
    regex: /\btoday\b/gi,
    resolve: () => offsetDays(0),
  },
  // "tonight"
  {
    regex: /\btonight\b/gi,
    resolve: () => offsetDays(0),
  },
  // "day after tomorrow"
  {
    regex: /\bday after tomorrow\b/gi,
    resolve: () => offsetDays(2),
  },
  // "this Friday", "this Monday"
  {
    regex: new RegExp(`\\bthis\\s+(${DAY_NAMES})\\b`, 'gi'),
    resolve: (match) => nextWeekday(DAY_MAP[match[1].toLowerCase()], false),
  },
  // "next Friday", "next Monday"
  {
    regex: new RegExp(`\\bnext\\s+(${DAY_NAMES})\\b`, 'gi'),
    resolve: (match) => nextWeekday(DAY_MAP[match[1].toLowerCase()], true),
  },
  // "on Friday", "by Monday" (standalone day name after a keyword)
  {
    regex: new RegExp(`\\b(?:on|by|before)\\s+(${DAY_NAMES})\\b`, 'gi'),
    resolve: (match) => nextWeekday(DAY_MAP[match[1].toLowerCase()], false),
  },
  // "in X days" / "in X day"
  {
    regex: /\bin\s+(\d{1,2})\s+days?\b/gi,
    resolve: (match) => offsetDays(parseInt(match[1], 10)),
  },
  // "within X days"
  {
    regex: /\bwithin\s+(\d{1,2})\s+days?\b/gi,
    resolve: (match) => offsetDays(parseInt(match[1], 10)),
  },
  // "in a week" / "in one week"
  {
    regex: /\bin\s+(?:a|one|1)\s+weeks?\b/gi,
    resolve: () => offsetDays(7),
  },
  // "in 2 weeks" / "in two weeks"
  {
    regex: /\bin\s+(?:two|2)\s+weeks?\b/gi,
    resolve: () => offsetDays(14),
  },
  // "next week"
  {
    regex: /\bnext\s+week\b/gi,
    resolve: () => nextWeekday(5, true), // Default: next week Friday
  },
  // "end of the week" / "end of this week"
  {
    regex: /\bend\s+of\s+(?:the|this)\s+week\b/gi,
    resolve: () => nextWeekday(5, false), // This Friday
  },
  // "end of the month"
  {
    regex: /\bend\s+of\s+(?:the|this)\s+month\b/gi,
    resolve: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    },
  },
];

// ─── TIME-OF-DAY EXTRACTION ─────────────────────────────────────────

const TIME_PATTERNS = [
  // "11:59 PM", "5:00PM", "11:59pm", "5pm"
  /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM|a\.m\.|p\.m\.)\b/g,
  // "23:59", "17:00" (24-hour)
  /\b([01]?\d|2[0-3]):([0-5]\d)\b/g,
];

function extractTimeFromText(text) {
  for (const pattern of TIME_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const match = regex.exec(text);
    if (match) {
      let hour = parseInt(match[1], 10);
      const min = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3]?.toLowerCase().replace('.', '');

      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;

      if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
        return { hour, min };
      }
    }
  }
  return null; // Default: handled by caller
}

// ─── DATE HELPERS ───────────────────────────────────────────────────

function inferYear(month, day) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const candidate = new Date(currentYear, month, day);
  if (candidate < now) return currentYear + 1;
  return currentYear;
}

function createDate(year, month, day) {
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const date = new Date(year, month, day, 23, 59, 59);
  if (isNaN(date.getTime())) return null;
  const now = new Date();
  const limit = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  if (date > limit || date.getFullYear() < now.getFullYear() - 1) return null;
  return date;
}

function offsetDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(23, 59, 59, 0);
  return d;
}

function nextWeekday(target, forceNextWeek) {
  const now = new Date();
  const current = now.getDay();
  let daysAhead = target - current;
  if (daysAhead < 0 || (daysAhead === 0 && forceNextWeek)) daysAhead += 7;
  if (forceNextWeek && daysAhead < 7) daysAhead += 7;
  const d = new Date(now);
  d.setDate(d.getDate() + daysAhead);
  d.setHours(23, 59, 59, 0);
  return d;
}

// ─── EXTRACTION FUNCTIONS ───────────────────────────────────────────

function extractDatesFromText(text) {
  const dates = [];

  // 1. Absolute dates
  for (const pattern of ABSOLUTE_DATE_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const date = pattern.parse(match);
      if (date) dates.push(date);
    }
  }

  // 2. Relative dates
  for (const pattern of RELATIVE_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const date = pattern.resolve(match);
      if (date) dates.push(date);
    }
  }

  return dates;
}

function hasDeadlineKeyword(text) {
  const lower = text.toLowerCase();
  return ALL_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Smarter title extraction.
 * Tries to pull a meaningful title from subject and body context.
 */
function extractTaskTitle(subject, body) {
  // Clean subject: strip Re:, Fwd:, [COURSE], notification prefixes (loop for chained)
  let title = subject;
  let prev = '';
  while (prev !== title) {
    prev = title;
    title = title.replace(/^(re:|fwd?:|fw:)\s*/gi, '').replace(/^\[.*?\]\s*/g, '').trim();
  }

  // If subject is a generic LMS notification, try to extract from body
  const genericSubjects = [
    'reminder', 'notification', 'update', 'announcement',
    'new assignment', 'course announcement', 'submission',
    'alert', 'action required',
  ];
  const titleLower = title.toLowerCase();
  const isGeneric = title.length < 8 || genericSubjects.some((g) => titleLower === g || titleLower.startsWith(g + ':'));

  if (isGeneric) {
    // Look for a meaningful line in the body
    const lines = body.split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 10 && l.length < 200);

    // Prefer lines that mention assignments, courses, etc.
    const goodLine = lines.find((l) => {
      const ll = l.toLowerCase();
      return /assignment|homework|project|paper|essay|quiz|exam|test|lab|report|presentation/i.test(ll);
    });

    if (goodLine) {
      title = goodLine.substring(0, 150);
    } else if (lines.length > 0) {
      // Use first substantial line as title
      title = lines[0].substring(0, 150);
    }
  }

  // Clean up: remove trailing punctuation, limit length
  title = title.replace(/[.,:;!?]+$/, '').trim();
  return title.substring(0, 200) || subject.substring(0, 200);
}

/**
 * Extract confidence score for the extraction (0-100).
 * Higher = more likely this is a real deadline.
 */
function getConfidence(text, dates) {
  let score = 0;
  const lower = text.toLowerCase();

  // Strong keyword: +40
  if (STRONG_KEYWORDS.some((kw) => lower.includes(kw))) score += 40;
  // Moderate keyword: +25
  else if (MODERATE_KEYWORDS.some((kw) => lower.includes(kw))) score += 25;
  // LMS keyword: +20
  else if (LMS_KEYWORDS.some((kw) => lower.includes(kw))) score += 20;

  // Date found: +30
  if (dates.length > 0) score += 30;

  // Date is in the future: +15
  const now = new Date();
  if (dates.some((d) => d > now)) score += 15;

  // Academic sender (edu domain): +10
  if (/\.edu/i.test(text)) score += 10;

  // Course code present (e.g., CS301, ENG201): +5
  if (/\b[A-Z]{2,4}\s?\d{3,4}\b/.test(text)) score += 5;

  return Math.min(100, score);
}

// ─── MAIN EXTRACTION ────────────────────────────────────────────────

/**
 * Main extraction function.
 * Returns null if no valid deadline is found.
 * Now includes confidence scoring and time-of-day.
 */
function extractDeadline(email) {
  const { subject = '', body = '', from = '', messageId = '' } = email;
  const fullText = `${subject} ${body}`;

  if (!hasDeadlineKeyword(fullText)) return null;

  const dates = extractDatesFromText(fullText);
  if (dates.length === 0) return null;

  // Pick the earliest future date
  const now = new Date();
  const futureDates = dates.filter((d) => d >= now);
  let deadline = futureDates.length > 0
    ? futureDates.sort((a, b) => a - b)[0]
    : dates.sort((a, b) => a - b)[0];

  // Apply time-of-day if found
  const time = extractTimeFromText(fullText);
  if (time) {
    deadline = new Date(deadline);
    deadline.setHours(time.hour, time.min, 0, 0);
  }

  const title = extractTaskTitle(subject, body);
  if (!title) return null;

  const confidence = getConfidence(fullText, dates);

  return {
    title,
    deadline,
    source: 'email',
    confidence,
    sourceEmail: {
      subject: subject.substring(0, 300),
      from: from.substring(0, 200),
      messageId,
    },
  };
}

/**
 * Process an array of emails and return extracted tasks.
 * Filters low-confidence extractions (below 30).
 */
function extractDeadlinesFromEmails(emails) {
  const tasks = [];
  const seenMessageIds = new Set();

  for (const email of emails) {
    if (seenMessageIds.has(email.messageId)) continue;
    seenMessageIds.add(email.messageId);

    const extracted = extractDeadline(email);
    if (extracted && extracted.confidence >= 30) {
      tasks.push(extracted);
    }
  }

  // Sort by confidence descending (most certain first)
  return tasks.sort((a, b) => b.confidence - a.confidence);
}

module.exports = {
  extractDeadline,
  extractDeadlinesFromEmails,
  extractDatesFromText,
  hasDeadlineKeyword,
  extractTaskTitle,
  extractTimeFromText,
  getConfidence,
};
