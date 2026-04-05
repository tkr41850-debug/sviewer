import { useState, useCallback, type DragEvent, type KeyboardEvent } from 'react';
import clsx from 'clsx';
import { Upload } from 'lucide-react';
import { FilePickerButton } from './FilePickerButton';

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFile, disabled = false }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile, disabled]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Trigger the hidden file input inside FilePickerButton
      const input = document.getElementById('file-picker') as HTMLInputElement | null;
      input?.click();
    }
  };

  return (
    <div
      role="region"
      aria-label="File drop zone"
      aria-disabled={disabled ? 'true' : undefined}
      tabIndex={disabled ? -1 : 0}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onKeyDown={handleKeyDown}
      className={clsx(
        'rounded-xl border-2 border-dashed transition-all duration-150',
        'flex flex-col items-center justify-center gap-4 p-8 outline-none',
        'focus-visible:ring-2 focus-visible:ring-offset-2',
        isDragOver && !disabled ? 'scale-[0.99]' : 'active:scale-[0.99]'
      )}
      style={{
        minHeight: '200px',
        background:
          isDragOver && !disabled
            ? 'color-mix(in oklch, var(--color-accent) 8%, var(--color-surface))'
            : 'var(--color-surface)',
        borderColor: isDragOver && !disabled ? 'var(--color-accent)' : 'var(--color-border)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <Upload
        className="w-8 h-8"
        style={{ color: isDragOver ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
        aria-hidden="true"
      />
      <div className="text-center">
        <p className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
          {isDragOver && !disabled ? 'Drop to load' : 'Drop JSON file or choose from disk'}
        </p>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Accepts .json files from the slouch tracker
        </p>
      </div>
      <FilePickerButton onFile={onFile} disabled={disabled} />
    </div>
  );
}
