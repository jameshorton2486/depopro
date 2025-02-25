
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KeytermForm } from '../KeytermForm';

describe('KeytermForm', () => {
  it('renders the form inputs correctly', () => {
    render(<KeytermForm onKeytermAdded={() => {}} />);
    
    expect(screen.getByPlaceholderText('Enter term')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Boost')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls onKeytermAdded when form is submitted with valid data', async () => {
    const onKeytermAdded = vi.fn();
    const { getByPlaceholderText, getByRole } = render(
      <KeytermForm onKeytermAdded={onKeytermAdded} />
    );

    // Fill in the form
    fireEvent.change(getByPlaceholderText('Enter term'), {
      target: { value: 'Test Term' },
    });
    fireEvent.change(getByPlaceholderText('Boost'), {
      target: { value: '2.0' },
    });
    
    // Submit the form
    fireEvent.click(getByRole('button'));

    // Verify that onKeytermAdded was called
    expect(onKeytermAdded).toHaveBeenCalled();
  });
});
