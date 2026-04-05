import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnnotationLayer } from './AnnotationLayer';
import type { Annotation } from '../../data/types';

const mockTimeToX = (time: number) => time / 1000; // simple mapping for tests
const mockDeltaYToY = (deltaY: number) => 200 - deltaY; // inverted Y

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'ann-1',
    text: 'Test note',
    time: 100000,
    deltaY: 10,
    ...overrides,
  };
}

describe('AnnotationLayer', () => {
  it('renders annotation markers for each annotation in the array', () => {
    const annotations = [
      makeAnnotation({ id: 'a1', text: 'First' }),
      makeAnnotation({ id: 'a2', text: 'Second' }),
      makeAnnotation({ id: 'a3', text: 'Third' }),
    ];

    render(
      <AnnotationLayer annotations={annotations} timeToX={mockTimeToX} deltaYToY={mockDeltaYToY} />
    );

    expect(screen.getByTestId('annotation-a1')).toBeDefined();
    expect(screen.getByTestId('annotation-a2')).toBeDefined();
    expect(screen.getByTestId('annotation-a3')).toBeDefined();
  });

  it('truncates text longer than 20 characters with "..." suffix', () => {
    const longText = 'This is a very long annotation text that should be truncated';
    const annotations = [makeAnnotation({ text: longText })];

    render(
      <AnnotationLayer annotations={annotations} timeToX={mockTimeToX} deltaYToY={mockDeltaYToY} />
    );

    // Displayed text should be first 20 chars + "..."
    const expected = longText.slice(0, 20) + '...';
    expect(screen.getByText(expected)).toBeDefined();
  });

  it('shows full text in title attribute for hover tooltip', () => {
    const longText = 'This is a very long annotation text for tooltip';
    const annotations = [makeAnnotation({ text: longText })];

    render(
      <AnnotationLayer annotations={annotations} timeToX={mockTimeToX} deltaYToY={mockDeltaYToY} />
    );

    const expected = longText.slice(0, 20) + '...';
    const textEl = screen.getByText(expected);
    expect(textEl.getAttribute('title')).toBe(longText);
  });

  it('clicking annotation text triggers edit mode (shows input)', () => {
    const annotations = [makeAnnotation({ text: 'Editable note' })];

    render(
      <AnnotationLayer
        annotations={annotations}
        timeToX={mockTimeToX}
        deltaYToY={mockDeltaYToY}
        onUpdate={vi.fn()}
      />
    );

    // Click the text to start editing
    const textEl = screen.getByText('Editable note');
    fireEvent.click(textEl);

    // Should now show an input
    const input = screen.getByPlaceholderText('Add note...');
    expect(input).toBeDefined();
    expect((input as HTMLInputElement).defaultValue).toBe('Editable note');
  });

  it('pressing Enter in input calls onUpdate with new text', () => {
    const onUpdate = vi.fn();
    const annotations = [makeAnnotation({ text: 'Old text' })];

    render(
      <AnnotationLayer
        annotations={annotations}
        timeToX={mockTimeToX}
        deltaYToY={mockDeltaYToY}
        onUpdate={onUpdate}
      />
    );

    // Click to edit
    fireEvent.click(screen.getByText('Old text'));

    // Type in the input and press Enter
    const input = screen.getByPlaceholderText('Add note...');
    fireEvent.change(input, { target: { value: 'New text' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onUpdate).toHaveBeenCalledWith('ann-1', 'New text');
  });

  it('pressing Escape on empty annotation calls onDelete', () => {
    const onDelete = vi.fn();
    // Annotation with empty text (just created)
    const annotations = [makeAnnotation({ text: '' })];

    render(
      <AnnotationLayer
        annotations={annotations}
        timeToX={mockTimeToX}
        deltaYToY={mockDeltaYToY}
        onDelete={onDelete}
        creatingId="ann-1"
      />
    );

    // Input should be shown (creating mode)
    const input = screen.getByPlaceholderText('Add note...');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onDelete).toHaveBeenCalledWith('ann-1');
  });

  it('renders delete button with correct aria-label', () => {
    const annotations = [makeAnnotation({ text: 'My note' })];

    render(
      <AnnotationLayer
        annotations={annotations}
        timeToX={mockTimeToX}
        deltaYToY={mockDeltaYToY}
        onDelete={vi.fn()}
      />
    );

    const deleteBtn = screen.getByLabelText('Delete annotation: My note');
    expect(deleteBtn).toBeDefined();
  });

  it('clicking delete button calls onDelete', () => {
    const onDelete = vi.fn();
    const annotations = [makeAnnotation({ text: 'To remove' })];

    render(
      <AnnotationLayer
        annotations={annotations}
        timeToX={mockTimeToX}
        deltaYToY={mockDeltaYToY}
        onDelete={onDelete}
      />
    );

    const deleteBtn = screen.getByLabelText('Delete annotation: To remove');
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith('ann-1');
  });

  it('annotation layer root has pointer-events none', () => {
    render(<AnnotationLayer annotations={[]} timeToX={mockTimeToX} deltaYToY={mockDeltaYToY} />);

    const layer = screen.getByTestId('annotation-layer');
    expect(layer.style.pointerEvents).toBe('none');
  });

  it('individual markers have pointer-events auto', () => {
    const annotations = [makeAnnotation()];

    render(
      <AnnotationLayer annotations={annotations} timeToX={mockTimeToX} deltaYToY={mockDeltaYToY} />
    );

    const marker = screen.getByTestId('annotation-ann-1');
    expect(marker.style.pointerEvents).toBe('auto');
  });
});
