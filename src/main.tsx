import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DataProvider } from './stores/dataStore';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </StrictMode>
);
