import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DataProvider } from './stores/dataStore';
import { ChartProvider } from './stores/chartStore';
import { ThemeProvider } from './stores/themeStore';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <DataProvider>
        <ChartProvider>
          <App />
        </ChartProvider>
      </DataProvider>
    </ThemeProvider>
  </StrictMode>
);
