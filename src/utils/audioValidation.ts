
import { MAX_FILE_SIZE, SUPPORTED_AUDIO_TYPES } from './audioConstants';

export const validateAudioFile = (file: Blob) => {
  const fileInfo: Record<string, any> = {
    type: file.type,
    size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    timestamp: new Date().toISOString()
  };

  if (file instanceof File) {
    fileInfo.lastModified = new Date(file.lastModified).toISOString();
  }

  console.debug('🔍 Validating audio file:', fileInfo);

  if (!SUPPORTED_AUDIO_TYPES.includes(file.type as any)) {
    console.error('❌ Unsupported file type:', {
      provided: file.type,
      supported: SUPPORTED_AUDIO_TYPES
    });
    throw new Error(`Unsupported file type: ${file.type}. Supported types: ${SUPPORTED_AUDIO_TYPES.join(', ')}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    console.error('❌ File too large:', {
      size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      maxSize: `${(MAX_FILE_SIZE / (1024 * 1024))}MB`
    });
    throw new Error(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds limit of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`);
  }

  if (file.size === 0) {
    console.error('❌ Empty file detected');
    throw new Error('File is empty');
  }

  console.debug('✅ File validation passed');
};
