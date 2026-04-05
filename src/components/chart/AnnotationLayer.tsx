import { useState, useRef, useEffect } from 'react';
import type { Annotation } from '../../data/types';

interface AnnotationLayerProps {
  /** Current annotations to render. */
  annotations: Annotation[];
  /** Convert annotation time to X pixel position within the chart area. */
  timeToX: (time: number) => number;
  /** Convert annotation deltaY to Y pixel position within the chart area. */
  deltaYToY: (deltaY: number) => number;
  /** Callback to update annotation text. */
  onUpdate?: (id: string, text: string) => void;
  /** Callback to delete an annotation. */
  onDelete?: (id: string) => void;
  /** ID of annotation currently being created (empty text, needs input focus). null if none. */
  creatingId?: string | null;
}

/**
 * Single annotation marker with pin icon, text label, and inline editing.
 * Per D-07: click to create with inline text input.
 * Per D-08: flag/pin markers with truncated text (~20 chars), hover for full.
 * Per D-09: click to edit, X button to delete.
 */
function AnnotationMarker({
  annotation,
  x,
  y,
  isCreating,
  isEditing,
  onStartEdit,
  onUpdate,
  onDelete,
}: {
  annotation: Annotation;
  x: number;
  y: number;
  isCreating: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onUpdate?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const showInput = isCreating || isEditing;

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  return (
    <div
      className="absolute -translate-x-1/2 transform"
      style={{ left: x, top: y - 24, pointerEvents: 'auto' }}
      data-testid={`annotation-${annotation.id}`}
    >
      {/* Pin marker per D-08 */}
      <div className="flex flex-col items-center">
        <div
          className="h-3 w-3 rounded-full border-2"
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-bg)',
          }}
        />
        <div className="h-2 w-px" style={{ background: 'var(--color-accent)' }} />
      </div>

      {/* Text label or input */}
      {showInput ? (
        <input
          ref={inputRef}
          type="text"
          className="w-32 rounded border px-1 py-0.5 text-xs"
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            borderColor: 'var(--color-border)',
          }}
          defaultValue={annotation.text}
          placeholder="Add note..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const value = e.currentTarget.value.trim();
              if (value) {
                onUpdate?.(annotation.id, value);
              } else {
                onDelete?.(annotation.id);
              }
              onStartEdit(); // clears editing state (toggle off)
            }
            if (e.key === 'Escape') {
              if (!annotation.text) {
                onDelete?.(annotation.id);
              }
              onStartEdit(); // clears editing state (toggle off)
            }
          }}
          onBlur={(e) => {
            const value = e.currentTarget.value.trim();
            if (value) {
              onUpdate?.(annotation.id, value);
            } else {
              onDelete?.(annotation.id);
            }
          }}
        />
      ) : (
        <div className="group relative cursor-pointer" onClick={onStartEdit}>
          <span
            className="inline-block max-w-[120px] truncate whitespace-nowrap rounded px-1.5 py-0.5 text-xs"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
            title={annotation.text}
          >
            {annotation.text.length > 20 ? annotation.text.slice(0, 20) + '...' : annotation.text}
          </span>

          {/* Delete button per D-09 */}
          <button
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-xs opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              background: 'var(--color-destructive)',
              color: 'white',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(annotation.id);
            }}
            aria-label={`Delete annotation: ${annotation.text}`}
          >
            x
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Overlay layer rendering annotation markers positioned absolutely within the chart area.
 * Works for both Recharts and visx engines because it uses pixel coordinates
 * calculated from chart dimensions via timeToX/deltaYToY callbacks.
 *
 * Per D-10: Annotations are in-memory only and cleared on new file load.
 */
export function AnnotationLayer({
  annotations,
  timeToX,
  deltaYToY,
  onUpdate,
  onDelete,
  creatingId,
}: AnnotationLayerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  // When creatingId changes, clear any editing state
  useEffect(() => {
    if (creatingId) {
      setEditingId(null);
    }
  }, [creatingId]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ pointerEvents: 'none' }}
      data-testid="annotation-layer"
    >
      {annotations.map((ann) => (
        <AnnotationMarker
          key={ann.id}
          annotation={ann}
          x={timeToX(ann.time)}
          y={deltaYToY(ann.deltaY)}
          isCreating={creatingId === ann.id || ann.text === ''}
          isEditing={editingId === ann.id}
          onStartEdit={() => setEditingId(editingId === ann.id ? null : ann.id)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
