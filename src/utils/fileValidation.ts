
export const SUPPORTED_TYPES = [
  'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
] as const;

export const validateFile = (file: File) => {
  console.debug('📁 Validating file:', {
    name: file.name,
    type: file.type,
    size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
  });

  if (!SUPPORTED_TYPES.includes(file.type as any)) {
    console.error('❌ Unsupported file type:', {
      providedType: file.type,
      supportedTypes: SUPPORTED_TYPES
    });
    throw new Error("Unsupported file type. Please upload an audio or video file.");
  }

  if (file.size > 2000 * 1024 * 1024) { // 2GB limit
    console.error('❌ File too large:', {
      size: `${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB`,
      maxSize: '2GB'
    });
    throw new Error("File is too large. Maximum size is 2GB.");
  }

  return true;
};
