
import { useRef, useEffect } from 'react';

interface ProcessingOverlayProps {
  processingStatus: string;
  progress: number;
}

export const ProcessingOverlay = ({ processingStatus, progress }: ProcessingOverlayProps) => {
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
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div
        ref={processingRef}
        role="status"
        aria-live="polite"
        className="text-center space-y-4"
      >
        <p className="text-lg font-medium">{processingStatus}</p>
        <div className="w-64">
          <div className="h-2 bg-primary/20 rounded-full">
            <div 
              className="h-2 bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
        </div>
      </div>
    </div>
  );
};
