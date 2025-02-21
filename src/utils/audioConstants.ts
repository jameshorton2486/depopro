
export const CHUNK_SIZE = 500 * 1024; // 500KB chunks (reduced from 1MB)
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size
export const TIMEOUT = 30000; // 30 second timeout
export const MAX_RETRIES = 3;

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
] as const;
