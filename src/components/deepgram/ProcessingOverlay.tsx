
import { useRef, useEffect } from 'react';

interface ProcessingOverlayProps {
  processingStatus: string;
}

export const ProcessingOverlay = ({ processingStatus }: ProcessingOverlayProps) => {
  const processingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (processingStatus) {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.setAttribute('inert', '');
      }
      processingRef.current?.focus();
    } else {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.removeAttribute('inert');
      }
    }
  }, [processingStatus]);

  return (
    <div
      ref={processingRef}
      tabIndex={-1}
      role="status"
      aria-live="assertive"
      className="sr-only"
    >
      {processingStatus}
    </div>
  );
};
