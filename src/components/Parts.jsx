import { Button } from '@mui/material';
import { EmailOutlined, Flag, FlagOutlined, WarningAmberOutlined } from '@mui/icons-material';
import { levelOf, severity } from '../lib/scoring.js';

export const NO_SIGNALS = 'No obvious negative language found';

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="brand-name">churn around time</span>
    </div>
  );
}

/** The square score tile used in lists. The number is hidden from screen readers in favour of a full sentence. */
export function ScoreBadge({ score, size = 'md' }) {
  return (
    <span className={`badge badge-${levelOf(score)} badge-${size}`}>
      <span aria-hidden="true">{score}</span>
      <span className="sr-only">Score {score} out of 100, {severity(score)} risk.</span>
    </span>
  );
}

export function RiskPill({ score }) {
  return <span className={`pill pill-${levelOf(score)}`}>{severity(score)} risk</span>;
}

const SENTIMENT_TONE = { concerned: 'high', frustrated: 'high', unhappy: 'high', positive: 'low' };
export function SentimentPill({ sentiment }) {
  const label = sentiment || 'Unknown';
  return <span className={`pill pill-${SENTIMENT_TONE[label.toLowerCase()] || 'medium'}`}>{label}</span>;
}

export function ScoreBlock({ score, id }) {
  return (
    <div className={`score-block score-${levelOf(score)}`}>
      <p className="label" id={id}>Churn Around score</p>
      <p className="score-reading" aria-labelledby={id}>
        <strong className="score-number">{score}</strong>
        <span className="score-outof">/100</span>
      </p>
      <div className="meter" aria-hidden="true"><span style={{ width: `${score}%` }} /></div>
      <RiskPill score={score} />
    </div>
  );
}

export function Stats({ customer: c }) {
  const contacts = c.contactCount ?? c.calls;
  const plural = (n, one, many) => (n === 1 ? one : many);
  return (
    <dl className="stats">
      <div className="stat"><dt>Sentiment</dt><dd><SentimentPill sentiment={c.sentiment} /></dd></div>
      <div className="stat"><dt>Contacts logged</dt><dd className="stat-value">{contacts} <span>{plural(contacts, 'contact', 'contacts')}</span></dd></div>
      <div className="stat"><dt>Calls</dt><dd className="stat-value">{c.calls} <span>{plural(c.calls, 'call', 'calls')}</span></dd></div>
      <div className="stat"><dt>Signals to review</dt><dd className="stat-value">{c.mentions} <span>{plural(c.mentions, 'flagged mention', 'flagged mentions')}</span></dd></div>
    </dl>
  );
}

export function SignalList({ signals, limit }) {
  const list = signals?.length ? (limit ? signals.slice(0, limit) : signals) : [NO_SIGNALS];
  return (
    <ul className="signal-list">
      {list.map((signal, i) => (
        <li key={`${signal}-${i}`}>
          <WarningAmberOutlined fontSize="small" />
          <span>{signal}</span>
        </li>
      ))}
    </ul>
  );
}

export function CustomerActions({ customer: c, flagged, onToggleFlag, size = 'medium' }) {
  const mailto = c.email ? `mailto:${c.email}?subject=${encodeURIComponent(`Checking in, ${c.customer}`)}` : undefined;
  return (
    <div className="actions">
      <Button variant="contained" size={size} startIcon={<EmailOutlined />} component={c.email ? 'a' : 'button'} href={mailto} disabled={!c.email}>
        Email customer
      </Button>
      <Button variant="outlined" size={size} startIcon={flagged ? <Flag /> : <FlagOutlined />} aria-pressed={flagged} className={flagged ? 'is-flagged' : undefined} onClick={onToggleFlag}>
        Flag for follow-up
      </Button>
      {!c.email && <p className="hint">No email address was found in this data.</p>}
    </div>
  );
}

export function EmptyState({ children }) {
  return <p className="empty">{children}</p>;
}
