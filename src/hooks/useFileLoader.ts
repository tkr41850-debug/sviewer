import { useCallback } from 'react';
// Vite worker import syntax — PITFALL 4: must use ?worker suffix, not new URL(...)
import ParserWorker from '../data/worker?worker';
import { useDataDispatch } from '../stores/dataStore';
import type { ParseResult, ParseError } from '../data/types';

interface WorkerSuccessResult {
  type: 'success';
  result: ParseResult;
}

interface WorkerErrorResult {
  type: 'error';
  error: string;
}

type WorkerResult = WorkerSuccessResult | WorkerErrorResult;

export function useFileLoader() {
  const dispatch = useDataDispatch();

  const loadFile = useCallback(
    (file: File) => {
      dispatch({ type: 'LOADING_START' });
      const worker = new ParserWorker();

      worker.onmessage = (e: MessageEvent<WorkerResult>) => {
        if (e.data.type === 'success') {
          dispatch({ type: 'LOADING_SUCCESS', payload: e.data.result });
        } else {
          const errorPayload: ParseError = {
            code: 'MALFORMED_JSON',
            message: e.data.error,
          };
          dispatch({
            type: 'LOADING_ERROR',
            payload: errorPayload,
          });
        }
        worker.terminate();
      };

      worker.onerror = (err) => {
        dispatch({
          type: 'LOADING_ERROR',
          payload: {
            code: 'MALFORMED_JSON',
            message: err.message || 'Worker error during file parsing',
          },
        });
        worker.terminate();
      };

      // FileReader runs on main thread (required to access File object)
      // Text is then sent to the Worker for heavy parsing
      const reader = new FileReader();
      reader.onload = (ev) => {
        worker.postMessage({ type: 'PARSE', text: ev.target!.result as string });
      };
      reader.onerror = () => {
        dispatch({
          type: 'LOADING_ERROR',
          payload: {
            code: 'MALFORMED_JSON',
            message: 'Invalid JSON — check that the file is a valid slouch tracker export',
          },
        });
        worker.terminate();
      };
      reader.readAsText(file);
    },
    [dispatch]
  );

  return { loadFile };
}
