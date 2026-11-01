import { createTheme } from '@mui/material/styles';

// Colours that need to change between light and dark live in styles.css as --tokens.
// This theme only gives MUI's own components (buttons, dialogs, alerts) the same look.
const sans = '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif';
const display = '"Inter Tight", "Inter", system-ui, sans-serif';

export default createTheme({
  cssVariables: { colorSchemeSelector: '[data-theme="%s"]' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#111311', contrastText: '#ffffff' },
        secondary: { main: '#1f4fb8' },
        error: { main: '#b3261e' },
        success: { main: '#14573a' },
        warning: { main: '#7a5200' },
        background: { default: '#f5f6f1', paper: '#ffffff' },
        text: { primary: '#111311', secondary: '#454a44' },
        divider: '#dcded6',
      },
    },
    dark: {
      palette: {
        primary: { main: '#f1f3ee', contrastText: '#111311' },
        secondary: { main: '#9db9ff' },
        error: { main: '#f2766d' },
        success: { main: '#a6e3c0' },
        warning: { main: '#ffd980' },
        background: { default: '#101210', paper: '#181b18' },
        text: { primary: '#f1f3ee', secondary: '#c4c9c0' },
        divider: '#2c312b',
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: sans,
    h1: { fontFamily: display },
    h2: { fontFamily: display },
    h3: { fontFamily: display },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
  },
  components: {
    MuiButtonBase: { defaultProps: { disableRipple: true } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, minHeight: 44, padding: '8px 18px', lineHeight: 1.3, fontSize: '0.9375rem' },
        sizeSmall: { minHeight: 40, padding: '6px 14px' },
        outlined: ({ theme }) => ({
          borderColor: 'var(--control)',
          color: theme.vars.palette.text.primary,
          '&:hover': { borderColor: theme.vars.palette.text.primary, backgroundColor: 'var(--hover)' },
        }),
        text: ({ theme }) => ({ color: theme.vars.palette.text.primary, '&:hover': { backgroundColor: 'var(--hover)' } }),
        contained: { '&.Mui-disabled': { backgroundColor: 'var(--disabled-bg)', color: 'var(--disabled-ink)' } },
      },
    },
    MuiIconButton: { styleOverrides: { root: ({ theme }) => ({ color: theme.vars.palette.text.primary, '&:hover': { backgroundColor: 'var(--hover)' } }) } },
    MuiDialog: { defaultProps: { fullWidth: true, maxWidth: 'sm' } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiDialogTitle: { styleOverrides: { root: { fontFamily: display, fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.025em', padding: '24px 24px 8px' } } },
    MuiDialogContent: { styleOverrides: { root: { padding: '8px 24px 16px' } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '8px 24px 24px', gap: 8, flexWrap: 'wrap' } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 12, fontSize: '0.9375rem', alignItems: 'center' } } },
    MuiCheckbox: { styleOverrides: { root: ({ theme }) => ({ color: 'var(--control)', '&.Mui-checked': { color: theme.vars.palette.text.primary } }) } },
  },
});
