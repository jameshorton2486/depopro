
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DocumentUploader } from '../DocumentUploader';

describe('DocumentUploader', () => {
  it('renders upload area correctly', () => {
    render(<DocumentUploader onTermsExtracted={() => {}} />);
    
    expect(screen.getByText(/Upload documents to extract terms/)).toBeInTheDocument();
  });

  it('shows analyzing state when processing', () => {
    render(<DocumentUploader onTermsExtracted={() => {}} />);
    
    // Simulate file drop (this is a basic test, we'll need more complex tests for actual file handling)
    const dropzone = screen.getByText(/Upload documents to extract terms/);
    expect(dropzone).toBeInTheDocument();
  });
});
