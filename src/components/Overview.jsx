import { Button, Chip } from '@mui/material';
import { ArrowForward, ChevronRight, DownloadOutlined, Add, ShieldOutlined, SmartToyOutlined } from '@mui/icons-material';
import { HIGH_FROM, MEDIUM_FROM } from '../lib/scoring.js';
import { CustomerActions, EmptyState, RiskPill, ScoreBlock, SentimentPill, SignalList, Stats } from './Parts.jsx';
import { DropCard } from './Upload.jsx';

const byRisk = (a, b) => b.riskScore - a.riskScore;

function PriorityCard({ customer: c, flagged, onToggleFlag, onDetails }) {
  const nameId = `priority-${c.id}`;
  return (
    <article className="card priority" aria-labelledby={nameId}>
      <header className="priority-head">
        <div>
          <h3 id={nameId} className="h3">{c.customer}</h3>
          <p className="muted">{c.company}</p>
        </div>
        <ScoreBlock score={c.riskScore} id={`${nameId}-score`} />
      </header>
      <Stats customer={c} />
      <div className="evidence">
        <h4 className="label">Primary complaint</h4>
        <p>{c.summary}</p>
        <SignalList signals={c.signals} limit={3} />
      </div>
      <div className="next-step">
        <div>
          <h4 className="label">Suggested next step</h4>
          <p>{c.recommendation}</p>
        </div>
        <div className="next-step-actions">
          <CustomerActions customer={c} flagged={flagged} onToggleFlag={onToggleFlag} size="small" />
          <Button size="small" endIcon={<ChevronRight />} onClick={onDetails}>Customer details<span className="sr-only"> for {c.customer}</span></Button>
        </div>
      </div>
    </article>
  );
}

export function Overview({ customers, flagged, aiStatus, alreadyAdded, onFlag, onOpenCustomer, onGo, onExport, onUploadStep, onFiles, onRunAi }) {
  const high = customers.filter((c) => c.riskScore >= HIGH_FROM).sort(byRisk);
  const mid = customers.filter((c) => c.riskScore >= MEDIUM_FROM && c.riskScore < HIGH_FROM).sort(byRisk);
  const low = customers.filter((c) => c.riskScore < MEDIUM_FROM).sort(byRisk);
  const steadier = [...mid, ...low];
  const total = customers.length;
  const share = (n) => (total ? (n / total) * 100 : 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 id="page-title" tabIndex={-1} className="display">Who needs a call?</h1>
          <p className="lede">Here’s who could use a little extra attention.</p>
          <p className="session"><span className="session-dot" aria-hidden="true" />Temporary session. Nothing saved.</p>
        </div>
        <div className="page-actions">
          <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={onExport}>Export</Button>
          <Button variant="contained" startIcon={<Add />} onClick={onUploadStep}>Upload files</Button>
        </div>
      </div>

      <section className="card section" aria-labelledby="attention-title">
        <div className="section-head">
          <div>
            <h2 id="attention-title" className="h2">Needs your attention <span className="count">{high.length}</span></h2>
            <p className="muted">The strongest churn signals in the data you shared.</p>
          </div>
          <Button endIcon={<ArrowForward />} onClick={() => onGo('register')}>View all customers</Button>
        </div>
        {high.length ? (
          <div className="priority-list">
            {high.slice(0, 3).map((c) => (
              <PriorityCard key={c.id} customer={c} flagged={flagged.has(c.id)} onToggleFlag={() => onFlag(c)} onDetails={() => onOpenCustomer(c.id)} />
            ))}
          </div>
        ) : (
          <EmptyState>No high-priority signals in this data. That’s good news.</EmptyState>
        )}
      </section>

      <section className="card section" aria-labelledby="steady-title">
        <div className="section-head">
          <div>
            <h2 id="steady-title" className="h2">Looking steadier</h2>
            <p className="muted">Fewer warning signs in the latest notes. Keep your normal customer-success rhythm.</p>
          </div>
          <Chip size="small" label={`${steadier.length} ${steadier.length === 1 ? 'customer' : 'customers'}`} className="chip-neutral" />
        </div>
        {steadier.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr><th scope="col">Customer</th><th scope="col">Risk</th><th scope="col">Sentiment</th><th scope="col">Recent notes</th></tr>
              </thead>
              <tbody>
                {steadier.map((c) => (
                  <tr key={c.id} onClick={() => onOpenCustomer(c.id)}>
                    <th scope="row">
                      <button type="button" className="link-btn" onClick={(e) => { e.stopPropagation(); onOpenCustomer(c.id); }}>{c.customer}</button>
                      <span className="muted">{c.company}</span>
                    </th>
                    <td><RiskPill score={c.riskScore} /> <span className="muted nowrap">Score {c.riskScore}</span></td>
                    <td><SentimentPill sentiment={c.sentiment} /></td>
                    <td className="notes-cell">{c.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No lower-risk customers to show yet.</EmptyState>
        )}
      </section>

      <div className="two-up">
        <section className="card health" aria-labelledby="health-title">
          <h2 id="health-title" className="h3">Customer health at a glance</h2>
          <p className="muted">Where customers fall by risk score. Scores sort signals for human review; they do not predict a certain outcome.</p>
          <div className="dist" role="img" aria-label={`${high.length} high, ${mid.length} medium and ${low.length} low risk customers`}>
            <span className="dist-high" style={{ width: `${share(high.length)}%` }} />
            <span className="dist-medium" style={{ width: `${share(mid.length)}%` }} />
            <span className="dist-low" style={{ width: `${share(low.length)}%` }} />
          </div>
          <ul className="legend">
            {[['high', 'High', high], ['medium', 'Medium', mid], ['low', 'Low', low]].map(([tone, label, list]) => (
              <li key={tone}>
                <span className={`dot dot-${tone}`} aria-hidden="true" />
                <span className="legend-label">{label} signals</span>
                <strong>{list.length}</strong>
                <span className="muted legend-pct">{Math.round(share(list.length))}%</span>
              </li>
            ))}
          </ul>
        </section>
        <DropCard alreadyAdded={alreadyAdded} onFiles={onFiles} />
      </div>

      <section className="ai-strip" aria-labelledby="ai-title">
        <span className="icon-tile" aria-hidden="true"><SmartToyOutlined /></span>
        <div className="ai-copy">
          <h2 id="ai-title" className="h4">Want a deeper read?</h2>
          <p className="muted">Ask AI to summarize customer sentiment and suggest next steps.</p>
        </div>
        <span className={`tag ${aiStatus.configured ? 'tag-ok' : ''}`}>{aiStatus.configured ? 'AI ready' : 'Setup required'}</span>
        <Button variant="outlined" endIcon={<ArrowForward />} onClick={onRunAi}>Run AI review</Button>
      </section>

      <p className="footnote"><ShieldOutlined fontSize="small" /> Risk scores are prioritization aids, not guarantees. Always review source material and use your judgment.</p>
    </>
  );
}
