// Illustrative data shown when someone picks "sample data". The names and companies are fictional.
const rows = [
  { customer: 'Susie Harper', email: 'susie.harper@northstar.example', company: 'Northstar Health', riskScore: 92, calls: 3, contactCount: 4, mentions: 8, sentiment: 'Frustrated', summary: 'Repeated concerns about unresolved billing and support delays.', signals: ['“I’ve called three times”', '“This is getting frustrating”', 'Asked about cancellation'], recommendation: 'Reach out today with a clear billing resolution and a named point of contact.' },
  { customer: 'Marcus Chen', email: 'marcus.chen@brightpath.example', company: 'BrightPath Learning', riskScore: 84, calls: 2, contactCount: 3, mentions: 6, sentiment: 'Unhappy', summary: 'Product gaps are blocking the team from launching a planned program.', signals: ['“We expected this by now”', 'Escalated twice', 'Mentioned evaluating options'], recommendation: 'Offer a focused product review and confirm a timeline for the missing workflow.' },
  { customer: 'Alicia Brooks', email: 'alicia.brooks@fieldstone.example', company: 'Fieldstone Group', riskScore: 76, calls: 4, contactCount: 5, mentions: 5, sentiment: 'Concerned', summary: 'Several follow-ups about reliability; recent tone has become less positive.', signals: ['Three outage references', 'Missed follow-up noted', 'Usage has softened'], recommendation: 'Share an incident update and schedule a proactive check-in this week.' },
  { customer: 'Dev Patel', email: 'dev.patel@pine.example', company: 'Pine & Co.', riskScore: 48, calls: 1, contactCount: 2, mentions: 3, sentiment: 'Mixed', summary: 'A few questions about onboarding, with no explicit cancellation signals.', signals: ['Asked for training', 'One minor issue'], recommendation: 'Send the onboarding guide and monitor for another support request.' },
  { customer: 'Naomi Rivera', email: 'naomi.rivera@atlas.example', company: 'Atlas Fabrication', riskScore: 31, calls: 2, contactCount: 3, mentions: 2, sentiment: 'Positive', summary: 'Team is engaged and recently shared positive feedback.', signals: ['Positive feedback', 'Healthy product activity'], recommendation: 'Keep the regular success cadence.' },
  { customer: 'Owen Walker', email: 'owen.walker@evergreen.example', company: 'Evergreen Studio', riskScore: 18, calls: 1, contactCount: 2, mentions: 1, sentiment: 'Positive', summary: 'No meaningful churn signals found in the latest notes.', signals: ['No cancellation language'], recommendation: 'Continue the current relationship plan.' },
];

export const sampleCustomers = rows.map((row) => ({
  ...row,
  id: row.customer.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  sample: true,
  sources: [],
}));
