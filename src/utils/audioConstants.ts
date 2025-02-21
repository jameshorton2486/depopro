
export const CHUNK_SIZE = 128 * 1024; // 128KB chunks for better reliability
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size
export const TIMEOUT = 45000; // 45 second timeout
export const MAX_RETRIES = 5; // Maximum retries for failed chunks
export const MAX_CHUNK_SIZE = 256 * 1024; // 256KB max chunk size for Deepgram
export const BATCH_SIZE = 2; // Process 2 chunks at a time
export const BASE_RETRY_DELAY = 1000; // Base delay for exponential backoff
export const DEBUG = true; // Enable/disable debug logging

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
] as const;

export type SupportedAudioType = typeof SUPPORTED_AUDIO_TYPES[number];

// Error message constants
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  UNSUPPORTED_TYPE: 'Unsupported file type',
  EMPTY_FILE: 'File is empty',
  PROCESSING_ERROR: 'Error processing audio file',
  TIMEOUT_ERROR: 'Processing timeout',
  INVALID_RESPONSE: 'Invalid response from server',
  CHUNK_TOO_LARGE: 'Audio chunk exceeds size limit'
} as const;
