const MAX_RECORDS = 100;

export async function getAiStatus() {
  // A static copy of the site (no server behind it) is built with VITE_NO_API=1 and skips the request.
  if (import.meta.env.VITE_NO_API) return { configured: false };
  try {
    const response = await fetch('/api/status');
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) return { configured: false };
    return await response.json();
  } catch {
    return { configured: false };
  }
}

/** Sends the extracted fields (never the original files) for review and returns updates keyed by customer id. */
export async function reviewWithAi(customers) {
  const body = customers.slice(0, MAX_RECORDS).map(({ id, customer, company, summary, signals, calls, mentions }) => ({
    id, customer, company, notes: summary, signals, calls, mentions,
  }));
  const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customers: body }) });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The analysis service did not answer. Check that the server is running.');
  }
  if (!response.ok) throw new Error(data?.error || 'AI analysis failed.');
  if (!Array.isArray(data.customers)) throw new Error('The analysis came back in an unexpected shape. Try again.');
  return { model: data.model, updates: new Map(data.customers.map((item) => [item.id, item])) };
}
