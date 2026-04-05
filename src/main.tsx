import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DataProvider } from './stores/dataStore';
import { ThemeProvider } from './stores/themeStore';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </DataProvider>
  </StrictMode>
);
