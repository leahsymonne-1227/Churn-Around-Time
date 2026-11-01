// A small .xlsx reader. It matches XML by local name, so workbooks written with
// prefixed namespaces (<x:workbook>) read the same as ones saved by Excel.
import { unzipSync, strFromU8 } from 'fflate';

const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const MAX_PART_BYTES = 60 * 1024 * 1024;
const WANTED = /^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^/]+\.xml)$/;

const parseXml = (bytes) => {
  const doc = new DOMParser().parseFromString(strFromU8(bytes).replace(/^﻿/, ''), 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('unreadable XML');
  return doc;
};
const all = (node, name) => [...node.getElementsByTagNameNS('*', name)];
// Phonetic guides (<rPh>) hold their own <t> nodes; they are not part of the visible text.
const textOf = (node) => all(node, 't').filter((t) => t.parentNode?.localName !== 'rPh').map((t) => t.textContent).join('');

function columnIndex(ref) {
  const letters = /^[A-Z]+/i.exec(ref || '')?.[0]?.toUpperCase();
  if (!letters) return -1;
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function readSheet(doc, strings) {
  const rows = [];
  for (const rowEl of all(doc, 'row')) {
    const row = [];
    let next = 0;
    for (const cell of [...rowEl.children].filter((el) => el.localName === 'c')) {
      const col = columnIndex(cell.getAttribute('r'));
      const index = col >= 0 ? col : next;
      next = index + 1;
      const type = cell.getAttribute('t');
      const v = all(cell, 'v')[0]?.textContent ?? '';
      let value = v;
      if (type === 's') value = strings[Number(v)] ?? '';
      else if (type === 'inlineStr') value = textOf(cell);
      else if (type === 'b') value = v === '1' ? 'TRUE' : 'FALSE';
      row[index] = value;
    }
    const rowNumber = Number(rowEl.getAttribute('r'));
    rows[Number.isFinite(rowNumber) && rowNumber > 0 ? rowNumber - 1 : rows.length] = row;
  }
  return Array.from(rows, (row) => row || []);
}

/** Returns one array of row objects per sheet, keyed by the header in each sheet's first row. */
export function readWorkbook(arrayBuffer) {
  let parts;
  try {
    parts = unzipSync(new Uint8Array(arrayBuffer), { filter: (file) => WANTED.test(file.name) && file.originalSize <= MAX_PART_BYTES });
  } catch {
    throw new Error('this does not look like a readable Excel workbook.');
  }
  if (!parts['xl/workbook.xml']) throw new Error('this does not look like a readable Excel workbook.');

  const workbook = parseXml(parts['xl/workbook.xml']);
  const relationships = new Map(
    all(parseXml(parts['xl/_rels/workbook.xml.rels'] || new Uint8Array()), 'Relationship').map((rel) => [rel.getAttribute('Id'), rel.getAttribute('Target')]),
  );
  const strings = parts['xl/sharedStrings.xml'] ? all(parseXml(parts['xl/sharedStrings.xml']), 'si').map(textOf) : [];

  const sheets = [];
  for (const sheet of all(workbook, 'sheet')) {
    const relId = sheet.getAttributeNS(REL_NS, 'id') || [...sheet.attributes].find((a) => a.localName === 'id' && a.name !== 'sheetId')?.value;
    const target = relationships.get(relId);
    if (!target) continue;
    const path = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
    if (!parts[path]) continue;
    const grid = readSheet(parseXml(parts[path]), strings);
    const headerRow = grid[0] || [];
    if (!headerRow.some((cell) => String(cell || '').trim())) continue;
    const headers = Array.from(headerRow, (cell, i) => String(cell || '').trim() || `column_${i + 1}`);
    sheets.push({
      name: sheet.getAttribute('name'),
      rows: grid.slice(1).map((cells) => Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? '']))),
    });
  }
  return sheets;
}
