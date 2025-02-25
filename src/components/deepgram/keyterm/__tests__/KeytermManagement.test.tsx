
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KeytermManagement } from '../../KeytermManagement';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        data: [],
        error: null,
      }),
    }),
  },
}));

describe('KeytermManagement', () => {
  it('renders all child components', () => {
    render(<KeytermManagement onKeytermsChange={() => {}} />);
    
    // Check if main components are rendered
    expect(screen.getByText('Add New Keyterm')).toBeInTheDocument();
    expect(screen.getByText('Upload Documents')).toBeInTheDocument();
  });

  it('loads keyterms on mount', () => {
    const onKeytermsChange = vi.fn();
    render(<KeytermManagement onKeytermsChange={onKeytermsChange} />);
    
    // Verify that onKeytermsChange was called during initial load
    expect(onKeytermsChange).toHaveBeenCalled();
  });
});
