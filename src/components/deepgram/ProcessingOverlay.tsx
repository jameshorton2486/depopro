
import { useRef, useEffect } from 'react';

interface ProcessingOverlayProps {
  isProcessing: boolean;
  processingStatus: string;
}

export const ProcessingOverlay = ({ isProcessing, processingStatus }: ProcessingOverlayProps) => {
  const processingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isProcessing) {
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
  }, [isProcessing]);

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
