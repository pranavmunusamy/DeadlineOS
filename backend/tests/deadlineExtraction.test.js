/**
 * DeadlineOS - Deadline Extraction Tests
 * Tests the core extraction engine with mock email data.
 * Run: node tests/deadlineExtraction.test.js
 */

const {
  extractDeadline,
  extractDeadlinesFromEmails,
  extractDatesFromText,
  hasDeadlineKeyword,
} = require('../services/deadlineExtractor');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

// ---------- MOCK EMAIL DATA ----------

const mockEmails = [
  {
    // Test 1: Standard assignment email with clear deadline
    messageId: 'msg_001',
    subject: 'CS301 - Assignment 3: Data Structures',
    from: 'prof.smith@university.edu',
    body: `Dear students,

Assignment 3 on Binary Trees and Graph Traversal has been posted.
Please complete all problems in Chapter 7.

Due date: April 25, 2026

Submit your work through the online portal.
Late submissions will not be accepted.

Best regards,
Professor Smith`,
  },
  {
    // Test 2: Email with DD/MM/YYYY format and multiple dates
    messageId: 'msg_002',
    subject: 'Research Paper Submission - ENG201',
    from: 'dr.jones@university.edu',
    body: `Hi class,

Your research paper topics were assigned on 03/15/2026.
The draft is due by 04/20/2026 and the final submission
deadline is 05/10/2026.

Please ensure proper APA formatting.

Dr. Jones`,
  },
  {
    // Test 3: Email with "submit by" keyword and written date format
    messageId: 'msg_003',
    subject: 'MATH205 - Final Project Guidelines',
    from: 'math.dept@university.edu',
    body: `Mathematics Department Notice

The final project for MATH205 must cover one of the approved topics.
Submit by May 1st, 2026.

Groups of up to 3 students are permitted.
Contact the TA office for questions.`,
  },
  {
    // Test 4: Edge case - No deadline present (should be discarded)
    messageId: 'msg_004',
    subject: 'Campus Newsletter - Spring 2026',
    from: 'newsletter@university.edu',
    body: `Welcome back to campus!

This week's events include:
- Basketball game on Friday
- Career fair in the Student Center
- Pizza night at the dorms

Have a great week!`,
  },
  {
    // Test 5: Edge case - Has date but no deadline keyword (should be discarded)
    messageId: 'msg_005',
    subject: 'Meeting notes from April 10, 2026',
    from: 'studygroup@gmail.com',
    body: `Here are the notes from our study session on April 10, 2026.
We covered chapters 5-7. Next meeting TBD.`,
  },
];

// ---------- TESTS ----------

console.log('\n=== DeadlineOS Extraction Engine Tests ===\n');

console.log('--- Keyword Detection ---');
assert(hasDeadlineKeyword('This is due tomorrow'), 'Detects "due" keyword');
assert(hasDeadlineKeyword('The deadline is Friday'), 'Detects "deadline" keyword');
assert(hasDeadlineKeyword('Submit by next week'), 'Detects "submit by" keyword');
assert(hasDeadlineKeyword('Last date for registration'), 'Detects "last date" keyword');
assert(!hasDeadlineKeyword('Hello, how are you?'), 'No false positive on normal text');

console.log('\n--- Date Extraction ---');
const dates1 = extractDatesFromText('Due date: April 25, 2026');
assert(dates1.length > 0, 'Extracts "Month DD, YYYY" format');
assert(dates1[0]?.getMonth() === 3 && dates1[0]?.getDate() === 25, 'Correct date for April 25');

const dates2 = extractDatesFromText('deadline is 05/10/2026');
assert(dates2.length > 0, 'Extracts "MM/DD/YYYY" format');

const dates3 = extractDatesFromText('submit by May 1st, 2026');
assert(dates3.length > 0, 'Extracts "Month DDst, YYYY" format');

const dates4 = extractDatesFromText('meeting on 2026-04-30');
assert(dates4.length > 0, 'Extracts ISO "YYYY-MM-DD" format');

console.log('\n--- Email 1: Standard Assignment ---');
const result1 = extractDeadline(mockEmails[0]);
assert(result1 !== null, 'Extracts deadline from standard email');
assert(result1?.title === 'CS301 - Assignment 3: Data Structures', 'Correct title extracted');
assert(result1?.deadline instanceof Date, 'Deadline is a Date object');
assert(result1?.source === 'email', 'Source is "email"');

console.log('\n--- Email 2: Multiple Dates ---');
const result2 = extractDeadline(mockEmails[1]);
assert(result2 !== null, 'Extracts deadline from multi-date email');
assert(result2?.title === 'Research Paper Submission - ENG201', 'Correct title');
// Should pick the earliest future date
assert(result2?.deadline instanceof Date, 'Picks a valid date from multiple');

console.log('\n--- Email 3: "Submit by" keyword ---');
const result3 = extractDeadline(mockEmails[2]);
assert(result3 !== null, 'Extracts deadline with "submit by" keyword');
assert(result3?.title === 'MATH205 - Final Project Guidelines', 'Correct title');

console.log('\n--- Email 4: No Deadline (edge case) ---');
const result4 = extractDeadline(mockEmails[3]);
assert(result4 === null, 'Correctly discards email with no deadline keyword');

console.log('\n--- Email 5: Date but no keyword (edge case) ---');
const result5 = extractDeadline(mockEmails[4]);
assert(result5 === null, 'Correctly discards email with date but no deadline keyword');

console.log('\n--- Batch Processing ---');
const allResults = extractDeadlinesFromEmails(mockEmails);
assert(allResults.length === 3, `Extracts exactly 3 tasks from 5 emails (got ${allResults.length})`);
assert(allResults.every((t) => t.deadline instanceof Date), 'All extracted tasks have valid dates');
assert(allResults.every((t) => t.source === 'email'), 'All tasks marked as email source');

console.log('\n--- Duplicate Detection ---');
const duplicated = [...mockEmails, mockEmails[0]]; // Add duplicate
const deduped = extractDeadlinesFromEmails(duplicated);
assert(deduped.length === 3, 'Duplicate emails are filtered out');

// ---------- SUMMARY ----------

console.log('\n=== Results ===');
console.log(`Passed: ${passed}/${passed + failed}`);
console.log(`Failed: ${failed}/${passed + failed}`);
console.log(failed === 0 ? '\n✓ All tests passed!\n' : '\n✗ Some tests failed.\n');

process.exit(failed > 0 ? 1 : 0);
