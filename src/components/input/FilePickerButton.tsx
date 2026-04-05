import { useRef } from 'react';

interface FilePickerButtonProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function FilePickerButton({ onFile, disabled }: FilePickerButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <label
        htmlFor="file-picker"
        className="inline-flex items-center justify-center cursor-pointer select-none rounded-md px-4 font-medium text-sm transition-all duration-150"
        style={{
          minHeight: '44px', // accessibility minimum touch target
          background: 'var(--color-accent)',
          color: '#fff',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        Choose file
        <span className="sr-only">JSON files only (.json)</span>
      </label>
      <input
        id="file-picker"
        ref={inputRef}
        type="file"
        accept=".json"
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          // Reset so same file can be re-selected
          e.target.value = '';
        }}
      />
    </>
  );
}
