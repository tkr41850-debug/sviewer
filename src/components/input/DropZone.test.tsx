import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DropZone } from './DropZone';

describe('DropZone component', () => {
  it('renders with correct accessibility role and label', () => {
    render(<DropZone onFile={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'File drop zone' })).toBeInTheDocument();
  });

  it('renders the drop zone heading copy', () => {
    render(<DropZone onFile={vi.fn()} />);
    expect(screen.getByText('Drop JSON file or choose from disk')).toBeInTheDocument();
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<DropZone onFile={vi.fn()} disabled={true} />);
    const region = screen.getByRole('region', { name: 'File drop zone' });
    expect(region).toHaveAttribute('aria-disabled', 'true');
  });
});
