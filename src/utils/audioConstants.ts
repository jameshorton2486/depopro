
export const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for better context
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size
export const TIMEOUT = 60000; // 60 second timeout
export const MAX_RETRIES = 5; // Maximum retries for failed chunks
export const MAX_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB max chunk size for better diarization
export const BATCH_SIZE = 1; // Process 1 chunk at a time to maintain context
export const BASE_RETRY_DELAY = 1000; // Base delay for exponential backoff
export const DEBUG = true; // Enable/disable debug logging

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
  'audio/flac', 'audio/x-flac'
] as const;

export type SupportedAudioType = typeof SUPPORTED_AUDIO_TYPES[number];

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds maximum limit. Please reduce the file size or split into smaller segments.',
  UNSUPPORTED_TYPE: 'Unsupported file type. Please upload an audio or video file in MP3, WAV, FLAC, M4A, AAC, MP4, MOV, AVI, or WEBM format.',
  EMPTY_FILE: 'The uploaded file appears to be empty. Please check the file and try again.',
  PROCESSING_ERROR: 'Error processing audio file. Please ensure the file is not corrupted and try again.',
  TIMEOUT_ERROR: 'The processing request timed out. This may happen with large files - try splitting into smaller segments.',
  INVALID_RESPONSE: 'Invalid response received from the server. Please try again or contact support if the issue persists.',
  CHUNK_TOO_LARGE: 'Audio chunk exceeds size limit. Please try processing a smaller file.',
  AUTH_ERROR: 'Authentication failed. Please check your Deepgram API key and ensure it is valid.',
  RATE_LIMIT: 'Too many requests. Please wait a moment before trying again.',
  NETWORK_ERROR: 'Network connection error. Please check your internet connection and try again.'
} as const;
