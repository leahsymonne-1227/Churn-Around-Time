import Papa from 'papaparse';
import { severity } from './scoring.js';

/**
 * Saves a text file. Inside a shared Claude page the viewer's own save prompt is used
 * (script-started downloads are blocked there); everywhere else it is a normal download.
 */
export async function saveTextFile(filename, text, type = 'text/csv') {
  try {
    const downloads = await window.claude?.use?.('downloads');
    if (downloads) {
      await downloads.save({ filename, data: text });
      return 'saved';
    }
  } catch (error) {
    if (error?.code === 'declined') return 'declined';
  }
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'saved';
}

export function reviewToCsv(customers, flaggedIds) {
  const rows = customers.map((c) => ({
    customer: c.customer,
    company: c.company,
    email: c.email || '',
    risk: severity(c.riskScore),
    risk_score: c.riskScore,
    calls: c.calls,
    contacts: c.contactCount ?? c.calls,
    mentions: c.mentions,
    sentiment: c.sentiment,
    summary: c.summary,
    recommendation: c.recommendation,
    flagged_for_follow_up: flaggedIds.has(c.id) ? 'yes' : '',
  }));
  // escapeFormulae stops a cell like "=HYPERLINK(...)" from running when the file is opened in Excel.
  return `﻿${Papa.unparse(rows, { escapeFormulae: true })}`;
}
