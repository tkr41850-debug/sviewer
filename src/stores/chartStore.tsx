import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { ChartEngine, Annotation, ComparisonState } from '../data/types';

export interface ChartState {
  activeEngine: ChartEngine;
  annotations: Annotation[];
  comparison: ComparisonState;
}

export type ChartAction =
  | { type: 'SET_ENGINE'; payload: ChartEngine }
  | { type: 'ADD_ANNOTATION'; payload: Annotation }
  | { type: 'UPDATE_ANNOTATION'; payload: { id: string; text: string } }
  | { type: 'DELETE_ANNOTATION'; payload: string }
  | { type: 'CLEAR_ANNOTATIONS' }
  | { type: 'SET_COMPARISON'; payload: Partial<ComparisonState> };

const initialChartState: ChartState = {
  activeEngine: 'recharts',
  annotations: [],
  comparison: { enabled: false, day1: null, day2: null },
};

function chartReducer(state: ChartState, action: ChartAction): ChartState {
  switch (action.type) {
    case 'SET_ENGINE':
      return { ...state, activeEngine: action.payload };
    case 'ADD_ANNOTATION':
      return { ...state, annotations: [...state.annotations, action.payload] };
    case 'UPDATE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.map((a) =>
          a.id === action.payload.id ? { ...a, text: action.payload.text } : a
        ),
      };
    case 'DELETE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.filter((a) => a.id !== action.payload),
      };
    case 'CLEAR_ANNOTATIONS':
      return { ...state, annotations: [] };
    case 'SET_COMPARISON':
      return { ...state, comparison: { ...state.comparison, ...action.payload } };
    default:
      return state;
  }
}

const ChartStateContext = createContext<ChartState | null>(null);
const ChartDispatchContext = createContext<React.Dispatch<ChartAction> | null>(null);

export function ChartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chartReducer, initialChartState);
  return (
    <ChartStateContext.Provider value={state}>
      <ChartDispatchContext.Provider value={dispatch}>{children}</ChartDispatchContext.Provider>
    </ChartStateContext.Provider>
  );
}

export function useChartState(): ChartState {
  const ctx = useContext(ChartStateContext);
  if (!ctx) throw new Error('useChartState must be used within ChartProvider');
  return ctx;
}

export function useChartDispatch(): React.Dispatch<ChartAction> {
  const ctx = useContext(ChartDispatchContext);
  if (!ctx) throw new Error('useChartDispatch must be used within ChartProvider');
  return ctx;
}
