import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, StyledEngineProvider } from '@mui/material';
import { ThemeProvider, useColorScheme } from '@mui/material/styles';
import App from './App.jsx';
import theme from './theme.js';
import './styles.css';

const root = document.documentElement;
const fromHost = () => {
  const value = root.getAttribute('data-theme');
  return value === 'light' || value === 'dark' ? value : null;
};

/** When the page is embedded in a host that sets its own light/dark choice, follow it. */
function FollowHostTheme() {
  const { setMode } = useColorScheme();
  useEffect(() => {
    const observer = new MutationObserver(() => { const mode = fromHost(); if (mode) setMode(mode); });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [setMode]);
  return null;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* injectFirst puts MUI's styles ahead of styles.css, so our own rules win at equal specificity. */}
    <StyledEngineProvider injectFirst>
      {/* storageManager={null}: the light/dark choice is not written to browser storage either. */}
      <ThemeProvider theme={theme} defaultMode={fromHost() || 'system'} storageManager={null}>
        <CssBaseline />
        <FollowHostTheme />
        <App />
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>,
);
