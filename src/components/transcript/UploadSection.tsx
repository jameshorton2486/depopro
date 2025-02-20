
interface UploadSectionProps {
  children: React.ReactNode;
}

const UploadSection = ({ children }: UploadSectionProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Upload Transcript for Correction</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Upload your transcript file (DOCX or TXT) for automated correction
      </p>
      {children}
    </div>
  );
};

export default UploadSection;
