export function ProcessingIndicator() {
  return (
    <div
      className="flex flex-col items-center gap-3 py-8"
      aria-live="polite"
      aria-label="Processing data..."
    >
      {/* Spinner */}
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
        role="status"
      />
      <p className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
        Processing data...
      </p>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Parsing and validating your data
      </p>
    </div>
  );
}
