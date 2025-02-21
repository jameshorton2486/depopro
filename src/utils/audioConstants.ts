
export const CHUNK_SIZE = 250 * 1024; // 250KB chunks (reduced from 500KB)
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size
export const TIMEOUT = 45000; // 45 second timeout (increased from 30s)
export const MAX_RETRIES = 3;
export const MAX_CHUNK_SIZE = 1024 * 1024; // 1MB max chunk size for Deepgram

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
] as const;
