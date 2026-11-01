import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Snackbar } from '@mui/material';
import { Header, Steps } from './components/Header.jsx';
import { UploadStep } from './components/Upload.jsx';
import { Overview } from './components/Overview.jsx';
import { Register } from './components/Register.jsx';
import { Loader } from './components/Loader.jsx';
import { Dialogs } from './components/Dialogs.jsx';
import { getAiStatus, reviewWithAi } from './lib/ai.js';
import { readFiles } from './lib/files.js';
import { mergeCustomers } from './lib/scoring.js';
import { sampleCustomers } from './lib/sample.js';
import { reviewToCsv, saveTextFile } from './lib/save.js';

const TITLES = { upload: 'Upload', analyse: 'Analyse', register: 'Customer register' };
const MIN_LOADER_MS = 900;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  const [customers, setCustomers] = useState([]);
  const [hasReview, setHasReview] = useState(false);
  const [view, setView] = useState('upload');
  const [files, setFiles] = useState([]);
  const [flagged, setFlagged] = useState(() => new Set());
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState('');
  const [aiStatus, setAiStatus] = useState({ configured: false });
  const shownView = useRef(view);

  useEffect(() => { getAiStatus().then(setAiStatus); }, []);

  // Each view has its own tab title, and moving between views moves focus to the new page heading.
  useEffect(() => {
    document.title = `${TITLES[view]} | Churn Around Time`;
    if (shownView.current === view) return; // first load: leave focus alone so the skip link is the first Tab stop
    shownView.current = view;
    document.getElementById('page-title')?.focus();
  }, [view]);

  const addedSources = customers.flatMap((c) => c.sources || []);
  const go = useCallback((next) => { setError(''); setView(next); }, []);

  async function analyse(chosen, withAi = false) {
    setError('');
    setBusy('Reading your files');
    try {
      const [records] = await Promise.all([readFiles(chosen), wait(MIN_LOADER_MS)]);
      if (!records.length) throw new Error('No readable customer rows found in those files. Check that they contain headers and customer notes.');
      const merged = mergeCustomers([...customers.filter((c) => !c.sample), ...records]);
      setCustomers(merged);
      setHasReview(true);
      setFiles([]);
      setSelectedId(merged.slice().sort((a, b) => b.riskScore - a.riskScore)[0]?.id ?? null);
      setDetailOpen(false);
      setNotice(`Analysis ready for ${merged.length} ${merged.length === 1 ? 'customer' : 'customers'}.`);
      setView('analyse');
      setDialog(withAi && aiStatus.configured ? 'ai-confirm' : '');
    } catch (e) {
      setError(e.message || 'Could not read those files.');
    } finally {
      setBusy('');
    }
  }

  function openSample() {
    setCustomers(sampleCustomers);
    setHasReview(true);
    setFiles([]);
    setSelectedId(sampleCustomers[0].id);
    setDetailOpen(false);
    setError('');
    setNotice('Showing sample data.');
    setView('analyse');
  }

  function newReview() {
    setCustomers([]);
    setHasReview(false);
    setFiles([]);
    setFlagged(new Set());
    setSelectedId(null);
    setDetailOpen(false);
    setError('');
    setView('upload');
  }

  async function confirmAi() {
    setDialog('');
    setBusy('Asking AI for a second read');
    try {
      const { updates, model } = await reviewWithAi(customers);
      setCustomers((current) => current.map((c) => {
        const update = updates.get(c.id);
        if (!update) return c;
        return {
          ...c,
          riskScore: update.riskScore,
          sentiment: update.sentiment || c.sentiment,
          summary: update.summary || c.summary,
          signals: update.signals?.length ? update.signals : c.signals,
          recommendation: update.recommendation || c.recommendation,
          aiScored: true,
        };
      }));
      setNotice(`AI review complete using ${model}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  function toggleFlag(customer) {
    const next = new Set(flagged);
    const on = !next.delete(customer.id);
    if (on) next.add(customer.id);
    setFlagged(next);
    setNotice(on ? `Follow-up flagged for ${customer.customer} in this session.` : `Follow-up flag removed for ${customer.customer}.`);
  }

  async function exportCsv() {
    const result = await saveTextFile('churn-around-time-risk-review.csv', reviewToCsv(customers, flagged));
    if (result === 'saved') setNotice('Risk review exported as CSV.');
  }

  async function copyEmail(address) {
    try {
      await navigator.clipboard.writeText(address);
      setNotice(`Copied ${address}.`);
    } catch {
      setNotice(`Select and copy: ${address}`);
    }
  }

  function openCustomer(id) {
    setSelectedId(id);
    setDetailOpen(true);
    setView('register');
  }

  const runAi = () => setDialog(aiStatus.configured ? 'ai-confirm' : 'setup');

  let body;
  if (busy) body = <Loader label={busy} />;
  else if (view === 'upload' || !hasReview) {
    body = (
      <UploadStep
        files={files}
        setFiles={setFiles}
        error={error}
        alreadyAdded={addedSources}
        hasReview={hasReview}
        canUseSample={!hasReview || customers.every((c) => c.sample)}
        aiConfigured={aiStatus.configured}
        onAnalyse={analyse}
        onSample={openSample}
        onNewReview={newReview}
        onOpenSetup={() => setDialog('setup')}
      />
    );
  } else if (view === 'analyse') {
    body = (
      <>
        {error && <Alert severity="error" onClose={() => setError('')} className="top-alert">{error}</Alert>}
        <Overview
          customers={customers}
          flagged={flagged}
          aiStatus={aiStatus}
          alreadyAdded={addedSources}
          onFlag={toggleFlag}
          onOpenCustomer={openCustomer}
          onGo={go}
          onExport={exportCsv}
          onUploadStep={() => go('upload')}
          onFiles={analyse}
          onRunAi={runAi}
        />
      </>
    );
  } else {
    body = (
      <>
        {error && <Alert severity="error" onClose={() => setError('')} className="top-alert">{error}</Alert>}
        <Register
          customers={customers}
          selectedId={selectedId}
          detailOpen={detailOpen}
          flagged={flagged}
          onSelect={(id) => { setSelectedId(id); setDetailOpen(true); }}
          onCloseDetail={() => setDetailOpen(false)}
          onFlag={toggleFlag}
          onCopyEmail={copyEmail}
          onExport={exportCsv}
          onUploadStep={() => go('upload')}
        />
      </>
    );
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to main content</a>
      <Header onPurchase={() => setDialog('purchase')} onLogin={() => setDialog('login')} />
      <Steps view={view} hasReview={hasReview} onGo={go} />
      <main id="main" tabIndex={-1} className="wrap main" aria-busy={Boolean(busy)}>{body}</main>
      <footer className="site-footer">
        <div className="wrap footer-row">
          <span>© {new Date().getFullYear()} Churn Around Time</span>
          <span>Simple signals. Better conversations.</span>
          <Button size="small" onClick={() => setDialog('about')}>About these scores</Button>
        </div>
      </footer>
      <Dialogs dialog={dialog} onClose={() => setDialog('')} onConfirmAi={confirmAi} />
      <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={(_, reason) => reason !== 'clickaway' && setNotice('')} message={notice} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </div>
  );
}
