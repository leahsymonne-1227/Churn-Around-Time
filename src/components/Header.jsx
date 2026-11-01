import { Button, IconButton } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { DarkModeOutlined, LightModeOutlined, PersonOutline } from '@mui/icons-material';
import { Brand } from './Parts.jsx';

export function Header({ onPurchase, onLogin }) {
  const { mode, systemMode, setMode } = useColorScheme();
  const dark = (mode === 'system' ? systemMode : mode) === 'dark';
  return (
    <header className="site-header">
      <div className="wrap bar">
        <Brand />
        <div className="bar-actions">
          <Button variant="contained" onClick={onPurchase}>Purchase full version</Button>
          <IconButton aria-label="Dark mode" aria-pressed={dark} onClick={() => setMode(dark ? 'light' : 'dark')}>
            {dark ? <LightModeOutlined /> : <DarkModeOutlined />}
          </IconButton>
          <Button startIcon={<PersonOutline />} onClick={onLogin}>Log in</Button>
        </div>
      </div>
    </header>
  );
}

const STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'analyse', label: 'Analyse' },
  { id: 'register', label: 'Customer register' },
];

export function Steps({ view, hasReview, onGo }) {
  return (
    <nav className="steps wrap" aria-label="Review steps">
      <ol>
        {STEPS.map(({ id, label }) => {
          const enabled = id === 'upload' || hasReview;
          return (
            <li key={id}>
              <button
                type="button"
                className="step"
                aria-current={view === id ? 'step' : undefined}
                aria-disabled={enabled ? undefined : true}
                title={enabled ? undefined : 'Upload files or open the sample data first'}
                onClick={() => enabled && onGo(id)}
              >
                <span className="step-dot" aria-hidden="true" />
                {label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
