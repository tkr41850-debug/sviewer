import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ChartProvider, useChartState, useChartDispatch } from './chartStore';

function wrapper({ children }: { children: ReactNode }) {
  return <ChartProvider>{children}</ChartProvider>;
}

describe('ChartStore', () => {
  it('initializes with activeEngine=recharts, empty annotations, comparison disabled', () => {
    const { result } = renderHook(() => useChartState(), { wrapper });
    expect(result.current.activeEngine).toBe('recharts');
    expect(result.current.annotations).toEqual([]);
    expect(result.current.comparison).toEqual({
      enabled: false,
      day1: null,
      day2: null,
    });
  });

  it('SET_ENGINE updates activeEngine to visx', () => {
    const { result } = renderHook(
      () => ({ state: useChartState(), dispatch: useChartDispatch() }),
      { wrapper }
    );

    act(() => {
      result.current.dispatch({ type: 'SET_ENGINE', payload: 'visx' });
    });

    expect(result.current.state.activeEngine).toBe('visx');
  });

  it('ADD_ANNOTATION appends an annotation to the array', () => {
    const { result } = renderHook(
      () => ({ state: useChartState(), dispatch: useChartDispatch() }),
      { wrapper }
    );

    const annotation = {
      id: 'ann-1',
      text: 'Slouch here',
      time: 1700000000000,
      deltaY: 15,
    };

    act(() => {
      result.current.dispatch({ type: 'ADD_ANNOTATION', payload: annotation });
    });

    expect(result.current.state.annotations).toHaveLength(1);
    expect(result.current.state.annotations[0]).toEqual(annotation);
  });

  it('UPDATE_ANNOTATION updates text of annotation matching ID', () => {
    const { result } = renderHook(
      () => ({ state: useChartState(), dispatch: useChartDispatch() }),
      { wrapper }
    );

    const annotation = {
      id: 'ann-1',
      text: 'Original text',
      time: 1700000000000,
      deltaY: 15,
    };

    act(() => {
      result.current.dispatch({ type: 'ADD_ANNOTATION', payload: annotation });
    });

    act(() => {
      result.current.dispatch({
        type: 'UPDATE_ANNOTATION',
        payload: { id: 'ann-1', text: 'Updated text' },
      });
    });

    expect(result.current.state.annotations[0].text).toBe('Updated text');
    expect(result.current.state.annotations[0].id).toBe('ann-1');
    expect(result.current.state.annotations[0].time).toBe(1700000000000);
  });

  it('DELETE_ANNOTATION removes annotation matching ID', () => {
    const { result } = renderHook(
      () => ({ state: useChartState(), dispatch: useChartDispatch() }),
      { wrapper }
    );

    act(() => {
      result.current.dispatch({
        type: 'ADD_ANNOTATION',
        payload: { id: 'ann-1', text: 'First', time: 1700000000000, deltaY: 10 },
      });
      result.current.dispatch({
        type: 'ADD_ANNOTATION',
        payload: { id: 'ann-2', text: 'Second', time: 1700001000000, deltaY: 20 },
      });
    });

    act(() => {
      result.current.dispatch({ type: 'DELETE_ANNOTATION', payload: 'ann-1' });
    });

    expect(result.current.state.annotations).toHaveLength(1);
    expect(result.current.state.annotations[0].id).toBe('ann-2');
  });

  it('SET_COMPARISON updates comparison state with partial merge', () => {
    const { result } = renderHook(
      () => ({ state: useChartState(), dispatch: useChartDispatch() }),
      { wrapper }
    );

    act(() => {
      result.current.dispatch({
        type: 'SET_COMPARISON',
        payload: { enabled: true, day1: '2024-04-03' },
      });
    });

    expect(result.current.state.comparison.enabled).toBe(true);
    expect(result.current.state.comparison.day1).toBe('2024-04-03');
    expect(result.current.state.comparison.day2).toBeNull();

    act(() => {
      result.current.dispatch({
        type: 'SET_COMPARISON',
        payload: { day2: '2024-04-04' },
      });
    });

    expect(result.current.state.comparison.enabled).toBe(true);
    expect(result.current.state.comparison.day1).toBe('2024-04-03');
    expect(result.current.state.comparison.day2).toBe('2024-04-04');
  });

  it('CLEAR_ANNOTATIONS empties the annotations array', () => {
    const { result } = renderHook(
      () => ({ state: useChartState(), dispatch: useChartDispatch() }),
      { wrapper }
    );

    act(() => {
      result.current.dispatch({
        type: 'ADD_ANNOTATION',
        payload: { id: 'ann-1', text: 'First', time: 1700000000000, deltaY: 10 },
      });
      result.current.dispatch({
        type: 'ADD_ANNOTATION',
        payload: { id: 'ann-2', text: 'Second', time: 1700001000000, deltaY: 20 },
      });
    });

    expect(result.current.state.annotations).toHaveLength(2);

    act(() => {
      result.current.dispatch({ type: 'CLEAR_ANNOTATIONS' });
    });

    expect(result.current.state.annotations).toEqual([]);
  });

  it('useChartState throws when used outside ChartProvider', () => {
    expect(() => {
      renderHook(() => useChartState());
    }).toThrow('useChartState must be used within ChartProvider');
  });

  it('useChartDispatch throws when used outside ChartProvider', () => {
    expect(() => {
      renderHook(() => useChartDispatch());
    }).toThrow('useChartDispatch must be used within ChartProvider');
  });
});
