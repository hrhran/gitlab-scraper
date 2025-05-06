// src/renderer/theme.js
import { createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#f48fb1' },
    background: {
      default: '#303030',
      paper: '#424242',
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
    },
  },
  typography: {
    // Globally smaller font sizes
    fontSize: 13,
    h5: { fontSize: '1.1rem' },
    subtitle1: { fontSize: '0.9rem' },
    body1: { fontSize: '0.8rem' },
    body2: { fontSize: '0.75rem' },
    button: { textTransform: 'none', fontSize: '0.8rem' },
  },
  components: {
    // Example: reduce default padding on MUI Paper
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '8px',
        },
      },
    },
    // Example: reduce default spacing in MUI TextField
    MuiTextField: {
      defaultProps: {
        margin: 'dense',
      },
    },
  },
});

export default darkTheme;
