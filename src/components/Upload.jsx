import { useId, useRef, useState } from 'react';
import { Button, Checkbox, FormControlLabel } from '@mui/material';
import { ArrowForward, CloudUploadOutlined, FolderOpenOutlined, Insights, ShieldOutlined, UploadFileOutlined, Close } from '@mui/icons-material';
import { checkFiles, MAX_FILES } from '../lib/files.js';

/** Shared by the Upload step and the small drop card on the Analyse step. */
export function useFilePicker({ alreadyAdded = [], onValid }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState('');

  async function take(list) {
    const files = [...(list || [])];
    if (!files.length) return;
    const message = await checkFiles(files, alreadyAdded);
    setProblem(message);
    if (!message) onValid(files);
  }

  const dropProps = {
    onDragOver: (e) => { e.preventDefault(); setDragging(true); },
    onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); },
    onDrop: (e) => { e.preventDefault(); setDragging(false); void take(e.dataTransfer.files); },
  };
  const inputProps = {
    ref: inputRef,
    type: 'file',
    hidden: true,
    multiple: true,
    accept: '.csv,.pdf,.xlsx',
    onChange: (e) => { void take(e.target.files); e.target.value = ''; },
  };
  return { inputRef, dragging, problem, dropProps, inputProps, browse: () => inputRef.current?.click() };
}

export function UploadStep({ files, setFiles, error, alreadyAdded, hasReview, canUseSample, aiConfigured, onAnalyse, onSample, onNewReview, onOpenSetup, onOpenPurchase }) {
  const [includeAI, setIncludeAI] = useState(false);
  const aiHelpId = useId();
  const picker = useFilePicker({ alreadyAdded, onValid: setFiles });
  const shownError = picker.problem || error;

  const analyse = () => (includeAI && !aiConfigured ? onOpenSetup() : onAnalyse(files, includeAI));

  return (
    <div className="upload-step">
      <h1 id="page-title" tabIndex={-1} className="display">Which customers<br className="wide-break" /> need you most?</h1>
      <p className="lede">
        Churn Around Time reads customer data and conversation notes, then helps you spot who may need a little extra attention, using clear, simple language.
        {hasReview && ' Files you add here are merged into your current review.'}
      </p>

      <div className={`dropzone${picker.dragging ? ' is-dragging' : ''}`} {...picker.dropProps}>
        <input {...picker.inputProps} />
        <span className="dropzone-icon" aria-hidden="true"><CloudUploadOutlined /></span>
        <p className="dropzone-title" aria-live="polite">{files.length ? 'Files ready to review' : 'Drop your files here to get started'}</p>
        <p className="muted">Customer data, call transcripts, or support notes</p>
        <Button variant="contained" size="large" startIcon={<FolderOpenOutlined />} onClick={picker.browse}>
          {files.length ? 'Choose different files' : 'Choose files'}
        </Button>
        <p className="hint">or drag and drop &nbsp;·&nbsp; up to {MAX_FILES} files &nbsp;·&nbsp; CSV, PDF, XLSX &nbsp;·&nbsp; 25 MB each</p>
      </div>

      {shownError && <p className="alert" role="alert">{shownError}</p>}

      {files.length > 0 && (
        <ul className="file-list" aria-label="Selected files">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`}>
              <UploadFileOutlined fontSize="small" />
              <span className="file-name">{file.name}</span>
              <button type="button" className="icon-btn" aria-label={`Remove ${file.name}`} onClick={() => setFiles(files.filter((_, i) => i !== index))}><Close fontSize="small" /></button>
            </li>
          ))}
        </ul>
      )}

      <div className="ai-choice">
        <FormControlLabel
          control={<Checkbox checked={includeAI} onChange={(e) => setIncludeAI(e.target.checked)} inputProps={{ 'aria-describedby': aiHelpId }} />}
          label={<span>Add AI sentiment analysis <span className="tag">Optional</span></span>}
        />
        <p className="muted" id={aiHelpId}>
          {aiConfigured
            ? 'If selected, you’ll review exactly what is shared before any customer details are sent to OpenAI.'
            : 'AI is not connected yet. Select it to see setup details; no customer data is sent until the key is connected and you confirm.'}
        </p>
        {!aiConfigured && <Button size="small" onClick={onOpenSetup}>AI setup</Button>}
      </div>

      <div className="upload-actions">
        <Button variant="contained" size="large" startIcon={<Insights />} disabled={!files.length} onClick={analyse}>Analyse files</Button>
        {canUseSample && <Button endIcon={<ArrowForward />} onClick={onSample}>Take a look with sample data</Button>}
        {hasReview && <Button onClick={onNewReview}>Start a new review</Button>}
      </div>

      <p className="privacy">
        <ShieldOutlined fontSize="small" />
        <span>No account or upload history in this preview. Files stay in this browser and are cleared when you leave. If you opt into AI review, selected customer details go to OpenAI only after you confirm.</span>
      </p>
    </div>
  );
}

export function DropCard({ alreadyAdded, onFiles }) {
  const picker = useFilePicker({ alreadyAdded, onValid: onFiles });
  const titleId = useId();
  return (
    <section className={`card drop-card${picker.dragging ? ' is-dragging' : ''}`} aria-labelledby={titleId} {...picker.dropProps}>
      <input {...picker.inputProps} />
      <span className="icon-tile" aria-hidden="true"><UploadFileOutlined /></span>
      <h2 id={titleId} className="h3">Bring your latest customer notes</h2>
      <p className="muted">Upload up to {MAX_FILES} CSV, Excel, or PDF files. We’ll organize the signals so you know where to start.</p>
      <Button variant="outlined" startIcon={<CloudUploadOutlined />} onClick={picker.browse}>Choose files or drop them here</Button>
      <p className="hint">CSV · XLSX · PDF &nbsp;·&nbsp; 25 MB max each</p>
      {picker.problem && <p className="alert" role="alert">{picker.problem}</p>}
    </section>
  );
}
