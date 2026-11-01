// Text-based PDFs only (no OCR). Each page becomes one row.
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const MAX_PAGES = 40;
const NEXT_FIELD = '(?:email|company|period|total\\s+calls?|calls?|review|account\\s+health)';

function fieldsFrom(text, fileName, pageNumber) {
  const customer = text.match(new RegExp(`(?:customer|account|contact)(?:\\s+name)?\\s*[:\\-]\\s*(.+?)(?=\\s+${NEXT_FIELD}\\s*[:\\-]|$)`, 'i'))?.[1]?.trim();
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const company = text.match(new RegExp(`company\\s*[:\\-]\\s*(.+?)(?=\\s+(?:period|total\\s+calls?|calls?|review|account\\s+health|email)\\s*[:\\-]|$)`, 'i'))?.[1]?.trim() || '';
  const calls = Number(text.match(/(?:total\s+)?calls?\s*[:\-]\s*(\d+)/i)?.[1] || 0);

  // Field notes often end with a suggested follow-up; keep it as the next step, not as customer sentiment.
  const followUp = text.match(/(?:suggested\s+follow-?up|recommended(?:\s+next)?\s+step|next\s+step)\s*[:\-]?\s*(.+?)(?=\s+This\s+(?:fictional|example)|$)/is);
  let notes = text;
  let recommendation = '';
  if (followUp) {
    recommendation = followUp[1].split(/(?<=[.!?])\s+/).slice(0, 2).join(' ').trim();
    notes = text.replace(followUp[0], ' ');
  }
  // Skip page headers: start reading after the customer/company/calls fields when they are present.
  const afterFields = notes.match(/(?:calls?\s*[:\-]\s*\d+)\s+(.*)$/is);
  const body = (afterFields ? afterFields[1] : notes).trim();

  return {
    customer: customer || `${fileName.replace(/\.pdf$/i, '')} · page ${pageNumber}`,
    email,
    company,
    calls,
    notes: body,
    ...(recommendation ? { __recommendation: recommendation } : {}),
  };
}

export async function readPdf(arrayBuffer, fileName) {
  const pdf = await getDocument({ data: new Uint8Array(arrayBuffer), isEvalSupported: false }).promise;
  try {
    const rows = [];
    for (let i = 1; i <= Math.min(pdf.numPages, MAX_PAGES); i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
      if (text) rows.push(fieldsFrom(text, fileName, i));
    }
    return rows;
  } finally {
    pdf.destroy();
  }
}
