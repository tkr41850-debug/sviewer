import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { ParseResult, ParseError } from '../data/types';

type DataState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; result: ParseResult }
  | { status: 'error'; error: ParseError };

export type DataAction =
  | { type: 'LOADING_START' }
  | { type: 'LOADING_SUCCESS'; payload: ParseResult }
  | { type: 'LOADING_ERROR'; payload: ParseError }
  | { type: 'RESET' };

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'LOADING_START':
      return { status: 'loading' };
    case 'LOADING_SUCCESS':
      return { status: 'loaded', result: action.payload };
    case 'LOADING_ERROR':
      return { status: 'error', error: action.payload };
    case 'RESET':
      return { status: 'idle' };
    default:
      return state;
  }
}

const DataStateContext = createContext<DataState | null>(null);
const DataDispatchContext = createContext<React.Dispatch<DataAction> | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, { status: 'idle' });
  return (
    <DataStateContext.Provider value={state}>
      <DataDispatchContext.Provider value={dispatch}>{children}</DataDispatchContext.Provider>
    </DataStateContext.Provider>
  );
}

export function useDataState(): DataState {
  const ctx = useContext(DataStateContext);
  if (!ctx) throw new Error('useDataState must be used within DataProvider');
  return ctx;
}

export function useDataDispatch(): React.Dispatch<DataAction> {
  const ctx = useContext(DataDispatchContext);
  if (!ctx) throw new Error('useDataDispatch must be used within DataProvider');
  return ctx;
}
