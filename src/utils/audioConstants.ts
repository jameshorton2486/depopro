
export const CHUNK_SIZE = 512 * 1024; // 512KB chunks for better reliability
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size
export const TIMEOUT = 45000; // 45 second timeout
export const MAX_RETRIES = 5; // Increased retries
export const MAX_CHUNK_SIZE = 1024 * 1024; // 1MB max chunk size for Deepgram
export const BATCH_SIZE = 2; // Process 2 chunks at a time
export const BASE_RETRY_DELAY = 1000; // Base delay for exponential backoff

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
] as const;

// Debug constants
export const DEBUG = true; // Enable/disable debug logging
export const SIMULATE_ERRORS = false; // For testing error handling
