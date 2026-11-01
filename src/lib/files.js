import Papa from 'papaparse';
import { rowsToCustomers } from './rows.js';

export const MAX_FILES = 3;
export const MAX_BYTES = 25 * 1024 * 1024;
const KIND = /\.(csv|xlsx|pdf)$/i;

/** Quick checks that run in the browser before anything is parsed. Returns an error message or ''. */
export async function checkFile(file) {
  if (!KIND.test(file.name)) return `${file.name}: choose a CSV, XLSX, or PDF file.`;
  if (file.size === 0) return `${file.name}: this file is empty.`;
  if (file.size > MAX_BYTES) return `${file.name}: files must be under 25 MB.`;
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const ascii = String.fromCharCode(...head);
  if (/\.pdf$/i.test(file.name) && !ascii.startsWith('%PDF-')) return `${file.name}: this does not look like a readable PDF.`;
  if (/\.xlsx$/i.test(file.name) && !(head[0] === 0x50 && head[1] === 0x4b)) return `${file.name}: this does not look like a readable Excel workbook.`;
  return '';
}

export async function checkFiles(files, alreadyAdded = []) {
  if (files.length > MAX_FILES) return `Choose up to ${MAX_FILES} files at a time.`;
  for (const file of files) {
    const problem = await checkFile(file);
    if (problem) return problem;
    if (alreadyAdded.includes(file.name)) return `${file.name} is already part of this review.`;
  }
  return '';
}

async function readOne(file) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.csv')) {
    const { data } = Papa.parse(await file.text(), { header: true, skipEmptyLines: true });
    return rowsToCustomers(data, file.name);
  }
  if (lower.endsWith('.xlsx')) {
    const { readWorkbook } = await import('./xlsx.js');
    let sheets;
    try {
      sheets = readWorkbook(await file.arrayBuffer());
    } catch (error) {
      throw new Error(`${file.name}: ${error.message}`);
    }
    return rowsToCustomers(sheets.flatMap((sheet) => sheet.rows), file.name);
  }
  if (lower.endsWith('.pdf')) {
    const { readPdf } = await import('./pdf.js');
    let rows;
    try {
      rows = await readPdf(await file.arrayBuffer(), file.name);
    } catch {
      throw new Error(`${file.name}: this PDF could not be read. Scanned images need text first; OCR is not included.`);
    }
    return rowsToCustomers(rows, file.name);
  }
  throw new Error(`${file.name}: choose a CSV, XLSX, or PDF file.`);
}

/** Reads each file in turn and returns every customer record found (not yet merged). */
export async function readFiles(files) {
  const records = [];
  for (const file of files) records.push(...(await readOne(file)));
  return records;
}
