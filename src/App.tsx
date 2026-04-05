import { useEffect, useCallback } from 'react';
import { useDataState, useDataDispatch } from './stores/dataStore';
import { useFileLoader } from './hooks/useFileLoader';
import { parseAndProcess } from './data/parser';
import { DropZone } from './components/input/DropZone';
import { ProcessingIndicator } from './components/input/ProcessingIndicator';
import { ErrorMessage } from './components/input/ErrorMessage';
import { GraphView } from './components/chart/GraphView';
import './index.css';

const MAX_URL_DATA_BYTES = 50 * 1024; // 50KB safety limit (PITFALL 6)

function UploadPage() {
  const state = useDataState();
  const dispatch = useDataDispatch();
  const { loadFile } = useFileLoader();

  // URL parameter loading (LOAD-03)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (!data) return;

    if (data.length > MAX_URL_DATA_BYTES) {
      dispatch({
        type: 'LOADING_ERROR',
        payload: {
          code: 'MALFORMED_JSON',
          message: 'URL data parameter too large — use file upload for datasets over 50KB',
        },
      });
      return;
    }

    dispatch({ type: 'LOADING_START' });
    try {
      const result = parseAndProcess(decodeURIComponent(data));
      if (result.errors.length > 0) {
        dispatch({ type: 'LOADING_ERROR', payload: result.errors[0] });
      } else {
        dispatch({ type: 'LOADING_SUCCESS', payload: result });
      }
    } catch {
      dispatch({
        type: 'LOADING_ERROR',
        payload: {
          code: 'MALFORMED_JSON',
          message: 'Invalid JSON — check that the file is a valid slouch tracker export',
        },
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = useCallback(() => {
    // Reset to idle by navigating to path without query params
    window.location.href = window.location.pathname;
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full" style={{ maxWidth: '480px' }}>
        <h1
          className="mb-6 text-center font-semibold"
          style={{
            fontSize: '28px',
            lineHeight: '1.15',
            color: 'var(--color-text-primary)',
          }}
        >
          Drop your slouch data here
        </h1>

        {state.status === 'idle' && <DropZone onFile={loadFile} />}
        {state.status === 'loading' && <ProcessingIndicator />}
        {state.status === 'error' && <ErrorMessage error={state.error} onRetry={handleRetry} />}

        {state.status === 'idle' && (
          <p className="mt-4 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Or pass data via ?data= URL parameter
          </p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const state = useDataState();

  if (state.status === 'loaded') {
    return <GraphView records={state.result.records} metadata={state.result.metadata} />;
  }

  return <UploadPage />;
}
