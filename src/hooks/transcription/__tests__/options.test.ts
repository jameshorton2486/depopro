
import { describe, it, expect } from 'vitest';
import { enforceOptions } from '../options';
import { DeepgramOptions } from '@/types/deepgram';

describe('Options enforcement', () => {
  it('should enforce required options', () => {
    const userOptions = { model: 'nova-2', diarize: false };
    const result = enforceOptions(userOptions);
    
    expect(result).toEqual({
      model: 'nova-2',
      diarize: true,
      punctuate: true,
      smart_format: true,
      paragraphs: true,
      filler_words: true,
      utterances: true,
      language: 'en-US',
      formatting: {
        timestampFormat: "HH:mm:ss",
        enableDiarization: true,
        enableParagraphs: true,
        removeExtraSpaces: true,
        standardizePunctuation: true,
        boldSpeakerNames: true,
        highlightFillerWords: true
      }
    });
  });

  it('should preserve additional user options', () => {
    const userOptions = {
      model: 'nova-2',
      keywords: ['test'],
      utteranceThreshold: 0.5,
      formatting: {
        timestampFormat: "mm:ss" as const,
        enableDiarization: false,
        enableParagraphs: true,
        removeExtraSpaces: true,
        standardizePunctuation: true,
        boldSpeakerNames: false,
        highlightFillerWords: true
      }
    };
    const result = enforceOptions(userOptions);
    
    expect(result).toEqual({
      model: 'nova-2',
      keywords: ['test'],
      utteranceThreshold: 0.5,
      diarize: true,
      punctuate: true,
      smart_format: true,
      paragraphs: true,
      filler_words: true,
      utterances: true,
      language: 'en-US',
      formatting: userOptions.formatting
    });
  });
});
