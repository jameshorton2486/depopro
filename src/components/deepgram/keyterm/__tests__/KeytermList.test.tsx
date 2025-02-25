
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KeytermList } from '../KeytermList';

const mockKeyterms = [
  { id: '1', term: 'Test Term 1', boost: 1.5, category: 'legal' as const },
  { id: '2', term: 'Test Term 2', boost: 2.0, category: 'medical' as const },
];

describe('KeytermList', () => {
  it('renders loading state correctly', () => {
    render(<KeytermList keyterms={[]} isLoading={true} onKeytermDeleted={() => {}} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders keyterms correctly', () => {
    render(
      <KeytermList
        keyterms={mockKeyterms}
        isLoading={false}
        onKeytermDeleted={() => {}}
      />
    );

    expect(screen.getByText('Test Term 1')).toBeInTheDocument();
    expect(screen.getByText('Test Term 2')).toBeInTheDocument();
  });

  it('calls onKeytermDeleted when delete button is clicked', () => {
    const onKeytermDeleted = vi.fn();
    render(
      <KeytermList
        keyterms={mockKeyterms}
        isLoading={false}
        onKeytermDeleted={onKeytermDeleted}
      />
    );

    const deleteButtons = screen.getAllByRole('button');
    fireEvent.click(deleteButtons[0]);

    expect(onKeytermDeleted).toHaveBeenCalledWith('1');
  });
});
