import { AlertCircle } from 'lucide-react';
import type { ParseError } from '../../data/types';

interface ErrorMessageProps {
  error: ParseError;
  onRetry?: () => void;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div
      className="rounded-lg p-6 border"
      style={{
        borderColor: 'var(--color-destructive)',
        background: 'var(--color-surface)',
      }}
      aria-live="assertive"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          style={{ color: 'var(--color-destructive)' }}
          aria-hidden="true"
        />
        <div>
          <p className="font-semibold text-base" style={{ color: 'var(--color-destructive)' }}>
            Could not load file
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
            {error.message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm underline"
              style={{ color: 'var(--color-accent)' }}
            >
              Try another file
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
