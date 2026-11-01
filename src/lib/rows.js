// Turns spreadsheet-style rows (from CSV, XLSX or PDF pages) into customer records.
import { clip, scanText, scoreFrom, sentimentFrom, DEFAULT_NEXT_STEP } from './scoring.js';

const norm = (key) => String(key).toLowerCase().replace(/[^a-z]/g, '');
const present = (value) => value !== undefined && value !== null && String(value).trim() !== '';

const NAME_KEYS = ['customername', 'contactname', 'fullname', 'name', 'customer', 'contact', 'clientname', 'client', 'accountname'];
const COMPANY_KEYS = ['company', 'companyname', 'organization', 'organisation', 'org', 'account'];
const CALL_KEYS = ['calls', 'callcount', 'numberofcalls', 'totalcalls', 'touchpoints'];
const TEXT_KEY = /transcript|notes|conversation|summary|feedback|review|text|comment|message|call.?log/i;
const RATING = /^\s*\d(\.\d)?\s*(\/\s*5\s*)?(stars?)?\s*$/i;

function pick(entries, keys) {
  for (const key of keys) {
    const hit = entries.find(([k, v]) => norm(k) === key && present(v));
    if (hit) return String(hit[1]).trim();
  }
  return '';
}

function nameOf(entries, index) {
  const first = pick(entries, ['firstname', 'givenname']);
  const last = pick(entries, ['lastname', 'surname', 'familyname']);
  if (first && last) return `${first} ${last}`;
  return pick(entries, NAME_KEYS) || first || pick(entries, COMPANY_KEYS) || `Customer ${index + 1}`;
}

export function rowsToCustomers(rows, fileName) {
  const records = [];
  rows.forEach((row, index) => {
    // Keys starting with "__" carry values a reader worked out itself (see pdf.js); they are not columns.
    const entries = Object.entries(row || {}).filter(([key]) => !key.startsWith('__'));
    if (!entries.some(([, value]) => present(value))) return;

    const textEntries = entries.filter(([key, value]) => TEXT_KEY.test(key) && present(value));
    const notes = textEntries.map(([, value]) => String(value));
    const content = notes.join(' ') || entries.map(([, value]) => value).join(' ');
    const { negative, positive, terms } = scanText(content);

    const customer = nameOf(entries, index);
    const callValue = pick(entries, CALL_KEYS);
    const type = String(entries.find(([key]) => /interaction.?type|^type$/i.test(key))?.[1] || '');
    const calls = callValue !== '' ? Number(callValue) || 0 : /call/i.test(type) ? 1 : 0;
    const readable = notes.filter((value) => !RATING.test(value));

    records.push({
      customer,
      email: pick(entries, ['email', 'emailaddress']).toLowerCase(),
      company: pick(entries, COMPANY_KEYS) || customer,
      riskScore: scoreFrom(negative, positive),
      calls,
      contactCount: 1,
      mentions: negative,
      negativeCount: negative,
      positiveCount: positive,
      sentiment: sentimentFrom(negative, positive),
      summary: clip((row.__summary ?? readable.join(' ')) || content, 180) || `Imported from ${fileName}.`,
      signals: terms.map((term) => `“${term}” language detected`),
      recommendation: row.__recommendation || DEFAULT_NEXT_STEP,
      sources: [fileName],
    });
  });
  return records;
}
