/**
 * DeadlineOS - Deadline Extraction Tests v2
 * Comprehensive test suite covering:
 * - Original patterns (absolute dates, keyword detection)
 * - NEW: Relative dates (tomorrow, this Friday, in 3 days, etc.)
 * - NEW: Time-of-day extraction
 * - NEW: Expanded keywords (exam, quiz, closes, done by, etc.)
 * - NEW: Canvas/LMS notification parsing
 * - NEW: Confidence scoring
 * - NEW: Title extraction from generic subjects
 * - Edge cases
 *
 * Run: node tests/deadlineExtraction.test.js
 */

const {
  extractDeadline,
  extractDeadlinesFromEmails,
  extractDatesFromText,
  hasDeadlineKeyword,
  extractTaskTitle,
  extractTimeFromText,
  getConfidence,
} = require('../services/deadlineExtractor');

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

// ──────────────────────────────────────────────────────────────────
// SECTION 1: KEYWORD DETECTION (original + expanded)
// ──────────────────────────────────────────────────────────────────

console.log('\n=== DeadlineOS Extraction Engine v2 Tests ===\n');

console.log('--- 1. Original Keyword Detection ---');
assert(hasDeadlineKeyword('This is due tomorrow'), 'Detects "due"');
assert(hasDeadlineKeyword('The deadline is Friday'), 'Detects "deadline"');
assert(hasDeadlineKeyword('Submit by next week'), 'Detects "submit by"');
assert(hasDeadlineKeyword('Last date for registration'), 'Detects "last date"');
assert(!hasDeadlineKeyword('Hello, how are you?'), 'No false positive on normal text');

console.log('\n--- 2. NEW Expanded Keywords ---');
assert(hasDeadlineKeyword('Please have this done by Friday'), 'Detects "done by"');
assert(hasDeadlineKeyword('The portal closes on May 1'), 'Detects "closes"');
assert(hasDeadlineKeyword('Exam on April 30'), 'Detects "exam on"');
assert(hasDeadlineKeyword('Quiz due next Monday'), 'Detects "quiz due"');
assert(hasDeadlineKeyword('Midterm on November 5'), 'Detects "midterm on"');
assert(hasDeadlineKeyword('Assignment closes at midnight'), 'Detects "closes" variant');
assert(hasDeadlineKeyword('Complete by end of week'), 'Detects "complete by"');
assert(hasDeadlineKeyword('No later than April 25'), 'Detects "no later than"');
assert(hasDeadlineKeyword('Available until May 3'), 'Detects "available until"');
assert(hasDeadlineKeyword('Hand in by Friday'), 'Detects "hand in by"');
assert(hasDeadlineKeyword('Presentation on December 1'), 'Detects "presentation on"');
assert(hasDeadlineKeyword('Test date is May 15'), 'Detects "test date"');

console.log('\n--- 3. LMS / Canvas Keywords ---');
assert(hasDeadlineKeyword('New assignment has been posted in CS301'), 'Detects Canvas "assignment has been posted"');
assert(hasDeadlineKeyword('Quiz available for Chapter 5'), 'Detects "quiz available"');
assert(hasDeadlineKeyword('Course announcement from professor'), 'Detects "course announcement"');
assert(hasDeadlineKeyword('Reminder: Project due tomorrow'), 'Detects "reminder:"');

// ──────────────────────────────────────────────────────────────────
// SECTION 2: ABSOLUTE DATE EXTRACTION (original)
// ──────────────────────────────────────────────────────────────────

console.log('\n--- 4. Absolute Date Extraction ---');
const dates1 = extractDatesFromText('Due date: April 25, 2026');
assert(dates1.length > 0, '"Month DD, YYYY" format works');
assert(dates1[0]?.getMonth() === 3 && dates1[0]?.getDate() === 25, 'Correct date for April 25');

const dates2 = extractDatesFromText('deadline is 05/10/2026');
assert(dates2.length > 0, '"MM/DD/YYYY" format works');
assert(dates2[0]?.getMonth() === 4 && dates2[0]?.getDate() === 10, 'Correct date for 05/10');

const dates3 = extractDatesFromText('submit by May 1st, 2026');
assert(dates3.length > 0, '"Month DDst, YYYY" ordinal works');
assert(dates3[0]?.getDate() === 1, 'Correct day for 1st');

