import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DataProvider } from './stores/dataStore';
import { ChartProvider } from './stores/chartStore';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <ChartProvider>
        <App />
      </ChartProvider>
    </DataProvider>
  </StrictMode>
);
