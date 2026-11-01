import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@mui/material';
import { Add, ArrowBack, ChevronRight, Close, ContentCopyOutlined, DownloadOutlined, Flag, SearchOutlined } from '@mui/icons-material';
import { CustomerActions, EmptyState, ScoreBadge, ScoreBlock, SignalList, Stats } from './Parts.jsx';

const fold = (value) => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Every word typed must appear somewhere in the name, company or email. */
function matches(customer, query) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = fold(`${customer.customer} ${customer.company} ${customer.email}`);
  return words.every((word) => haystack.includes(word));
}

function useNarrow() {
  const query = '(max-width: 900px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setNarrow(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return narrow;
}

function Detail({ customer: c, flagged, onToggleFlag, onCopyEmail, onBack, headingRef }) {
  return (
    <article className="card detail" aria-labelledby="detail-name">
      <Button className="back-btn" startIcon={<ArrowBack />} onClick={onBack}>All customers</Button>
      <header className="detail-head">
        <div>
          <h2 id="detail-name" className="h1" tabIndex={-1} ref={headingRef}>{c.customer}</h2>
          <p className="muted">
            {c.company}
            {c.email && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="email">{c.email}</span>
                <button type="button" className="icon-btn" aria-label={`Copy ${c.email}`} onClick={() => onCopyEmail(c.email)}><ContentCopyOutlined fontSize="inherit" /></button>
              </>
            )}
          </p>
        </div>
        <ScoreBlock score={c.riskScore} id="detail-score" />
      </header>

      <Stats customer={c} />

      <section aria-labelledby="seeing-title" className="seeing">
        <h3 id="seeing-title" className="label">What we are seeing</h3>
        <div className="evidence-row"><h4>Summary</h4><p>{c.summary}</p></div>
        <div className="evidence-row"><h4>Signals to review</h4><SignalList signals={c.signals} /></div>
      </section>

      <section className="next-step" aria-labelledby="next-title">
        <h3 id="next-title" className="label">Suggested next step</h3>
        <p>{c.recommendation}</p>
        <CustomerActions customer={c} flagged={flagged} onToggleFlag={onToggleFlag} />
      </section>

      <p className="disclaimer">Review the source material before taking action. Risk scores are estimates based on available data.</p>
    </article>
  );
}

export function Register({ customers, selectedId, detailOpen, flagged, onSelect, onCloseDetail, onFlag, onCopyEmail, onExport, onUploadStep }) {
  const [query, setQuery] = useState('');
  const narrow = useNarrow();
  const headingRef = useRef(null);
  const rowRefs = useRef(new Map());
  const pendingFocus = useRef(null);

  const sorted = useMemo(() => [...customers].sort((a, b) => b.riskScore - a.riskScore), [customers]);
  const visible = useMemo(() => sorted.filter((c) => matches(c, query)), [sorted, query]);
  const selected = sorted.find((c) => c.id === selectedId) || sorted[0];

  // On a narrow screen the list and the detail swap places, so move focus with them.
  useEffect(() => {
    if (!narrow || !pendingFocus.current) return;
    if (pendingFocus.current === 'detail') headingRef.current?.focus();
    else rowRefs.current.get(selected?.id)?.focus();
    pendingFocus.current = null;
  }, [detailOpen, narrow, selected?.id]);

  const choose = (id) => { pendingFocus.current = 'detail'; onSelect(id); };
  const back = () => { pendingFocus.current = 'list'; onCloseDetail(); };

  const count = query.trim()
    ? `${visible.length} of ${customers.length} ${customers.length === 1 ? 'customer' : 'customers'} match “${query.trim()}”`
    : `${customers.length} ${customers.length === 1 ? 'customer' : 'customers'}, highest risk first`;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 id="page-title" tabIndex={-1} className="display">Customer register</h1>
          <p className="lede">Customer signals from your latest data.</p>
        </div>
        <div className="page-actions">
          <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={onExport}>Export CSV</Button>
          <Button variant="contained" startIcon={<Add />} onClick={onUploadStep}>Upload files</Button>
        </div>
      </div>

      <div className="register" data-mobile={detailOpen ? 'detail' : 'list'}>
        <section className="card list-panel" aria-labelledby="list-title">
          <h2 id="list-title" className="sr-only">All customers</h2>
          <div className="list-tools">
            <div className="search" role="search">
              <label htmlFor="customer-search" className="sr-only">Search customers by name, company or email</label>
              <SearchOutlined fontSize="small" aria-hidden="true" />
              <input
                id="customer-search"
                type="search"
                value={query}
                placeholder="Search by name, company or email"
                autoComplete="off"
                spellCheck={false}
                aria-controls="customer-list"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && visible[0]) { e.preventDefault(); choose(visible[0].id); }
                  if (e.key === 'Escape' && query) { e.stopPropagation(); setQuery(''); }
                }}
              />
              {query && (
                <button type="button" className="icon-btn" aria-label="Clear search" onClick={() => { setQuery(''); document.getElementById('customer-search')?.focus(); }}>
                  <Close fontSize="small" />
                </button>
              )}
            </div>
            <p className="list-count" role="status">{count}</p>
          </div>

          {visible.length ? (
            <ul className="rows" id="customer-list" aria-label="Customers, highest risk first">
              {visible.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="row"
                    ref={(el) => (el ? rowRefs.current.set(c.id, el) : rowRefs.current.delete(c.id))}
                    aria-current={selected?.id === c.id ? 'true' : undefined}
                    onClick={() => choose(c.id)}
                  >
                    <ScoreBadge score={c.riskScore} />
                    <span className="row-main">
                      <span className="row-name">
                        {c.customer}
                        {flagged.has(c.id) && <Flag fontSize="inherit" titleAccess="Flagged for follow-up" />}
                      </span>
                      <span className="row-sub">{c.company} · {c.sentiment}</span>
                      <span className="row-summary">{c.summary}</span>
                    </span>
                    <ChevronRight fontSize="small" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-results">
              <EmptyState>No customers match “{query.trim()}”. Check the spelling or try part of a name.</EmptyState>
              <Button onClick={() => setQuery('')}>Clear search</Button>
            </div>
          )}
        </section>

        <div className="detail-panel">
          {selected ? (
            <Detail
              customer={selected}
              flagged={flagged.has(selected.id)}
              onToggleFlag={() => onFlag(selected)}
              onCopyEmail={onCopyEmail}
              onBack={back}
              headingRef={headingRef}
            />
          ) : (
            <EmptyState>No customers yet. Upload files to see them here.</EmptyState>
          )}
        </div>
      </div>
    </>
  );
}