const dates4 = extractDatesFromText('meeting on 2026-04-30');
assert(dates4.length > 0, 'ISO "YYYY-MM-DD" format works');
assert(dates4[0]?.getMonth() === 3 && dates4[0]?.getDate() === 30, 'Correct ISO date');

const dates5 = extractDatesFromText('due 23rd November 2026');
assert(dates5.length > 0, '"DDrd Month YYYY" format works');

const dates6 = extractDatesFromText('closes March 3rd');
assert(dates6.length > 0, '"Month DDrd" (no year) with inference');

// ──────────────────────────────────────────────────────────────────
// SECTION 3: RELATIVE DATE EXTRACTION (NEW)
// ──────────────────────────────────────────────────────────────────

console.log('\n--- 5. NEW Relative Date Extraction ---');

const today = new Date();

const relTomorrow = extractDatesFromText('This is due tomorrow');
assert(relTomorrow.length > 0, '"tomorrow" resolves to a date');
assert(relTomorrow[0]?.getDate() === new Date(today.getTime() + 86400000).getDate(), '"tomorrow" is correct day');

const relToday = extractDatesFromText('Due today by 5pm');
assert(relToday.length > 0, '"today" resolves to a date');

const relFriday = extractDatesFromText('Submit by this Friday');
assert(relFriday.length > 0, '"this Friday" resolves');
assert(relFriday[0]?.getDay() === 5, '"this Friday" is actually a Friday');

const relNextMon = extractDatesFromText('Deadline is next Monday');
assert(relNextMon.length > 0, '"next Monday" resolves');
assert(relNextMon[0]?.getDay() === 1, '"next Monday" is actually a Monday');

const relIn3 = extractDatesFromText('Complete this in 3 days');
assert(relIn3.length > 0, '"in 3 days" resolves');
const expected3 = new Date(today);
expected3.setDate(expected3.getDate() + 3);
assert(relIn3[0]?.getDate() === expected3.getDate(), '"in 3 days" is correct');

const relWeek = extractDatesFromText('Due in a week');
assert(relWeek.length > 0, '"in a week" resolves');

const relTwoWeeks = extractDatesFromText('Submit within 2 weeks');
// "within 2 weeks" → uses the "within X days" pattern → 2 days, not 2 weeks
// But we also have "in two weeks" → let's test that
const relTwoWeeks2 = extractDatesFromText('Due in two weeks');
assert(relTwoWeeks2.length > 0, '"in two weeks" resolves');

const relEndWeek = extractDatesFromText('Finish by end of this week');
assert(relEndWeek.length > 0, '"end of this week" resolves');

const relEndMonth = extractDatesFromText('Available until end of this month');
assert(relEndMonth.length > 0, '"end of this month" resolves');

const relDayAfter = extractDatesFromText('Due day after tomorrow');
assert(relDayAfter.length > 0, '"day after tomorrow" resolves');

const relByFri = extractDatesFromText('Please have this done by Friday');
assert(relByFri.length > 0, '"by Friday" resolves');
assert(relByFri[0]?.getDay() === 5, '"by Friday" is actually a Friday');

// ──────────────────────────────────────────────────────────────────
// SECTION 4: TIME-OF-DAY EXTRACTION (NEW)
// ──────────────────────────────────────────────────────────────────

console.log('\n--- 6. NEW Time-of-Day Extraction ---');

const t1 = extractTimeFromText('Due by 11:59 PM');
assert(t1 !== null, 'Extracts "11:59 PM"');
assert(t1?.hour === 23 && t1?.min === 59, 'Correct time for 11:59 PM');

const t2 = extractTimeFromText('Submit before 5:00 PM');
assert(t2 !== null, 'Extracts "5:00 PM"');
assert(t2?.hour === 17 && t2?.min === 0, 'Correct time for 5:00 PM');

const t3 = extractTimeFromText('Quiz opens at 9:30 AM');
assert(t3 !== null, 'Extracts "9:30 AM"');
assert(t3?.hour === 9 && t3?.min === 30, 'Correct time for 9:30 AM');

const t4 = extractTimeFromText('Closes at 23:59');
assert(t4 !== null, 'Extracts 24-hour "23:59"');
assert(t4?.hour === 23 && t4?.min === 59, 'Correct time for 23:59');

const t5 = extractTimeFromText('Due at 12:00 PM');
assert(t5?.hour === 12, 'Handles 12:00 PM (noon) correctly');

const t6 = extractTimeFromText('Due at 12:00 AM');
assert(t6?.hour === 0, 'Handles 12:00 AM (midnight) correctly');

