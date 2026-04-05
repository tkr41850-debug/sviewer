// Stub: Full implementation in Plan 04.
// This file exists only to prevent import errors in DropZone.test.tsx during Plan 03.
// The stub implements the minimal interface required by tests so the suite stays green.

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ disabled = false }: DropZoneProps) {
  return (
    <section aria-label="File drop zone" aria-disabled={disabled ? 'true' : undefined}>
      <p>Drop JSON file or choose from disk</p>
    </section>
  );
}
