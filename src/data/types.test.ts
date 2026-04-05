import { describe, it, expect } from 'vitest';
import type {
  ChartAdapterProps,
  Annotation,
  ChartEngine,
  ComparisonState,
  PostureRecord,
} from './types';

describe('Phase 4 types', () => {
  it('ChartEngine is a union of recharts and visx', () => {
    const engine1: ChartEngine = 'recharts';
    const engine2: ChartEngine = 'visx';
    expect(engine1).toBe('recharts');
    expect(engine2).toBe('visx');
  });

  it('Annotation has required fields', () => {
    const annotation: Annotation = {
      id: 'test-id',
      text: 'My note',
      time: 1700000000000,
      deltaY: 12.5,
    };
    expect(annotation.id).toBe('test-id');
    expect(annotation.text).toBe('My note');
    expect(annotation.time).toBe(1700000000000);
    expect(annotation.deltaY).toBe(12.5);
  });

  it('ComparisonState has required fields', () => {
    const state: ComparisonState = {
      enabled: false,
      day1: null,
      day2: null,
    };
    expect(state.enabled).toBe(false);
    expect(state.day1).toBeNull();
    expect(state.day2).toBeNull();
  });

  it('ChartAdapterProps accepts minimal required props', () => {
    const props: ChartAdapterProps = {
      data: [],
      thresholdPx: 15,
      annotations: [],
    };
    expect(props.data).toEqual([]);
    expect(props.thresholdPx).toBe(15);
    expect(props.annotations).toEqual([]);
  });

  it('ChartAdapterProps accepts all optional props', () => {
    const record: PostureRecord = {
      time: 1700000000000,
      referenceY: 100,
      currentY: 112,
      deltaY: 12,
      isSlouching: false,
      isScreenOff: false,
      sessionIndex: 0,
    };
    const props: ChartAdapterProps = {
      data: [record],
      thresholdPx: 15,
      visibleDomain: [1700000000000, 1700003600000],
      onBrushChange: () => {},
      annotations: [{ id: 'a1', text: 'test', time: 1700000000000, deltaY: 12 }],
      onAnnotationCreate: () => {},
      onAnnotationUpdate: () => {},
      onAnnotationDelete: () => {},
      comparisonData: [record],
      comparisonLabel: 'Apr 03',
      primaryLabel: 'Apr 04',
      normalizeTimeAxis: true,
    };
    expect(props.data).toHaveLength(1);
    expect(props.visibleDomain).toEqual([1700000000000, 1700003600000]);
    expect(props.comparisonLabel).toBe('Apr 03');
    expect(props.primaryLabel).toBe('Apr 04');
    expect(props.normalizeTimeAxis).toBe(true);
  });
});