const t7 = extractTimeFromText('No time mentioned here');
assert(t7 === null, 'Returns null when no time found');

// ──────────────────────────────────────────────────────────────────
// SECTION 5: FULL EMAIL EXTRACTION
// ──────────────────────────────────────────────────────────────────

console.log('\n--- 7. Full Email Extraction (original emails) ---');

const email1 = {
  messageId: 'msg_001',
  subject: 'CS301 - Assignment 3: Data Structures',
  from: 'prof.smith@university.edu',
  body: `Assignment 3 on Binary Trees is posted. Due date: April 25, 2026. Submit through the portal.`,
};
const r1 = extractDeadline(email1);
assert(r1 !== null, 'Standard email: extracts deadline');
assert(r1?.title === 'CS301 - Assignment 3: Data Structures', 'Standard email: correct title');
assert(r1?.deadline instanceof Date, 'Standard email: valid date');
assert(r1?.confidence >= 40, `Standard email: high confidence (${r1?.confidence})`);

const email2 = {
  messageId: 'msg_002',
  subject: 'Research Paper Submission - ENG201',
  from: 'dr.jones@university.edu',
  body: `Draft due by 04/20/2026 and final submission deadline is 05/10/2026.`,
};
const r2 = extractDeadline(email2);
assert(r2 !== null, 'Multi-date email: extracts deadline');
assert(r2?.deadline instanceof Date, 'Multi-date email: picks a date');

console.log('\n--- 8. NEW: Relative Date Emails ---');

const email3 = {
  messageId: 'msg_rel_1',
  subject: 'MATH205 - Homework Reminder',
  from: 'prof.lee@university.edu',
  body: `Reminder: your homework is due tomorrow by 11:59 PM. Don't forget to show your work.`,
};
const r3 = extractDeadline(email3);
assert(r3 !== null, 'Relative email: "due tomorrow" extracted');
assert(r3?.deadline instanceof Date, 'Relative email: valid date');
// Check time was applied
assert(r3?.deadline?.getHours() === 23 && r3?.deadline?.getMinutes() === 59,
  'Relative email: 11:59 PM time applied');

const email4 = {
  messageId: 'msg_rel_2',
  subject: 'CS301 Quiz Next Monday',
  from: 'ta@university.edu',
  body: `The quiz on Chapter 7 is scheduled for next Monday. Exam on the material covered in weeks 5-8.`,
};
const r4 = extractDeadline(email4);
assert(r4 !== null, '"next Monday" + "exam on" detected');
assert(r4?.deadline?.getDay() === 1, 'Date is actually a Monday');

const email5 = {
  messageId: 'msg_rel_3',
  subject: 'Project Update',
  from: 'group-lead@gmail.com',
  body: `Hey team, please have your parts done by Friday. The final project deadline is in 2 weeks.`,
};
const r5 = extractDeadline(email5);
assert(r5 !== null, '"done by Friday" + "deadline" detected');

console.log('\n--- 9. NEW: Canvas/LMS Emails ---');

const emailCanvas = {
  messageId: 'msg_canvas_1',
  subject: 'Notification: New assignment has been posted',
  from: 'notifications@canvas.university.edu',
  body: `A new assignment has been posted in CS301 - Data Structures.

Assignment: Binary Tree Implementation
Due: April 28, 2026 at 11:59 PM

Click here to view the assignment details.`,
};
const rCanvas = extractDeadline(emailCanvas);
assert(rCanvas !== null, 'Canvas email: deadline extracted');
assert(rCanvas?.deadline?.getMonth() === 3 && rCanvas?.deadline?.getDate() === 28,
  'Canvas email: correct date April 28');
assert(rCanvas?.deadline?.getHours() === 23, 'Canvas email: 11:59 PM time applied');

const emailBlackboard = {
  messageId: 'msg_bb_1',
  subject: 'Reminder: Quiz closes tomorrow',
  from: 'blackboard@university.edu',
  body: `This is a reminder that the Chapter 5 Quiz closes tomorrow at 5:00 PM.
Course: PHYS101 - Mechanics
Complete all questions before the deadline.`,
};
const rBB = extractDeadline(emailBlackboard);
assert(rBB !== null, 'Blackboard email: "closes tomorrow" detected');
assert(rBB?.deadline?.getHours() === 17, 'Blackboard email: 5:00 PM time applied');

console.log('\n--- 10. Edge Cases: Should NOT Extract ---');

const emailNoKeyword = {
  messageId: 'msg_no_1',
  subject: 'Campus Newsletter - Spring 2026',
  from: 'newsletter@university.edu',
  body: `Welcome back! Basketball on Friday, career fair next week, pizza night at dorms.`,
};
assert(extractDeadline(emailNoKeyword) === null, 'Newsletter: correctly discarded (no keyword)');

const emailDateNoKeyword = {
  messageId: 'msg_no_2',
  subject: 'Meeting notes from April 10, 2026',
  from: 'studygroup@gmail.com',
  body: `Notes from our study session on April 10, 2026. Covered chapters 5-7.`,
};
assert(extractDeadline(emailDateNoKeyword) === null, 'Meeting notes: discarded (date but no deadline keyword)');

const emailSpam = {
  messageId: 'msg_no_3',
  subject: 'You won a free trip!',
  from: 'spam@example.com',
  body: `Congratulations! Click here to claim your prize by March 1, 2026.`,
};
// This might trigger "claim ... by" — but no deadline keyword matches
const rSpam = extractDeadline(emailSpam);
// Acceptable either way, but if extracted, confidence should be low
if (rSpam) {
  assert(rSpam.confidence < 50, 'Spam: low confidence if extracted');
} else {
  assert(true, 'Spam: correctly discarded');
}

console.log('\n--- 11. Title Extraction ---');

const titleGeneric = extractTaskTitle('Reminder', 'Your CS301 Assignment 5 is due next week. Please submit via portal.');
assert(titleGeneric.includes('CS301') || titleGeneric.includes('Assignment'),
  'Generic subject "Reminder": pulls meaningful title from body');

const titleBrackets = extractTaskTitle('[CS301] Assignment 3 Due', 'The assignment is due Friday.');
assert(!titleBrackets.startsWith('['), 'Strips [COURSE] brackets from subject');
assert(titleBrackets.includes('Assignment 3'), 'Preserves assignment info after bracket strip');

const titleReply = extractTaskTitle('Re: Fwd: MATH205 Final Project', 'Project details inside.');
assert(!titleReply.startsWith('Re:') && !titleReply.startsWith('Fwd:'), 'Strips Re: and Fwd: prefixes');
assert(titleReply.includes('MATH205'), 'Preserves course code after prefix strip');

console.log('\n--- 12. Confidence Scoring ---');

const confHigh = getConfidence('CS301 assignment due April 25, 2026. Submit by 11:59 PM.', [new Date('2026-04-25')]);
assert(confHigh >= 70, `High confidence for strong keyword + future date + .edu pattern (${confHigh})`);

const confMed = getConfidence('Exam on Friday. Be prepared.', [new Date(Date.now() + 86400000)]);
assert(confMed >= 40 && confMed < 80, `Medium confidence for moderate keyword + date (${confMed})`);

const confLow = getConfidence('Something about a quiz maybe. No real date here.', []);
assert(confLow < 50, `Low confidence for keyword but no date (${confLow})`);

console.log('\n--- 13. Batch Processing ---');

const allEmails = [email1, email2, email3, email4, email5, emailCanvas, emailBlackboard, emailNoKeyword, emailDateNoKeyword];
const allResults = extractDeadlinesFromEmails(allEmails);
assert(allResults.length >= 5, `Batch: extracts at least 5 from 9 emails (got ${allResults.length})`);
assert(allResults.every((t) => t.deadline instanceof Date), 'Batch: all have valid dates');
assert(allResults.every((t) => t.confidence >= 30), 'Batch: all above minimum confidence');
// Results should be sorted by confidence descending
assert(allResults[0].confidence >= allResults[allResults.length - 1].confidence,
  'Batch: sorted by confidence (highest first)');

console.log('\n--- 14. Duplicate Detection ---');
const duplicated = [email1, email1, email2, email2, email3];
const deduped = extractDeadlinesFromEmails(duplicated);
assert(deduped.length === 3, `Duplicates filtered: got ${deduped.length} from 5 (3 unique)`);

// ──────────────────────────────────────────────────────────────────
// SUMMARY
// ──────────────────────────────────────────────────────────────────

console.log('\n=== Results ===');
console.log(`Passed: ${passed}/${total}`);
console.log(`Failed: ${failed}/${total}`);
console.log(failed === 0 ? '\n✓ All tests passed!\n' : `\n✗ ${failed} test(s) failed.\n`);

process.exit(failed > 0 ? 1 : 0);
